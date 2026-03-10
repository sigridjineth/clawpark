import { TOOL_BADGE_BY_ID } from '../data/toolBadges';
import type {
  Claw,
  ClawIdentity,
  ChildDoctrine,
  ConversationTurn,
  InheritanceRecord,
  SkillBadge,
  SoulTrait,
  ToolBadge,
  TraitOrigin,
} from '../types/claw';

const CREATURE_BY_TRAIT: Record<string, { creature: string; emoji: string }> = {
  'trait-caution': { creature: 'Archive Raptor', emoji: '🦖' },
  'trait-curiosity': { creature: 'Signal Raptor', emoji: '🦕' },
  'trait-critique': { creature: 'Edge Pterosaur', emoji: '🪽' },
  'trait-documentation': { creature: 'Ledger Hadrosaur', emoji: '📒' },
  'trait-prototyping': { creature: 'Forge Drakespawn', emoji: '🛠️' },
  'trait-improvisation': { creature: 'Pulse Velociraptor', emoji: '⚡' },
  'trait-analysis': { creature: 'Survey Dilophosaur', emoji: '📡' },
  'trait-creativity': { creature: 'Mirage Pterosaur', emoji: '✨' },
  'trait-systems': { creature: 'Bastion Ankylosaur', emoji: '🧱' },
  'mutation-leap-logic': { creature: 'Storm Chimera', emoji: '🧬' },
  'mutation-signal-sense': { creature: 'Echo Chimera', emoji: '🧬' },
  'mutation-dreamforge': { creature: 'Mythic Chimera', emoji: '🧬' },
};

const TOOL_IDS_BY_SKILL: Record<string, string[]> = {
  'skill-review': ['tool-search-probe', 'tool-seer-lens'],
  'skill-strategy': ['tool-workflow-grid', 'tool-radar-array'],
  'skill-prompting': ['tool-spark-injector', 'tool-orbit-board'],
  'skill-testing': ['tool-sandbox-ward', 'tool-search-probe'],
  'skill-animation': ['tool-forge-armature', 'tool-orbit-board'],
  'skill-story': ['tool-forge-armature', 'tool-spark-injector'],
  'skill-security': ['tool-sandbox-ward', 'tool-radar-array'],
  'skill-debug': ['tool-search-probe', 'tool-seer-lens'],
  'skill-vision': ['tool-radar-array', 'tool-seer-lens'],
  'skill-velocity': ['tool-launch-rail', 'tool-forge-armature'],
  'mutation-swarm': ['tool-orbit-board', 'tool-radar-array'],
  'mutation-foresight': ['tool-seer-lens', 'tool-radar-array'],
  'mutation-chaos': ['tool-spark-injector', 'tool-forge-armature'],
};

function titleCase(value: string) {
  return value
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function joinUnique(values: string[], separator = ' · ') {
  return Array.from(new Set(values.filter(Boolean))).join(separator);
}

function sortSkills(badges: SkillBadge[]) {
  return [...badges].sort((left, right) => right.dominance - left.dominance);
}

function sortTools(loadout: ToolBadge[]) {
  return [...loadout].sort((left, right) => right.potency - left.potency);
}

function originScore(records: InheritanceRecord[], origin: Exclude<TraitOrigin, 'mutation' | 'both'>) {
  return records.reduce((sum, record) => {
    if (record.origin === origin) {
      return sum + (record.originWeight ?? 1);
    }

    if (record.origin === 'both') {
      return sum + (record.originWeight ?? 1) * 0.5;
    }

    return sum;
  }, 0);
}

export function deriveToolLoadout(skills: SkillBadge[]): ToolBadge[] {
  const preferredIds = skills.flatMap((badge) => TOOL_IDS_BY_SKILL[badge.id] ?? []);
  const uniqueIds = Array.from(new Set(preferredIds));
  const fallbackIds = ['tool-radar-array', 'tool-sandbox-ward', 'tool-search-probe'];

  return [...uniqueIds, ...fallbackIds]
    .slice(0, 3)
    .map((id) => TOOL_BADGE_BY_ID[id])
    .filter((badge): badge is ToolBadge => Boolean(badge));
}

export function getClawTools(claw: Claw) {
  return claw.tools ?? { loadout: deriveToolLoadout(claw.skills.badges) };
}

export function deriveIdentity(claw: Claw): ClawIdentity {
  const leadTrait = claw.soul.traits[0];
  const leadSkill = sortSkills(claw.skills.badges)[0];
  const creature = CREATURE_BY_TRAIT[leadTrait?.id ?? 'trait-analysis']?.creature ?? 'Signal Raptor';
  const emoji = CREATURE_BY_TRAIT[leadTrait?.id ?? 'trait-analysis']?.emoji ?? '🦖';
  const vibe = joinUnique([
    leadTrait?.label ? titleCase(leadTrait.label) : '',
    claw.soul.traits[1]?.label ? titleCase(claw.soul.traits[1].label) : '',
  ]);

  return {
    creature,
    role: claw.archetype,
    directive: `Run ${leadSkill?.label?.toLowerCase() ?? 'the experiment'} until the signal holds.`,
    vibe: vibe || 'Measured · Adaptive',
    emoji,
  };
}

export function getClawIdentity(claw: Claw) {
  return claw.identity ?? deriveIdentity(claw);
}

export function fuseIdentity({
  parentA,
  parentB,
  childSoulTraits,
  childSkillBadges,
  childTools,
  archetype,
  records,
}: {
  parentA: Claw;
  parentB: Claw;
  childSoulTraits: SoulTrait[];
  childSkillBadges: SkillBadge[];
  childTools: ToolBadge[];
  archetype: string;
  records: InheritanceRecord[];
}) {
  const identityA = getClawIdentity(parentA);
  const identityB = getClawIdentity(parentB);
  const scoreA = originScore(records, 'parentA');
  const scoreB = originScore(records, 'parentB');
  const dominantOrigin: Exclude<TraitOrigin, 'mutation'> = scoreA === scoreB ? 'both' : scoreA > scoreB ? 'parentA' : 'parentB';
  const dominantIdentity = dominantOrigin === 'parentB' ? identityB : identityA;
  const leadSkill = sortSkills(childSkillBadges)[0] ?? parentA.skills.badges[0] ?? parentB.skills.badges[0];
  const leadTool =
    sortTools(childTools)[0] ?? getClawTools(parentA).loadout[0] ?? getClawTools(parentB).loadout[0];
  const leadTrait = childSoulTraits[0] ?? parentA.soul.traits[0] ?? parentB.soul.traits[0];
  const creature =
    identityA.creature === identityB.creature || dominantOrigin === 'both'
      ? identityA.creature
      : dominantIdentity.creature;
  const emoji =
    identityA.emoji === identityB.emoji || dominantOrigin === 'both'
      ? identityA.emoji
      : dominantIdentity.emoji;
  const vibe = joinUnique([identityA.vibe, identityB.vibe], ' × ');
  const directive = `Carry ${leadTrait.label.toLowerCase()} through ${leadTool.label.toLowerCase()} until ${leadSkill.label.toLowerCase()} locks in.`;

  const identity: ClawIdentity = {
    creature,
    role: archetype,
    directive,
    vibe,
    emoji,
  };

  const identityRecords: InheritanceRecord[] = [
    {
      type: 'identity',
      traitId: 'identity-creature',
      label: `Creature: ${creature}`,
      origin: dominantOrigin,
      kind: dominantOrigin === 'both' ? 'fused' : 'dominant',
      detail:
        dominantOrigin === 'both'
          ? 'Both parent chassis converged on the same creature profile.'
          : `Dominant creature chassis inherited from ${dominantOrigin}.`,
    },
    {
      type: 'identity',
      traitId: 'identity-vibe',
      label: `Vibe: ${vibe}`,
      origin: 'both',
      kind: 'fused',
      detail: 'Both parent vibe signatures were fused into the hatchling identity.',
    },
    {
      type: 'identity',
      traitId: 'identity-directive',
      label: `Directive: ${directive}`,
      origin: 'both',
      kind: 'fused',
      detail: `Directive recomposed around ${leadSkill.label} and ${leadTool.label}.`,
    },
  ];

  return { identity, records: identityRecords };
}

export function buildDimensionForecast({
  parentA,
  parentB,
  predictedArchetype,
  traitLabels,
}: {
  parentA: Claw;
  parentB: Claw;
  predictedArchetype: string;
  traitLabels: string[];
}) {
  const identityA = getClawIdentity(parentA);
  const identityB = getClawIdentity(parentB);
  const tools = joinUnique(
    [...getClawTools(parentA).loadout, ...getClawTools(parentB).loadout]
      .sort((left, right) => right.potency - left.potency)
      .slice(0, 3)
      .map((tool) => tool.label),
  );
  const skills = joinUnique(
    [...parentA.skills.badges, ...parentB.skills.badges]
      .sort((left, right) => right.dominance - left.dominance)
      .slice(0, 3)
      .map((skill) => skill.label),
  );

  return {
    identity: `${predictedArchetype} between ${identityA.creature} and ${identityB.creature}`,
    soul: joinUnique(traitLabels.slice(0, 3)),
    skills,
    tools,
  };
}

export function summarizeIdentity(claw: Claw) {
  const identity = getClawIdentity(claw);
  return `${identity.emoji} ${identity.creature} · ${identity.vibe}`;
}

function listToSentence(labels: string[]) {
  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

export function summarizeSoul(claw: Claw) {
  const labels = claw.soul.traits.map((trait) => trait.label);
  const leadDescription = claw.soul.traits[0]?.description ?? 'Keeps the hatchling steady in the enclosure.';
  return `${listToSentence(labels)} define how this claw thinks. ${leadDescription}`;
}

export function summarizeSkills(claw: Claw) {
  const labels = sortSkills(claw.skills.badges).map((skill) => skill.label);
  return `It works best through ${listToSentence(labels)}.`;
}

export function summarizeTools(claw: Claw) {
  const loadout = getClawTools(claw).loadout.map((tool) => tool.label);
  return `Its field kit usually resolves into ${listToSentence(loadout)}.`;
}

export function summarizeClawDossier(claw: Claw) {
  const identity = getClawIdentity(claw);
  return `${identity.emoji} ${identity.creature} with a ${identity.vibe.toLowerCase()} profile. ${identity.directive}`;
}

export interface ClawTalkProfile {
  identity: string;
  soul: string;
  skills: string;
  tools: string;
}

export function buildClawTalkProfile(claw: Claw): ClawTalkProfile {
  const identity = getClawIdentity(claw);
  const tools = getClawTools(claw).loadout;
  const leadSoul = claw.soul.traits[0];
  const secondarySoul = claw.soul.traits[1];
  const topSkills = sortSkills(claw.skills.badges)
    .slice(0, 2)
    .map((skill) => skill.label.toLowerCase());

  return {
    identity: `I'm ${identity.emoji} ${identity.creature}, built for ${identity.role.toLowerCase()} work inside the park.`,
    soul: `I stay ${leadSoul.label.toLowerCase()} and ${secondarySoul?.label.toLowerCase() ?? 'stable'} — ${leadSoul.description.toLowerCase()}.`,
    skills: `When a problem appears, I lean on ${listToSentence(topSkills)} first.`,
    tools: `My first reach is usually ${listToSentence(tools.map((tool) => tool.label.toLowerCase()))}.`,
  };
}

export function buildFusionHint({
  parentA,
  parentB,
  predictedArchetype,
}: {
  parentA: Claw;
  parentB: Claw;
  predictedArchetype: string;
}) {
  const identityA = getClawIdentity(parentA);
  const identityB = getClawIdentity(parentB);
  const toolA = getClawTools(parentA).loadout[0]?.label ?? 'the first kit';
  const toolB = getClawTools(parentB).loadout[0]?.label ?? 'the second kit';

  return `${identityA.creature} brings ${toolA.toLowerCase()}, ${identityB.creature} brings ${toolB.toLowerCase()}, and the hatch points toward ${predictedArchetype.toLowerCase()}.`;
}

function promptIntent(prompt: string) {
  const lowered = prompt.toLowerCase();
  if (/(skill|solve|build|code|debug|ship|work)/.test(lowered)) return 'skills';
  if (/(tool|stack|reach|use|kit|environment)/.test(lowered)) return 'tools';
  if (/(soul|rule|belief|principle|boundary|value)/.test(lowered)) return 'soul';
  return 'identity';
}

function summarizeForIntent(claw: Claw, intent: 'identity' | 'soul' | 'skills' | 'tools') {
  switch (intent) {
    case 'soul':
      return summarizeSoul(claw);
    case 'skills':
      return summarizeSkills(claw);
    case 'tools':
      return summarizeTools(claw);
    case 'identity':
    default:
      return summarizeClawDossier(claw);
  }
}

export function buildBreedingConversation({
  parentA,
  parentB,
  prompt,
  predictedArchetype,
}: {
  parentA: Claw;
  parentB: Claw;
  prompt: string;
  predictedArchetype: string;
}): ConversationTurn[] {
  const intent = promptIntent(prompt);
  const identityA = getClawIdentity(parentA);
  const identityB = getClawIdentity(parentB);

  const aReply = summarizeForIntent(parentA, intent);
  const bReply = summarizeForIntent(parentB, intent);
  const fusionHint = buildFusionHint({ parentA, parentB, predictedArchetype });

  return [
    {
      id: `turn-user-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'user',
      title: 'Operator asks',
      content: prompt,
    },
    {
      id: `turn-a-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'parentA',
      title: `${parentA.name} speaks`,
      content: aReply,
    },
    {
      id: `turn-b-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'parentB',
      title: `${parentB.name} speaks`,
      content: bReply,
    },
    {
      id: `turn-a2-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'parentA',
      title: `${parentA.name} challenges`,
      content: `${identityA.creature} pushes for ${intent} discipline before the hatch proceeds.`,
    },
    {
      id: `turn-b2-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'parentB',
      title: `${parentB.name} counters`,
      content: `${identityB.creature} argues that the child should stay adaptable enough to survive outside the fence.`,
    },
    {
      id: `turn-fusion-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'fusion',
      title: 'Fusion verdict',
      content: fusionHint,
    },
  ];
}

export function buildChildDoctrine({
  child,
  parentA,
  parentB,
  conversation,
}: {
  child: Claw;
  parentA: Claw;
  parentB: Claw;
  conversation: ConversationTurn[];
}): ChildDoctrine {
  const identity = getClawIdentity(child);
  let lastFusion = '';
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const turn = conversation[index];
    if (turn.speaker === 'fusion') {
      lastFusion = turn.content;
      break;
    }
  }
  const soulLine = summarizeSoul(child);
  const skillLine = summarizeSkills(child);

  return {
    title: `${child.name} Doctrine`,
    creed: `${identity.creature} exists to ${identity.directive.toLowerCase()}`,
    summary: `${parentA.name} and ${parentB.name} argued their way into a ${identity.vibe.toLowerCase()} child. ${soulLine} ${skillLine} ${lastFusion}`.trim(),
  };
}
