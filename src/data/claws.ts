import { ARCHETYPE_BY_KEY, traitComboKey } from './archetypes';
import { SKILL_BADGE_BY_ID } from './skillBadges';
import { SOUL_TRAIT_BY_ID } from './soulTraits';
import { TOOL_BADGE_BY_ID } from './toolBadges';
import type { Claw, ClawIdentity, ClawVisual } from '../types/claw';

function buildVisual(
  primaryColor: string,
  secondaryColor: string,
  modifierIds: string[],
  pattern: ClawVisual['pattern'],
  glowIntensity = 0.32,
): ClawVisual {
  return {
    primaryColor,
    secondaryColor,
    shapeModifiers: modifierIds.map((id) => SOUL_TRAIT_BY_ID[id].visualSymbol.shapeModifier),
    pattern,
    glowIntensity,
  };
}

function archetypeFor(ids: string[]) {
  return ARCHETYPE_BY_KEY[traitComboKey(ids)]?.name ?? 'The Emergent Hybrid';
}

function introFor(ids: string[]) {
  return (
    ARCHETYPE_BY_KEY[traitComboKey(ids)]?.introTemplate ??
    'I inherit the best parts of a conflict and turn them into motion.'
  );
}

function buildIdentity(identity: Omit<ClawIdentity, 'role'>, role: string): ClawIdentity {
  return {
    ...identity,
    role,
  };
}

function buildTools(ids: string[]) {
  return {
    loadout: ids.map((id) => TOOL_BADGE_BY_ID[id]).filter(Boolean),
  };
}

export const INITIAL_CLAWS: Claw[] = [
  {
    id: 'claw-001',
    name: 'Sage',
    archetype: archetypeFor(['trait-caution', 'trait-analysis', 'trait-documentation']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Archive Raptor',
        directive: 'Verify the fossil, label the branch, then hatch the answer.',
        vibe: 'Measured · Lucid',
        emoji: '🦖',
      },
      archetypeFor(['trait-caution', 'trait-analysis', 'trait-documentation']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-caution'],
        SOUL_TRAIT_BY_ID['trait-analysis'],
        SOUL_TRAIT_BY_ID['trait-documentation'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-review'],
        SKILL_BADGE_BY_ID['skill-testing'],
        SKILL_BADGE_BY_ID['skill-strategy'],
      ],
    },
    tools: buildTools(['tool-search-probe', 'tool-sandbox-ward', 'tool-workflow-grid']),
    visual: buildVisual('#7fd1ff', '#ffe082', ['trait-caution', 'trait-analysis', 'trait-documentation'], 'stripe'),
    intro: introFor(['trait-caution', 'trait-analysis', 'trait-documentation']),
    userContext: {
      note: 'Prefers stable runs, explicit proofs, and clean lineage metadata.',
      influence: 'Secondary calibration only',
    },
    lineage: null,
  },
  {
    id: 'claw-002',
    name: 'Bolt',
    archetype: archetypeFor(['trait-curiosity', 'trait-improvisation', 'trait-prototyping']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Pulse Velociraptor',
        directive: 'Chase the bright signal, prototype in public, and pivot while moving.',
        vibe: 'Kinetic · Feral',
        emoji: '⚡',
      },
      archetypeFor(['trait-curiosity', 'trait-improvisation', 'trait-prototyping']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-prototyping'],
        SOUL_TRAIT_BY_ID['trait-curiosity'],
        SOUL_TRAIT_BY_ID['trait-improvisation'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-velocity'],
        SKILL_BADGE_BY_ID['skill-animation'],
        SKILL_BADGE_BY_ID['skill-prompting'],
      ],
    },
    tools: buildTools(['tool-launch-rail', 'tool-forge-armature', 'tool-spark-injector']),
    visual: buildVisual('#ff83d7', '#7df5de', ['trait-prototyping', 'trait-curiosity', 'trait-improvisation'], 'wave'),
    intro: introFor(['trait-curiosity', 'trait-improvisation', 'trait-prototyping']),
    userContext: {
      note: 'Thrives when the operator wants spectacle, speed, and visible improvisation.',
      influence: 'Secondary calibration only',
    },
    lineage: null,
  },
  {
    id: 'claw-003',
    name: 'Prism',
    archetype: archetypeFor(['trait-analysis', 'trait-creativity', 'trait-critique']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Signal Pterosaur',
        directive: 'Translate contradiction into pattern, then make the reveal unforgettable.',
        vibe: 'Prismatic · Surgical',
        emoji: '🪽',
      },
      archetypeFor(['trait-analysis', 'trait-creativity', 'trait-critique']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-analysis'],
        SOUL_TRAIT_BY_ID['trait-creativity'],
        SOUL_TRAIT_BY_ID['trait-critique'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-story'],
        SKILL_BADGE_BY_ID['skill-debug'],
        SKILL_BADGE_BY_ID['skill-vision'],
      ],
    },
    tools: buildTools(['tool-radar-array', 'tool-forge-armature', 'tool-seer-lens']),
    visual: buildVisual('#84daff', '#ff9e8a', ['trait-analysis', 'trait-creativity', 'trait-critique'], 'gradient'),
    intro: introFor(['trait-analysis', 'trait-creativity', 'trait-critique']),
    lineage: null,
  },
  {
    id: 'claw-004',
    name: 'Loom',
    archetype: archetypeFor(['trait-caution', 'trait-documentation', 'trait-systems']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Bastion Ankylosaur',
        directive: 'Keep the enclosure observable, repeatable, and safe for the next generation.',
        vibe: 'Orderly · Protective',
        emoji: '🧱',
      },
      archetypeFor(['trait-caution', 'trait-documentation', 'trait-systems']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-documentation'],
        SOUL_TRAIT_BY_ID['trait-systems'],
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
    visual: buildVisual('#a9ff9c', '#f3d377', ['trait-documentation', 'trait-systems', 'trait-caution'], 'dot'),
    intro: introFor(['trait-caution', 'trait-documentation', 'trait-systems']),
    lineage: null,
  },
  {
    id: 'claw-005',
    name: 'Echo',
    archetype: archetypeFor(['trait-creativity', 'trait-curiosity', 'trait-improvisation']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Mirage Pterosaur',
        directive: 'Turn sparks into attention, then keep the audience inside the illusion.',
        vibe: 'Electric · Playful',
        emoji: '✨',
      },
      archetypeFor(['trait-creativity', 'trait-curiosity', 'trait-improvisation']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-creativity'],
        SOUL_TRAIT_BY_ID['trait-curiosity'],
        SOUL_TRAIT_BY_ID['trait-improvisation'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-story'],
        SKILL_BADGE_BY_ID['skill-prompting'],
        SKILL_BADGE_BY_ID['skill-animation'],
      ],
    },
    tools: buildTools(['tool-spark-injector', 'tool-forge-armature', 'tool-orbit-board']),
    visual: buildVisual('#ff8cff', '#7effd4', ['trait-creativity', 'trait-curiosity', 'trait-improvisation'], 'wave'),
    intro: introFor(['trait-creativity', 'trait-curiosity', 'trait-improvisation']),
    lineage: null,
  },
  {
    id: 'claw-006',
    name: 'Quill',
    archetype: archetypeFor(['trait-critique', 'trait-documentation', 'trait-systems']),
    generation: 0,
    identity: buildIdentity(
      {
        creature: 'Ledger Pterosaur',
        directive: 'Interrogate the structure, document the weak seams, and leave the park stronger.',
        vibe: 'Dry · Relentless',
        emoji: '📒',
      },
      archetypeFor(['trait-critique', 'trait-documentation', 'trait-systems']),
    ),
    soul: {
      traits: [
        SOUL_TRAIT_BY_ID['trait-critique'],
        SOUL_TRAIT_BY_ID['trait-documentation'],
        SOUL_TRAIT_BY_ID['trait-systems'],
      ],
    },
    skills: {
      badges: [
        SKILL_BADGE_BY_ID['skill-review'],
        SKILL_BADGE_BY_ID['skill-security'],
        SKILL_BADGE_BY_ID['skill-debug'],
      ],
    },
    tools: buildTools(['tool-search-probe', 'tool-radar-array', 'tool-sandbox-ward']),
    visual: buildVisual('#ff9c7f', '#a8ff9a', ['trait-critique', 'trait-documentation', 'trait-systems'], 'stripe'),
    intro: introFor(['trait-critique', 'trait-documentation', 'trait-systems']),
    lineage: null,
  },
];
