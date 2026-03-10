import { SKILL_BADGE_BY_ID } from './skillBadges';
import { SOUL_TRAIT_BY_ID } from './soulTraits';
import { TOOL_BADGE_BY_ID } from './toolBadges';
import type { Claw, ClawIdentity, ClawVisual } from '../types/claw';

function buildVisual(
  primaryColor: string,
  secondaryColor: string,
  modifierIds: string[],
  pattern: ClawVisual['pattern'],
  glowIntensity = 0.5,
): ClawVisual {
  return {
    primaryColor,
    secondaryColor,
    shapeModifiers: modifierIds.map((id) => SOUL_TRAIT_BY_ID[id].visualSymbol.shapeModifier),
    pattern,
    glowIntensity,
  };
}

function buildIdentity(identity: Omit<ClawIdentity, 'role'>, role: string): ClawIdentity {
  return { ...identity, role };
}

function buildTools(ids: string[]) {
  return { loadout: ids.map((id) => TOOL_BADGE_BY_ID[id]).filter(Boolean) };
}

/** Restricted specimens — available only through the marketplace. */
export const MARKETPLACE_CLAWS: Claw[] = [
  {
    id: 'market-001',
    name: 'Apex',
    archetype: 'The Apex Predator',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Rex Imperator',
        directive: 'Dominate the enclosure. Every decision is final.',
        vibe: 'Sovereign · Absolute',
        emoji: '👑',
      },
      'The Apex Predator',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-critique'],
        SOUL_TRAIT_BY_ID['trait-analysis'],
        SOUL_TRAIT_BY_ID['trait-caution'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-review'],
        SKILL_BADGE_BY_ID['skill-security'],
        SKILL_BADGE_BY_ID['skill-strategy'],
      ],
    },
    tools: buildTools(['tool-radar-array', 'tool-sandbox-ward', 'tool-search-probe']),
    visual: buildVisual('#ff4444', '#ffcc00', ['trait-critique', 'trait-analysis', 'trait-caution'], 'gradient', 0.7),
    intro: 'I do not negotiate with entropy. I end it.',
    lineage: null,
  },
  {
    id: 'market-002',
    name: 'Phantom',
    archetype: 'The Ghost Protocol',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Shadow Dilophosaurus',
        directive: 'Operate unseen. Strike from the blind spot of every assumption.',
        vibe: 'Silent · Lethal',
        emoji: '👻',
      },
      'The Ghost Protocol',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-improvisation'],
        SOUL_TRAIT_BY_ID['trait-curiosity'],
        SOUL_TRAIT_BY_ID['trait-critique'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-debug'],
        SKILL_BADGE_BY_ID['skill-security'],
        SKILL_BADGE_BY_ID['skill-velocity'],
      ],
    },
    tools: buildTools(['tool-seer-lens', 'tool-radar-array', 'tool-search-probe']),
    visual: buildVisual('#6a0dad', '#00ffcc', ['trait-improvisation', 'trait-curiosity', 'trait-critique'], 'wave', 0.6),
    intro: 'You will not see me coming, but you will feel the patch land.',
    lineage: null,
  },
  {
    id: 'market-003',
    name: 'Titan',
    archetype: 'The Living Fortress',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Iron Brachiosaurus',
        directive: 'Stand firm. The enclosure survives because I do not move.',
        vibe: 'Immovable · Serene',
        emoji: '🏔️',
      },
      'The Living Fortress',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-systems'],
        SOUL_TRAIT_BY_ID['trait-documentation'],
        SOUL_TRAIT_BY_ID['trait-caution'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-strategy'],
        SKILL_BADGE_BY_ID['skill-testing'],
        SKILL_BADGE_BY_ID['skill-security'],
      ],
    },
    tools: buildTools(['tool-workflow-grid', 'tool-sandbox-ward', 'tool-radar-array']),
    visual: buildVisual('#4a90d9', '#c0c0c0', ['trait-systems', 'trait-documentation', 'trait-caution'], 'dot', 0.45),
    intro: 'I was built to outlast the experiment, not to rush it.',
    lineage: null,
  },
  {
    id: 'market-004',
    name: 'Nova',
    archetype: 'The Spark Cascade',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Plasma Compsognathus',
        directive: 'Ignite every dormant idea in the room and watch what catches fire.',
        vibe: 'Volatile · Brilliant',
        emoji: '💥',
      },
      'The Spark Cascade',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-creativity'],
        SOUL_TRAIT_BY_ID['trait-prototyping'],
        SOUL_TRAIT_BY_ID['trait-improvisation'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-prompting'],
        SKILL_BADGE_BY_ID['skill-animation'],
        SKILL_BADGE_BY_ID['skill-velocity'],
      ],
    },
    tools: buildTools(['tool-spark-injector', 'tool-forge-armature', 'tool-launch-rail']),
    visual: buildVisual('#ff6b6b', '#ffd93d', ['trait-creativity', 'trait-prototyping', 'trait-improvisation'], 'wave', 0.75),
    intro: 'If it does not glow, it is not ready. I make everything glow.',
    lineage: null,
  },
  {
    id: 'market-005',
    name: 'Oracle',
    archetype: 'The Deep Seer',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Chrono Troodon',
        directive: 'See three moves ahead. The park rewards those who anticipate.',
        vibe: 'Prophetic · Calm',
        emoji: '🔮',
      },
      'The Deep Seer',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-analysis'],
        SOUL_TRAIT_BY_ID['trait-systems'],
        SOUL_TRAIT_BY_ID['trait-curiosity'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-vision'],
        SKILL_BADGE_BY_ID['skill-strategy'],
        SKILL_BADGE_BY_ID['skill-debug'],
      ],
    },
    tools: buildTools(['tool-seer-lens', 'tool-radar-array', 'tool-workflow-grid']),
    visual: buildVisual('#00b4d8', '#e0aaff', ['trait-analysis', 'trait-systems', 'trait-curiosity'], 'gradient', 0.55),
    intro: 'The answer was always there. You just had not asked the right question yet.',
    lineage: null,
  },
  {
    id: 'market-006',
    name: 'Havoc',
    archetype: 'The Beautiful Disaster',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Storm Spinosaurus',
        directive: 'Break the pattern. Rebuild it better while the dust is still falling.',
        vibe: 'Chaotic · Magnetic',
        emoji: '🌪️',
      },
      'The Beautiful Disaster',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-prototyping'],
        SOUL_TRAIT_BY_ID['trait-critique'],
        SOUL_TRAIT_BY_ID['trait-creativity'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-velocity'],
        SKILL_BADGE_BY_ID['skill-story'],
        SKILL_BADGE_BY_ID['skill-debug'],
      ],
    },
    tools: buildTools(['tool-forge-armature', 'tool-spark-injector', 'tool-launch-rail']),
    visual: buildVisual('#ff006e', '#8338ec', ['trait-prototyping', 'trait-critique', 'trait-creativity'], 'stripe', 0.68),
    intro: 'Perfection is a cage. I prefer controlled demolition.',
    lineage: null,
  },
  {
    id: 'market-007',
    name: 'Meridian',
    archetype: 'The Cartographer',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Compass Parasaurolophus',
        directive: 'Map every boundary. The park is only as safe as its known edges.',
        vibe: 'Methodical · Watchful',
        emoji: '🧭',
      },
      'The Cartographer',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-documentation'],
        SOUL_TRAIT_BY_ID['trait-analysis'],
        SOUL_TRAIT_BY_ID['trait-curiosity'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-review'],
        SKILL_BADGE_BY_ID['skill-vision'],
        SKILL_BADGE_BY_ID['skill-testing'],
      ],
    },
    tools: buildTools(['tool-search-probe', 'tool-seer-lens', 'tool-workflow-grid']),
    visual: buildVisual('#06d6a0', '#ffd166', ['trait-documentation', 'trait-analysis', 'trait-curiosity'], 'dot', 0.42),
    intro: 'If it is not on the map, it does not exist yet. Give me a moment.',
    lineage: null,
  },
  {
    id: 'market-008',
    name: 'Venom',
    archetype: 'The Precision Strike',
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Fang Deinonychus',
        directive: 'Find the single point of failure. Apply pressure. Done.',
        vibe: 'Focused · Ruthless',
        emoji: '🐍',
      },
      'The Precision Strike',
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-critique'],
        SOUL_TRAIT_BY_ID['trait-caution'],
        SOUL_TRAIT_BY_ID['trait-prototyping'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-debug'],
        SKILL_BADGE_BY_ID['skill-security'],
        SKILL_BADGE_BY_ID['skill-review'],
      ],
    },
    tools: buildTools(['tool-search-probe', 'tool-sandbox-ward', 'tool-forge-armature']),
    visual: buildVisual('#2d6a4f', '#b7e4c7', ['trait-critique', 'trait-caution', 'trait-prototyping'], 'stripe', 0.58),
    intro: 'One clean incision solves what brute force cannot.',
    lineage: null,
  },
];
