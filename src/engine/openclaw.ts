import { TOOL_BADGE_BY_ID } from '../data/toolBadges';
import type {
  Claw,
  ClawIdentity,
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
