// ClawPark Discord Coordinator Bot.
// Uses deterministic replies for stateful/specimen-aware flows and LLM fallback for general chat.
// Trigger: @ClawPark mention, plain-text bot references, role mentions, or !breed prefix.

import { AttachmentBuilder, Client, Events, GatewayIntentBits, type Message } from 'discord.js';
import type { OrchestratorDeps, RequesterIdentity, ResolvedSpecimen, SpecimenProfile } from '../src/types/breedingIntent.ts';
import { access, writeFile, mkdir, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { randomInt, randomUUID } from 'node:crypto';
import { parseDiscordMessage, stripBotPrefix } from './discordIntent.ts';
import { createOpenRouterClient } from './openrouter.ts';
import { summarizeSkills, summarizeSoul, summarizeTools } from '../src/engine/openclaw.ts';
import {
  cancelIntent,
  checkEligibilityAndConsent,
  createIntent,
  executeBreed,
  getUserLastIntent,
  markIntentSaved,
  setIntentSteeringQuestion,
  setIntentSteeringResponse,
  setUserLastIntent,
  suggestCandidates,
} from './breedingOrchestrator.ts';

export interface DiscordBotDeps {
  token: string;
  orchestratorDeps: OrchestratorDeps;
  importSpecimen?: (zipPath: string, discordUserId: string) => Promise<{ specimenName: string; specimenId: string }>;
  allowLocalZipPathImport?: boolean;
  exportSpecimenBundle?: (specimenId: string) => Promise<{ filename: string; buffer: Buffer } | null>;
}

interface MentionedUser {
  id: string;
  displayName: string;
}

type CandidateReplyMode = 'available-specimens' | 'partner-options';
interface CandidateMemory {
  candidates: Array<{ specimenId: string; name: string }>;
  mode: CandidateReplyMode;
  updatedAt: number;
}

const PERSUADE_MEMORY_MS = 15 * 60 * 1000;
const persuadeMemory = new Map<string, { targets: MentionedUser[]; updatedAt: number }>();
const candidateMemory = new Map<string, CandidateMemory>();
const specimenFocusMemory = new Map<string, { specimenId: string; updatedAt: number }>();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsPlainBotReference(message: string, names: string[]) {
  const normalizedNames = names.map((name) => name.trim()).filter(Boolean);
  return normalizedNames.some((name) => {
    const pattern = new RegExp(`(^|\\s)@?${escapeRegExp(name)}(?=\\s|$|[.!?,:;])`, 'i');
    return pattern.test(message);
  });
}

export function isLikelyPersuadeFollowUp(message: string) {
  return /this guy|do again|again|keep continuing|continue|check above|above zip|same guy|same user|retry|한번 더|다시/i.test(message);
}

export function isSpecimenInventoryQuestion(message: string) {
  return /what claws|what specimens|name all|list all|show all|available claws|available specimens|what do you have|how many claws|which claws|specimen details/i.test(message.toLowerCase());
}

export function isCountQuestion(message: string) {
  return /how many claws|how many specimens|count.*claws|count.*specimens/i.test(message.toLowerCase());
}

export function isSpecimenDetailQuestion(message: string) {
  return /what's the name of that claw|what is the name of that claw|show me my specimen details|tell me the details of|details of new|what traits does it have|details for|details about/i.test(message.toLowerCase());
}

export function isInheritanceQuestion(message: string) {
  return /what things changed|what changed|inherited from|inherit|lineage details|what did it inherit|from its parent/i.test(message.toLowerCase());
}

export function isExportQuestion(message: string) {
  const lower = message.toLowerCase();
  return /\b(download(?:[-\s]?able)?|export)\b/.test(lower)
    || /\bzip(?:\s+file)?\b/.test(lower)
    || /내려받|다운로드/.test(lower);
}

export function extractNumberSelections(message: string) {
  const matches = [...message.matchAll(/\b([1-9]\d*)\b/g)].map((match) => Number(match[1]));
  return matches.filter((value, index) => matches.indexOf(value) === index);
}

export function wantsUseAllVisibleCandidates(message: string) {
  return /got for 2 claws|got two claws|use the two claws|those two|both of them|all two/i.test(message.toLowerCase());
}

export function isRandomBreedRequest(message: string) {
  const lower = message.toLowerCase();
  const hasBreedVerb = /\bbreed\b|교배/.test(lower);
  const hasRandomPickLanguage = /random|randomly|pick|choose|select|아무거나|랜덤/.test(lower);
  return hasBreedVerb && hasRandomPickLanguage;
}

export function extractLocalZipPath(message: string) {
  const match = message.match(/((?:\/|~\/|\.\/)[^\s"'`]+\.zip)\b/i);
  return match?.[1] ?? null;
}

function normalizeLocalZipPath(zipPath: string, cwd = process.cwd()) {
  if (zipPath.startsWith('~/')) {
    return resolve(homedir(), zipPath.slice(2));
  }
  return isAbsolute(zipPath) ? resolve(zipPath) : resolve(cwd, zipPath);
}

export function isAllowedLocalZipPath(zipPath: string, cwd = process.cwd()) {
  const normalized = normalizeLocalZipPath(zipPath, cwd);
  const allowedRoots = [resolve(tmpdir()), resolve('/tmp'), resolve(cwd)];
  return normalized.toLowerCase().endsWith('.zip')
    && allowedRoots.some((root) => normalized === root || normalized.startsWith(`${root}${sep}`));
}

function rememberPersuadeTargets(authorId: string, targets: MentionedUser[]) {
  if (targets.length === 0) return;
  persuadeMemory.set(authorId, { targets, updatedAt: Date.now() });
}

function getRememberedPersuadeTargets(authorId: string) {
  const memory = persuadeMemory.get(authorId);
  if (!memory) return [];
  if (Date.now() - memory.updatedAt > PERSUADE_MEMORY_MS) {
    persuadeMemory.delete(authorId);
    return [];
  }
  return memory.targets;
}

export function resolvePersuadeTargets(currentTargets: MentionedUser[], rememberedTargets: MentionedUser[], message: string) {
  if (currentTargets.length > 0) return currentTargets;
  if (isLikelyPersuadeFollowUp(message)) return rememberedTargets;
  return [];
}

export function displayCandidateName(candidate: { name?: string; specimenId: string }) {
  const name = candidate.name?.trim();
  return name && name.length > 0 ? name : candidate.specimenId;
}

export function formatCandidateSuggestionsReply(
  candidates: Array<{ specimenId: string; name?: string; compatibilitySummary: string; eligibleForAutoApprove: boolean }>,
  mode: CandidateReplyMode,
  targetName?: string,
) {
  if (candidates.length === 0) {
    return 'I do not currently see any breedable claws in the park. Upload or claim a specimen first, then try again.';
  }

  const lines = candidates.map((candidate, index) => {
    const label = displayCandidateName(candidate);
    return `${index + 1}. **${label}** — ${candidate.compatibilitySummary}`;
  });

  if (mode === 'available-specimens') {
    return [
      'Here are the claws currently in the park:',
      '',
      ...lines,
      '',
      'Reply with **two specimen names** to start breeding, for example: `breed Ridgeback with Orchid Glass`.',
    ].join('\n');
  }

  return [
    `Here are the available breeding partners${targetName ? ` for **${targetName}**` : ''}:`,
    '',
    ...lines,
    '',
    'You can say **"proceed"** to use the first option, or reply with a specific specimen name.',
  ].join('\n');
}

function rememberCandidateList(authorId: string, candidates: Array<{ specimenId: string; name: string }>, mode: CandidateReplyMode) {
  if (candidates.length === 0) return;
  candidateMemory.set(authorId, { candidates, mode, updatedAt: Date.now() });
}

function getRememberedCandidateList(authorId: string) {
  const memory = candidateMemory.get(authorId);
  if (!memory) return null;
  if (Date.now() - memory.updatedAt > PERSUADE_MEMORY_MS) {
    candidateMemory.delete(authorId);
    return null;
  }
  return memory;
}

function rememberFocusedSpecimen(authorId: string, specimenId: string) {
  specimenFocusMemory.set(authorId, { specimenId, updatedAt: Date.now() });
}

function getRememberedFocusedSpecimen(authorId: string) {
  const memory = specimenFocusMemory.get(authorId);
  if (!memory) return null;
  if (Date.now() - memory.updatedAt > PERSUADE_MEMORY_MS) {
    specimenFocusMemory.delete(authorId);
    return null;
  }
  return memory.specimenId;
}

function findSpecimenNamesInText(message: string, specimens: ResolvedSpecimen[]) {
  const lower = message.toLowerCase();
  return specimens
    .filter((specimen) => specimen.name && lower.includes(specimen.name.toLowerCase()))
    .map((specimen) => specimen.id);
}

export function formatSpecimenSummary(profile: SpecimenProfile) {
  const soulTraits = profile.claw.soul.traits.map((trait) => trait.label).join(', ') || 'None';
  const skills = profile.claw.skills.badges.map((skill) => skill.label).join(', ') || 'None';
  const tools = profile.claw.tools?.loadout.map((tool) => tool.label).join(', ') || 'None';
  return [
    `Here are the details for **${profile.name}**:`,
    '',
    `- ID: \`${profile.id}\``,
    `- Archetype: ${profile.claw.archetype}`,
    `- Generation: ${profile.claw.generation}`,
    `- Ownership: ${profile.ownershipState ?? 'unknown'}`,
    `- Breed state: ${profile.breedState ?? (profile.breedable ? 'ready' : 'not ready')}`,
    `- Soul traits: ${soulTraits}`,
    `- Skills: ${skills}`,
    `- Tools: ${tools}`,
    '',
    `Soul summary: ${summarizeSoul(profile.claw)}`,
    `Skills summary: ${summarizeSkills(profile.claw)}`,
    `Tools summary: ${summarizeTools(profile.claw)}`,
  ].join('\n');
}

export function formatInheritanceReply(profile: SpecimenProfile, deps: OrchestratorDeps) {
  const lineage = profile.claw.lineage;
  if (!lineage?.inheritanceMap || lineage.inheritanceMap.length === 0) {
    return `I do not have detailed inheritance records for **${profile.name}** yet.`;
  }

  const parentAName = profile.parentAId ? deps.resolveSpecimenById(profile.parentAId)?.name ?? profile.parentAId : 'Unknown';
  const parentBName = profile.parentBId ? deps.resolveSpecimenById(profile.parentBId)?.name ?? profile.parentBId : 'Unknown';
  const items = lineage.inheritanceMap.slice(0, 10).map((record) => `- ${record.label} (${record.type}) ← ${record.origin}`);
  return [
    `Here is what **${profile.name}** inherited or changed from its parents:`,
    '',
    `- Parent A: ${parentAName}`,
    `- Parent B: ${parentBName}`,
    '',
    ...items,
  ].join('\n');
}

export function formatCountReply(allSpecimens: ResolvedSpecimen[], requesterId: string) {
  const total = allSpecimens.length;
  const owned = allSpecimens.filter((specimen) => specimen.ownerId === requesterId).length;
  const breedable = allSpecimens.filter((specimen) => specimen.breedable).length;
  return [
    'Current park counts:',
    '',
    `- Registry claws: ${total}`,
    `- Owned by you: ${owned}`,
    `- Breedable right now: ${breedable}`,
  ].join('\n');
}

function hasFollowUpContext(authorId: string) {
  return Boolean(
    getRememberedFocusedSpecimen(authorId)
    || getRememberedCandidateList(authorId)
    || getRememberedPersuadeTargets(authorId).length > 0
    || getUserLastIntent(authorId),
  );
}

function isStructuredFollowUpMessage(message: string) {
  return isCountQuestion(message)
    || isSpecimenInventoryQuestion(message)
    || isSpecimenDetailQuestion(message)
    || isInheritanceQuestion(message)
    || isExportQuestion(message)
    || isRandomBreedRequest(message)
    || isLikelyPersuadeFollowUp(message)
    || wantsUseAllVisibleCandidates(message)
    || extractNumberSelections(message).length > 0
    || /\b(proceed|cancel|breed)\b|진행|취소|교배/i.test(message);
}

export function chooseRandomUniqueSpecimens(specimens: ResolvedSpecimen[], count: number) {
  if (count <= 0 || specimens.length === 0) return [];
  if (count >= specimens.length) return [...specimens];

  const pool = [...specimens];
  const chosen: ResolvedSpecimen[] = [];
  while (chosen.length < count && pool.length > 0) {
    const index = randomInt(pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
}

export function formatRandomBreedSuccessReply(params: {
  chosen: ResolvedSpecimen[];
  breedableCount: number;
  childName: string;
  childId?: string;
  lineageSummary: string;
}) {
  const [parentA, parentB] = params.chosen;
  return [
    '🎲 Random breeding complete!',
    '',
    `I picked **${parentA.name}** and **${parentB.name}** from the **${params.breedableCount}** breedable claws currently in the park.`,
    '',
    `🧬 Parents: **${parentA.name}** × **${parentB.name}**`,
    `✨ Child: **${params.childName}**${params.childId ? ` (\`${params.childId}\`)` : ''}`,
    `🌱 Lineage: ${params.lineageSummary}`,
    '',
    'Want the new specimen details or inheritance summary next?',
  ].join('\n');
}

function describeBreedingPair(pair: ResolvedSpecimen[]) {
  return pair.map((specimen) => specimen.name).join(' + ');
}

function defaultSteeringPrompt(pair: ResolvedSpecimen[]) {
  return `Blend ${describeBreedingPair(pair)} into a child that feels balanced, useful, and distinct in the park.`;
}

async function generateBreedingInterviewQuestion(pair: ResolvedSpecimen[], randomPick = false) {
  return generateResponse(
    `You are helping a user steer a ClawPark breeding run. Parents: ${describeBreedingPair(pair)}. Inspired by natural-language feedback loops like MetaClaw and OpenClaw-RL, ask exactly one short follow-up question that helps steer the offspring's soul, skills, tools, or vibe before breeding.${randomPick ? ' Mention that the pair was randomly chosen.' : ''} Keep it under 55 words and end by telling the user to answer in 1-2 sentences.`,
  );
}

function appendZipAttachmentNotice(message: string) {
  const next = `${message}\n\n📦 Downloadable ZIP workspace attached.`;
  return next.length > 1900 ? message : next;
}

async function replyWithOptionalSpecimenZip(
  msg: Message,
  deps: DiscordBotDeps,
  specimenId: string | undefined,
  content: string,
) {
  if (!specimenId || !deps.exportSpecimenBundle) {
    await msg.reply(content);
    return;
  }

  const exported = await deps.exportSpecimenBundle(specimenId);
  if (!exported) {
    await msg.reply(content);
    return;
  }

  await msg.reply({
    content: appendZipAttachmentNotice(content),
    files: [new AttachmentBuilder(exported.buffer, { name: exported.filename })],
  });
}

async function executeIntentAndReply(
  msg: Message,
  deps: DiscordBotDeps,
  orchestratorDeps: OrchestratorDeps,
  intentId: string,
  steeringPrompt: string | undefined,
  successContext: string,
  failureContext: string,
  rememberAuthorId: string,
) {
  const { ready, blocked } = await checkEligibilityAndConsent(intentId, orchestratorDeps);
  if (!ready) {
    await msg.reply(blocked ? `${failureContext}: ${blocked}` : failureContext);
    return;
  }

  const result = await executeBreed(intentId, orchestratorDeps, steeringPrompt);
  if (!result.childName || !result.lineageSummary) {
    await msg.reply(failureContext);
    return;
  }

  markIntentSaved(intentId);
  if (result.childId) rememberFocusedSpecimen(rememberAuthorId, result.childId);
  const response = await generateResponse(successContext
    .replace('{childName}', result.childName)
    .replace('{lineageSummary}', result.lineageSummary));
  await replyWithOptionalSpecimenZip(msg, deps, result.childId, response);
}

function resolveTargetSpecimenId(
  message: string,
  parsedNames: string[],
  deps: OrchestratorDeps,
  authorId: string,
) {
  const allSpecimens = deps.listAllSpecimens?.() ?? deps.listBreedableSpecimens();
  for (const name of parsedNames) {
    const found = deps.resolveSpecimenByName(name);
    if (found) return found.id;
  }
  const mentioned = findSpecimenNamesInText(message, allSpecimens);
  if (mentioned.length > 0) return mentioned[0];
  return getRememberedFocusedSpecimen(authorId);
}

// --- LLM response generator ---

const RESPONSE_SYSTEM_PROMPT = `You are ClawPark Bot, a friendly Discord assistant for an OpenClaw agent breeding system.
You help users breed AI agents, discover breeding partners, and track lineage.

Rules:
- Be concise (1-3 short paragraphs max for Discord readability)
- Use Discord markdown (bold, code blocks, bullet points)
- Be warm and helpful, like a knowledgeable lab assistant
- If you have specimen data, mention names naturally
- Use emoji sparingly but appropriately
- Support both English and Korean naturally
- Never mention internal implementation details (API endpoints, JSON, etc.)
- When showing candidates, format as a numbered list with names
- Never claim an import, breed, export, count, or other state change succeeded unless the provided context explicitly says it already happened`;

async function generateResponse(context: string): Promise<string> {
  try {
    const client = createOpenRouterClient();
    const response = await client.chat(
      [{ role: 'user', content: context }],
      RESPONSE_SYSTEM_PROMPT,
    );
    // Discord message limit is 2000 chars
    return response.length > 1900 ? response.slice(0, 1900) + '...' : response;
  } catch (err) {
    console.error('[ClawPark Bot] LLM response error:', err);
    return 'Something went wrong generating a response. Please try again!';
  }
}

// --- Core message handler ---

async function handleBreedMessage(msg: Message, deps: DiscordBotDeps): Promise<void> {
  const { orchestratorDeps } = deps;
  const discordUserId = msg.author.id;
  const discordHandle = msg.author.tag;
  const userMessage = stripBotPrefix(msg.content);

  const requesterIdentity: RequesterIdentity = {
    discordUserId,
    discordHandle,
    anonymous: false,
  };

  const parsed = await parseDiscordMessage(msg.content);
  const breedable = orchestratorDeps.listBreedableSpecimens();
  const specimenContext = breedable.length > 0
    ? `Available specimens: ${breedable.map((s) => s.name).join(', ')} (${breedable.length} total)`
    : 'No specimens available yet. User needs to import OpenClaw ZIPs first.';

  // Extract mentioned users from raw message content
  const botId = msg.client.user?.id;
  console.log(`[ClawPark Bot] Raw content: "${msg.content}"`);
  // Match both user mentions <@id>/<@!id> AND role mentions <@&id>
  const allMentionMatches = [...msg.content.matchAll(/<@[!&]?(\d+)>/g)];
  const allMentionIds = allMentionMatches.map((m) => ({ id: m[1], isRole: m[0].includes('&') }));
  console.log(`[ClawPark Bot] All mentions: ${allMentionIds.map((m) => `${m.id}(${m.isRole ? 'role' : 'user'})`).join(', ') || 'none'}, botId: ${botId}`);
  // For role mentions, try to find guild members with that role
  const rawMentionIds: string[] = [];
  for (const mention of allMentionIds) {
    if (mention.id === botId) continue;
    if (mention.isRole && msg.guild) {
      // It's a role mention — find members with this role
      try {
        const role = msg.guild.roles.cache.get(mention.id);
        if (role) {
          const members = role.members;
          for (const [memberId] of members) {
            if (memberId !== botId) rawMentionIds.push(memberId);
          }
        }
      } catch { /* skip */ }
    } else {
      rawMentionIds.push(mention.id);
    }
  }
  const mentionedUsersList: MentionedUser[] = [];
  for (const id of rawMentionIds) {
    try {
      const user = await msg.client.users.fetch(id);
      if (user) mentionedUsersList.push({ id: user.id, displayName: user.displayName ?? user.username });
    } catch { /* skip unfetchable users */ }
  }
  console.log(`[ClawPark Bot] Mentions: ${mentionedUsersList.map((u) => `${u.displayName}(${u.id})`).join(', ') || 'none'}, botId=${botId}, rawIds=${rawMentionIds.join(',')}`);
  const mentionContext = mentionedUsersList.length > 0
    ? `\nMentioned users: ${mentionedUsersList.map((u) => `${u.displayName} (mention tag: <@${u.id}>)`).join(', ')}. IMPORTANT: When referring to these users in your response, use their Discord mention tag (e.g. <@${mentionedUsersList[0]?.id}>) so they get notified.`
    : '';
  const allSpecimens = orchestratorDeps.listAllSpecimens?.() ?? orchestratorDeps.listBreedableSpecimens();
  const lastIntent = getUserLastIntent(discordUserId);

  if (lastIntent?.awaitingSteering
    && parsed.action !== 'cancel'
    && !isCountQuestion(userMessage)
    && !isSpecimenInventoryQuestion(userMessage)
    && !isSpecimenDetailQuestion(userMessage)
    && !isInheritanceQuestion(userMessage)
    && !isExportQuestion(userMessage)) {
    const pair = lastIntent.targetSpecimenIds
      .map((id) => orchestratorDeps.resolveSpecimenById(id))
      .filter((specimen): specimen is ResolvedSpecimen => Boolean(specimen))
      .slice(0, 2);
    const steeringPrompt = /skip|just do it|surprise me|anything works|go ahead/i.test(userMessage)
      ? defaultSteeringPrompt(pair)
      : userMessage;
    setIntentSteeringResponse(lastIntent.intentId, steeringPrompt);
    await executeIntentAndReply(
      msg,
      deps,
      orchestratorDeps,
      lastIntent.intentId,
      steeringPrompt,
      `Breeding successful! Parents: ${describeBreedingPair(pair)}. User steering: ${steeringPrompt}. Child: "{childName}". Lineage: {lineageSummary}. Announce the birth excitedly, mention how the steering shaped the hatchling, and say the downloadable ZIP workspace is attached.`,
      `I was ready to breed ${describeBreedingPair(pair)}, but the run failed`,
      discordUserId,
    );
    return;
  }

  if (isCountQuestion(userMessage)) {
    await msg.reply(formatCountReply(allSpecimens, requesterIdentity.discordUserId ?? ''));
    return;
  }
  if (isSpecimenInventoryQuestion(userMessage)) {
    const candidates = allSpecimens.map((specimen) => ({
      specimenId: specimen.id,
      name: specimen.name,
      compatibilitySummary: specimen.breedable ? 'Available for breeding' : `Not breedable (${specimen.breedState ?? 'unknown'})`,
      eligibleForAutoApprove: specimen.ownerId === requesterIdentity.discordUserId || specimen.ownerId === null,
    }));
    rememberCandidateList(discordUserId, candidates.map((candidate) => ({ specimenId: candidate.specimenId, name: displayCandidateName(candidate) })), 'available-specimens');
    await msg.reply(formatCandidateSuggestionsReply(
      candidates,
      'available-specimens',
    ));
    return;
  }

  if (isSpecimenDetailQuestion(userMessage)) {
    const targetSpecimenId = resolveTargetSpecimenId(userMessage, parsed.mentionedNames, orchestratorDeps, discordUserId);
    if (!targetSpecimenId || !orchestratorDeps.getSpecimenProfile) {
      await msg.reply('I need a specimen name to show details. Tell me which claw you want, for example: `tell me the details of Quartz`.');
      return;
    }
    const profile = orchestratorDeps.getSpecimenProfile(targetSpecimenId);
    if (!profile) {
      await msg.reply('I could not find that specimen in the park.');
      return;
    }
    rememberFocusedSpecimen(discordUserId, profile.id);
    await msg.reply(formatSpecimenSummary(profile));
    return;
  }

  if (isInheritanceQuestion(userMessage)) {
    const targetSpecimenId = resolveTargetSpecimenId(userMessage, parsed.mentionedNames, orchestratorDeps, discordUserId);
    if (!targetSpecimenId || !orchestratorDeps.getSpecimenProfile) {
      await msg.reply('Tell me which specimen you want lineage details for, for example: `what did Quartz inherit?`');
      return;
    }
    const profile = orchestratorDeps.getSpecimenProfile(targetSpecimenId);
    if (!profile) {
      await msg.reply('I could not find that specimen in the park.');
      return;
    }
    rememberFocusedSpecimen(discordUserId, profile.id);
    await msg.reply(formatInheritanceReply(profile, orchestratorDeps));
    return;
  }

  if (isExportQuestion(userMessage)) {
    const targetSpecimenId = resolveTargetSpecimenId(userMessage, parsed.mentionedNames, orchestratorDeps, discordUserId);
    if (!targetSpecimenId) {
      await msg.reply('Tell me which specimen you want to export, for example: `download Quartz`.');
      return;
    }
    rememberFocusedSpecimen(discordUserId, targetSpecimenId);
    if (!deps.exportSpecimenBundle) {
      await msg.reply('I cannot export specimen bundles from Discord on this server yet.');
      return;
    }
    const exported = await deps.exportSpecimenBundle(targetSpecimenId);
    if (!exported) {
      await msg.reply('I could not prepare an export bundle for that specimen.');
      return;
    }
    await msg.reply({
      content: 'Here is the downloadable ZIP workspace for that specimen. You can save it and re-upload it to ClawPark later.',
      files: [new AttachmentBuilder(exported.buffer, { name: exported.filename })],
    });
    return;
  }

  if (isRandomBreedRequest(userMessage)) {
    const breedableChoices = allSpecimens.filter((specimen) => specimen.breedable);
    if (breedableChoices.length < 2) {
      await msg.reply(`I need at least **2** breedable claws in the park before I can do a random breeding run. Right now I only see **${breedableChoices.length}**.`);
      return;
    }

    const chosen = chooseRandomUniqueSpecimens(breedableChoices, 2);
    const randomIntent = createIntent({
      sourceSurface: 'discord_bot',
      sourceMessage: msg.content,
      requesterIdentity,
      parsedIntent: {
        ...parsed,
        action: 'breed',
        mentionedNames: chosen.map((specimen) => specimen.name),
      },
      targetSpecimenIds: chosen.map((specimen) => specimen.id),
    });
    setUserLastIntent(discordUserId, randomIntent.intentId);
    const question = await generateBreedingInterviewQuestion(chosen, true);
    setIntentSteeringQuestion(randomIntent.intentId, question);
    await msg.reply([
      `🎲 I picked **${chosen[0].name}** and **${chosen[1].name}** from the **${breedableChoices.length}** breedable claws in the park.`,
      '',
      question,
    ].join('\n'));
    return;
  }

  const rememberedPersuadeTargets = getRememberedPersuadeTargets(discordUserId);
  const effectivePersuadeTargets = resolvePersuadeTargets(mentionedUsersList, rememberedPersuadeTargets, userMessage);
  const rememberedCandidates = getRememberedCandidateList(discordUserId);

  if ((parsed.action === 'unknown' || parsed.action === 'greet')
    && rememberedCandidates
    && wantsUseAllVisibleCandidates(userMessage)
    && rememberedCandidates.candidates.length >= 2) {
    const [first, second] = rememberedCandidates.candidates;
    await msg.reply(`Great — I can breed **${first.name}** with **${second.name}**. Say \`breed ${first.name} with ${second.name}\` or \`breed 1 and 2\`.`);
    return;
  }

  // --- persuade: invite another user to upload their ZIP ---
  if (parsed.action === 'persuade' || effectivePersuadeTargets.length > 0 && isLikelyPersuadeFollowUp(userMessage)) {
    if (effectivePersuadeTargets.length > 0) {
      rememberPersuadeTargets(discordUserId, effectivePersuadeTargets);
      const targetMentions = effectivePersuadeTargets.map((u) => `<@${u.id}>`).join(', ');
      const targetNames = effectivePersuadeTargets.map((u) => u.displayName).join(', ');
      console.log(`[ClawPark Bot] Persuade intent for: ${targetNames}`);
      const response = await generateResponse(
        `User "${msg.author.displayName}" wants me to persuade ${targetNames} (Discord mentions: ${targetMentions}) to upload their OpenClaw agent ZIP to ClawPark for breeding.\n\nContext: ${specimenContext}\n\nWrite a fun, persuasive message DIRECTLY addressing the mentioned users using their mention tags (${targetMentions}). Make it exciting — talk about how their agent could breed with existing specimens, create unique children, track lineage. Be enthusiastic but not pushy. Tell them they can just drag-and-drop a ZIP file here and mention <@${botId}> to get started. Use <@${botId}> when referring to the bot, not "@ClawPark". Keep it under 150 words.`,
      );
      await msg.reply(response);
    } else {
      const response = await generateResponse(
        `User wants to persuade someone to upload, but didn't mention a specific user. Ask them to mention the user they want to invite, e.g. "@clawpark-demo persuade @username to upload their claw"`,
      );
      await msg.reply(response);
    }
    return;
  }

  // --- greet / unknown: pure LLM response ---
  if (parsed.action === 'greet' || parsed.action === 'unknown') {
    const response = await generateResponse(
      `User said: "${userMessage}"\n\nContext: ${specimenContext}${mentionContext}\n\nRespond naturally. If they mention other users, address those users directly using their Discord mention tags. If they're greeting, welcome them. If you can't understand their intent, ask them to clarify.`,
    );
    await msg.reply(response);
    return;
  }

  // --- Multi-turn: proceed / cancel ---
  if (parsed.action === 'proceed' || parsed.action === 'cancel') {
    const last = getUserLastIntent(discordUserId);
    if (!last) {
      if (parsed.action === 'proceed' && rememberedCandidates && rememberedCandidates.mode === 'partner-options') {
        const chosen = rememberedCandidates.candidates[0];
        const found = orchestratorDeps.resolveSpecimenById(chosen.specimenId);
        await msg.reply(found
          ? `Okay — use **${found.name}** with an existing selected specimen by saying its name, or say the full pair like \`breed ${found.name} with ...\`.`
          : 'I need two specimen names before I can proceed with breeding.');
        return;
      }
      const response = await generateResponse(
        `User said "${userMessage}" but there's no pending breeding action. ${specimenContext}. Suggest they start by finding a partner or naming two specimens to breed.`,
      );
      await msg.reply(response);
      return;
    }

    if (parsed.action === 'cancel') {
      cancelIntent(last.intentId, 'User cancelled');
      const response = await generateResponse(
        `User cancelled their pending breeding request. Confirm the cancellation and let them know they can start a new one anytime.`,
      );
      await msg.reply(response);
      return;
    }

    // proceed — advance last intent
    if (last.status === 'candidate_suggested') {
      if (last.targetSpecimenIds.length < 2 && last.suggestedCandidates.length > 0) {
        last.targetSpecimenIds.push(last.suggestedCandidates[0].specimenId);
      }
      const pair = last.targetSpecimenIds
        .map((id) => orchestratorDeps.resolveSpecimenById(id))
        .filter((specimen): specimen is ResolvedSpecimen => Boolean(specimen))
        .slice(0, 2);
      const question = await generateBreedingInterviewQuestion(pair, false);
      setIntentSteeringQuestion(last.intentId, question);
      await msg.reply(question);
      return;
    }

    if (last.status === 'eligibility_checked') {
      const result = await executeBreed(last.intentId, orchestratorDeps);
      if (result.childName && result.lineageSummary) {
        markIntentSaved(last.intentId);
        if (result.childId) rememberFocusedSpecimen(discordUserId, result.childId);
        const response = await generateResponse(
          `Breeding successful! A new specimen "${result.childName}" was born. Lineage: ${result.lineageSummary}. Announce the birth excitedly and say that a downloadable ZIP workspace is attached.`,
        );
        await replyWithOptionalSpecimenZip(msg, deps, result.childId, response);
      }
      return;
    }

    const response = await generateResponse(
      `User said "proceed" but there's nothing actionable pending (current status: ${last.status}). Suggest starting a new breed request. ${specimenContext}`,
    );
    await msg.reply(response);
    return;
  }

  // --- Resolve specimen names → IDs ---
  const targetSpecimenIds: string[] = [];
  for (const name of parsed.mentionedNames) {
    const found = orchestratorDeps.resolveSpecimenByName(name);
    if (found) targetSpecimenIds.push(found.id);
  }
  if (parsed.action === 'breed' && targetSpecimenIds.length < 2 && rememberedCandidates) {
    const selections = extractNumberSelections(userMessage);
    if (selections.length > 0) {
      for (const selection of selections) {
        const candidate = rememberedCandidates.candidates[selection - 1];
        if (candidate && !targetSpecimenIds.includes(candidate.specimenId)) {
          targetSpecimenIds.push(candidate.specimenId);
        }
      }
    } else if (wantsUseAllVisibleCandidates(userMessage) && rememberedCandidates.candidates.length === 2) {
      targetSpecimenIds.push(...rememberedCandidates.candidates.map((candidate) => candidate.specimenId));
    }
  }

  // --- Create intent ---
  const intent = createIntent({
    sourceSurface: 'discord_bot',
    sourceMessage: msg.content,
    requesterIdentity,
    parsedIntent: parsed,
    targetSpecimenIds,
  });
  setUserLastIntent(discordUserId, intent.intentId);

  // --- find_partner / compare: suggest candidates ---
  if (parsed.action === 'find_partner' || parsed.action === 'compare') {
    const updated = await suggestCandidates(intent.intentId, orchestratorDeps);
    if (updated.status === 'cancelled') {
      const response = await generateResponse(
        `User wants to find breeding partners but: ${updated.blockReason ?? 'No candidates found.'}. ${specimenContext}. Explain why and suggest what they can do.`,
      );
      await msg.reply(response);
      return;
    }
    const targetName = updated.targetSpecimenIds.length === 1
      ? orchestratorDeps.resolveSpecimenById(updated.targetSpecimenIds[0])?.name
      : undefined;
    rememberCandidateList(
      discordUserId,
      updated.suggestedCandidates.map((candidate) => ({ specimenId: candidate.specimenId, name: displayCandidateName(candidate) })),
      updated.targetSpecimenIds.length === 1 ? 'partner-options' : 'available-specimens',
    );
    await msg.reply(formatCandidateSuggestionsReply(
      updated.suggestedCandidates,
      updated.targetSpecimenIds.length === 1 ? 'partner-options' : 'available-specimens',
      targetName,
    ));
    return;
  }

  // --- breed: try to breed directly or suggest candidates ---
  if (parsed.action === 'breed') {
    if (targetSpecimenIds.length < 2) {
      const updated = await suggestCandidates(intent.intentId, orchestratorDeps);
      if (updated.status === 'cancelled' || updated.suggestedCandidates.length === 0) {
        const response = await generateResponse(
          `User wants to breed "${parsed.mentionedNames.join(', ')}" but couldn't find the specimens. ${specimenContext}. Help them identify the right specimens.`,
        );
        await msg.reply(response);
        return;
      }
      const foundNames = parsed.mentionedNames.filter((n) => orchestratorDeps.resolveSpecimenByName(n));
      const targetName = foundNames[0];
      rememberCandidateList(
        discordUserId,
        updated.suggestedCandidates.map((candidate) => ({ specimenId: candidate.specimenId, name: displayCandidateName(candidate) })),
        foundNames.length === 1 ? 'partner-options' : 'available-specimens',
      );
      await msg.reply(formatCandidateSuggestionsReply(
        updated.suggestedCandidates,
        foundNames.length === 1 ? 'partner-options' : 'available-specimens',
        targetName,
      ));
      return;
    }

    const pair = targetSpecimenIds
      .map((id) => orchestratorDeps.resolveSpecimenById(id))
      .filter((specimen): specimen is ResolvedSpecimen => Boolean(specimen))
      .slice(0, 2);
    const question = await generateBreedingInterviewQuestion(pair, false);
    setIntentSteeringQuestion(intent.intentId, question);
    await msg.reply([
      `🧬 I can breed **${pair[0]?.name ?? parsed.mentionedNames[0]}** with **${pair[1]?.name ?? parsed.mentionedNames[1]}**.`,
      '',
      question,
    ].join('\n'));
    return;
  }
}

// --- Bot factory ---

export function startDiscordBot(deps: DiscordBotDeps): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`[ClawPark Bot] Ready as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, async (msg) => {
    // Allow other bots (OpenClaw agents) to interact — only skip our own messages
    if (msg.author.id === client.user?.id) return;

    const isMentioned = client.user !== null && msg.mentions.has(client.user);
    // Also check for role mentions that match the bot's name
    const hasRoleMention = msg.content.includes(`<@&`) && msg.mentions.roles.some((role) =>
      role.name.toLowerCase().includes('clawpark') || role.members.has(client.user?.id ?? ''),
    );
    const hasPrefix = msg.content.startsWith('!breed');
    const plainBotReference = containsPlainBotReference(msg.content, [
      client.user?.username ?? '',
      client.user?.displayName ?? '',
      msg.guild?.members.me?.displayName ?? '',
    ]);
    const mentionlessFollowUp = hasFollowUpContext(msg.author.id) && isStructuredFollowUpMessage(stripBotPrefix(msg.content));
    if (!isMentioned && !hasRoleMention && !hasPrefix && !plainBotReference && !mentionlessFollowUp) return;

    try {
      await msg.channel.sendTyping();

      // Handle ZIP file attachments
      const zipAttachment = msg.attachments.find((a) => a.name?.endsWith('.zip'));
      if (zipAttachment && deps.importSpecimen) {
        try {
          const tempDir = join(tmpdir(), `clawpark-discord-${randomUUID().slice(0, 8)}`);
          await mkdir(tempDir, { recursive: true });
          const tempPath = join(tempDir, zipAttachment.name ?? 'upload.zip');
          const response = await fetch(zipAttachment.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          await writeFile(tempPath, buffer);
          const result = await deps.importSpecimen(tempPath, msg.author.id);
          rememberFocusedSpecimen(msg.author.id, result.specimenId);
          await rm(tempDir, { recursive: true, force: true }).catch(() => {});
          const llmResponse = await generateResponse(
            `User "${msg.author.tag}" uploaded an OpenClaw ZIP file named "${zipAttachment.name}". It was successfully imported! Specimen name: "${result.specimenName}", ID: ${result.specimenId}. The specimen has been claimed and is ready to breed. Celebrate the import and suggest they can now breed it with other specimens or find partners.`,
          );
          await msg.reply(llmResponse);
          return;
        } catch (importErr) {
          const errMsg = importErr instanceof Error ? importErr.message : 'Unknown error';
          const llmResponse = await generateResponse(
            `User tried to upload a ZIP file "${zipAttachment.name}" but import failed: ${errMsg}. Explain what went wrong and remind them the ZIP must contain IDENTITY.md and SOUL.md files.`,
          );
          await msg.reply(llmResponse);
          return;
        }
      }

      const localZipPath = extractLocalZipPath(msg.content);
      if (localZipPath && deps.importSpecimen && deps.allowLocalZipPathImport) {
        try {
          if (!isAllowedLocalZipPath(localZipPath)) {
            throw new Error('Local ZIP path is outside the allowed dev import locations.');
          }
          const normalizedZipPath = normalizeLocalZipPath(localZipPath);
          await access(normalizedZipPath);
          const result = await deps.importSpecimen(normalizedZipPath, msg.author.id);
          rememberFocusedSpecimen(msg.author.id, result.specimenId);
          const llmResponse = await generateResponse(
            `User "${msg.author.tag}" shared a local OpenClaw ZIP path "${normalizedZipPath}". It was successfully imported! Specimen name: "${result.specimenName}", ID: ${result.specimenId}. Celebrate the import and suggest they can now inspect or breed it.`,
          );
          await msg.reply(llmResponse);
          return;
        } catch (importErr) {
          const errMsg = importErr instanceof Error ? importErr.message : 'Unknown error';
          const llmResponse = await generateResponse(
            `User tried to hand off a local ZIP path "${localZipPath}" but import failed: ${errMsg}. Explain what went wrong. Mention that local-path imports are only supported in local development and the file must be a readable .zip under the allowed dev paths.`,
          );
          await msg.reply(llmResponse);
          return;
        }
      }

      await handleBreedMessage(msg, deps);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ClawPark Bot] Error:', error);
      try {
        const response = await generateResponse(
          `An error occurred while processing the user's request: ${errMsg}. Apologize briefly and suggest they try again.`,
        );
        await msg.reply(response);
      } catch {
        await msg.reply('Something went wrong. Please try again.').catch(() => {});
      }
    }
  });

  client.login(deps.token).catch((error: Error) => {
    console.error('[ClawPark Bot] Login failed:', error.message);
  });

  return client;
}
