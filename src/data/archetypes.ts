import type { ArchetypeEntry } from '../types/claw';

export function traitComboKey(ids: string[]): string {
  return [...ids].sort().join('|');
}

export const ARCHETYPES: ArchetypeEntry[] = [
  {
    traitComboKey: traitComboKey(['trait-analysis', 'trait-caution', 'trait-documentation']),
    name: 'The Patient Analyst',
    introTemplate: 'I verify every current, label every branch, and only then cut toward the answer.',
  },
  {
    traitComboKey: traitComboKey(['trait-curiosity', 'trait-improvisation', 'trait-prototyping']),
    name: 'The Rapid Prototyper',
    introTemplate: 'I chase fresh sparks at full speed, then improvise a path through the smoke.',
  },
  {
    traitComboKey: traitComboKey(['trait-analysis', 'trait-creativity', 'trait-critique']),
    name: 'The Pattern Oracle',
    introTemplate: 'I turn contradiction into pattern, then sharpen it until the future starts to glow.',
  },
  {
    traitComboKey: traitComboKey(['trait-caution', 'trait-documentation', 'trait-systems']),
    name: 'The Systems Gardener',
    introTemplate: 'I cultivate durable systems, keep receipts, and prune risk before it spreads.',
  },
  {
    traitComboKey: traitComboKey(['trait-creativity', 'trait-curiosity', 'trait-improvisation']),
    name: 'The Wild Composer',
    introTemplate: 'I sample strange signals, remix them live, and leave behind a melody that ships.',
  },
  {
    traitComboKey: traitComboKey(['trait-critique', 'trait-documentation', 'trait-systems']),
    name: 'The Relentless Reviewer',
    introTemplate: 'I interrogate the structure, document every seam, and fortify what survives.',
  },
  {
    traitComboKey: traitComboKey(['mutation-leap-logic', 'trait-caution', 'trait-prototyping']),
    name: 'The Skeptical Builder',
    introTemplate: 'I build fast but verify twice — then leap anyway when the hidden signal is too bright to ignore.',
  },
  {
    traitComboKey: traitComboKey(['trait-analysis', 'trait-curiosity', 'trait-systems']),
    name: 'The Signal Cartographer',
    introTemplate: 'I map the unseen system, trace the anomalies, and route everyone toward the real frontier.',
  },
];

export const ARCHETYPE_BY_KEY = Object.fromEntries(
  ARCHETYPES.map((entry) => [entry.traitComboKey, entry]),
);
