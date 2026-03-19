// ClawPark Discord Coordinator Bot.
// Trigger: @ClawPark mention OR !breed prefix.
// Exports startDiscordBot(deps) for server/index.ts to call.

import { Client, Events, GatewayIntentBits, type Message } from 'discord.js';
import type { OrchestratorDeps, RequesterIdentity } from '../src/types/breedingIntent.ts';
import { parseDiscordMessage, stripBotPrefix } from './discordIntent.ts';
import {
  cancelIntent,
  checkEligibilityAndConsent,
  createIntent,
  executeBreed,
  getUserLastIntent,
  markIntentSaved,
  setUserLastIntent,
  suggestCandidates,
} from './breedingOrchestrator.ts';

export interface DiscordBotDeps {
  token: string;
  orchestratorDeps: OrchestratorDeps;
}

// --- Response formatters ---

function fmtCandidates(
  candidates: Array<{
    name: string;
    compatibilitySummary: string;
    eligibleForAutoApprove: boolean;
  }>,
): string {
  if (candidates.length === 0) return '❌ No breedable candidates found. Import some OpenClaw ZIPs first.';
  return candidates
    .map((c, i) => {
      const icon = c.eligibleForAutoApprove ? '🟢' : '🟡';
      return `${i + 1}. **${c.name}** ${icon}  ${c.compatibilitySummary}`;
    })
    .join('\n');
}

function fmtLineage(childName: string, lineageSummary: string): string {
  return [
    `🧬 **${childName}** has been born!`,
    '',
    lineageSummary,
    '',
    '✅ Saved to your Nursery.',
  ].join('\n');
}

// --- Core message handler ---

async function handleBreedMessage(msg: Message, deps: DiscordBotDeps): Promise<void> {
  const { orchestratorDeps } = deps;
  const discordUserId = msg.author.id;
  const discordHandle = msg.author.tag;

  const requesterIdentity: RequesterIdentity = {
    discordUserId,
    discordHandle,
    anonymous: false,
  };

  const parsed = await parseDiscordMessage(msg.content);

  // --- Multi-turn: proceed / cancel ---
  if (parsed.action === 'proceed' || parsed.action === 'cancel') {
    const last = getUserLastIntent(discordUserId);
    if (!last) {
      await msg.reply('No pending breeding action. Start with: "breed 가능한 상대 찾아줘"');
      return;
    }

    if (parsed.action === 'cancel') {
      cancelIntent(last.intentId, 'User cancelled');
      await msg.reply('✅ Breeding cancelled.');
      return;
    }

    // proceed — advance last intent
    if (last.status === 'candidate_suggested') {
      // Pick first suggestion if no second specimen yet
      if (last.targetSpecimenIds.length < 2 && last.suggestedCandidates.length > 0) {
        last.targetSpecimenIds.push(last.suggestedCandidates[0].specimenId);
      }

      const { intent, ready, blocked } = await checkEligibilityAndConsent(last.intentId, orchestratorDeps);
      if (!ready) {
        if (intent.status === 'consent_pending') {
          await msg.reply(
            '⏳ **Consent required.**\nThe other specimen\'s owner must approve this cross-owner breeding. This request expires in 24 hours.',
          );
        } else {
          await msg.reply(`❌ Cannot breed: ${blocked}`);
        }
        return;
      }

      const result = await executeBreed(last.intentId, orchestratorDeps);
      if (result.childName && result.lineageSummary) {
        markIntentSaved(last.intentId);
        await msg.reply(fmtLineage(result.childName, result.lineageSummary));
      }
      return;
    }

    if (last.status === 'eligibility_checked') {
      const result = await executeBreed(last.intentId, orchestratorDeps);
      if (result.childName && result.lineageSummary) {
        markIntentSaved(last.intentId);
        await msg.reply(fmtLineage(result.childName, result.lineageSummary));
      }
      return;
    }

    await msg.reply('Nothing actionable pending. Start a new breed request.');
    return;
  }

  // --- Resolve specimen names → IDs ---
  const targetSpecimenIds: string[] = [];
  for (const name of parsed.mentionedNames) {
    const found = orchestratorDeps.resolveSpecimenByName(name);
    if (found) targetSpecimenIds.push(found.id);
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
      await msg.reply(`❌ ${updated.blockReason ?? 'No candidates found.'}`);
      return;
    }
    const list = fmtCandidates(updated.suggestedCandidates);
    await msg.reply(
      `🔍 **Breeding Candidates**\n\n${list}\n\nSay **"진행해"** to breed with #1, or name a specific specimen.`,
    );
    return;
  }

  // --- breed: try to breed directly or suggest candidates ---
  if (parsed.action === 'breed') {
    if (targetSpecimenIds.length < 2) {
      // Couldn't resolve both names — suggest candidates
      const updated = await suggestCandidates(intent.intentId, orchestratorDeps);
      if (updated.status === 'cancelled' || updated.suggestedCandidates.length === 0) {
        await msg.reply("❌ Couldn't find the specimens. Try: \"breed 가능한 상대 찾아줘\"");
        return;
      }
      const hint =
        targetSpecimenIds.length === 1
          ? `Found **${parsed.mentionedNames[0]}** — choose a partner:`
          : "Couldn't identify the specimens — here are available candidates:";
      await msg.reply(
        `${hint}\n\n${fmtCandidates(updated.suggestedCandidates)}\n\nSay **"진행해"** to proceed with #1.`,
      );
      return;
    }

    // Both specimens resolved — check eligibility and breed
    const { intent: checkedIntent, ready, blocked } = await checkEligibilityAndConsent(
      intent.intentId,
      orchestratorDeps,
    );
    if (!ready) {
      if (checkedIntent.status === 'consent_pending') {
        await msg.reply(
          '⏳ **Consent required.**\nThis is a cross-owner breeding. The other owner needs to approve in Discord. Request expires in 24 hours.',
        );
      } else {
        await msg.reply(`❌ Cannot breed: ${blocked}`);
      }
      return;
    }

    const result = await executeBreed(intent.intentId, orchestratorDeps);
    if (result.childName && result.lineageSummary) {
      markIntentSaved(intent.intentId);
      await msg.reply(fmtLineage(result.childName, result.lineageSummary));
    } else {
      await msg.reply('❌ Breeding failed unexpectedly.');
    }
    return;
  }

  // --- unknown / fallback ---
  const cleaned = stripBotPrefix(msg.content);
  await msg.reply(
    cleaned
      ? `I didn't understand "${cleaned}". Try:\n• "breed 가능한 상대 찾아줘"\n• "breed Ember with Nova"\n• "진행해" (proceed)\n• "취소해" (cancel)`
      : '👋 ClawPark bot ready! Try: "breed 가능한 상대 찾아줘"',
  );
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
    if (msg.author.bot) return;

    const isMentioned = client.user !== null && msg.mentions.has(client.user);
    const hasPrefix = msg.content.startsWith('!breed');
    if (!isMentioned && !hasPrefix) return;

    try {
      await handleBreedMessage(msg, deps);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ClawPark Bot] Error:', error);
      try {
        await msg.reply(`⚠️ Error: ${errMsg}`);
      } catch {
        // ignore reply failure
      }
    }
  });

  client.login(deps.token).catch((error: Error) => {
    console.error('[ClawPark Bot] Login failed:', error.message);
  });

  return client;
}
