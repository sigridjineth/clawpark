import type { SkillBadge, SoulTrait } from '../types/claw';

export const MUTATION_SOUL_TRAITS: SoulTrait[] = [
  {
    id: 'mutation-leap-logic',
    label: 'Leap Logic',
    description: 'Jumps from signal to insight before anyone else sees the bridge.',
    weight: 0.9,
    color: '#b88cff',
    visualSymbol: { shapeModifier: 'spiral', description: 'Electric arcs with unstable momentum.' },
  },
  {
    id: 'mutation-signal-sense',
    label: 'Signal Sense',
    description: 'Hears quiet correlations hiding beneath the obvious.',
    weight: 0.88,
    color: '#89f0ff',
    visualSymbol: { shapeModifier: 'geometric', description: 'Pulse rings and target marks.' },
  },
  {
    id: 'mutation-dreamforge',
    label: 'Dreamforge',
    description: 'Turns vague sparks into executable forms.',
    weight: 0.87,
    color: '#ff90d7',
    visualSymbol: { shapeModifier: 'fragmented', description: 'Forged shards orbiting a hot core.' },
  },
];

export const MUTATION_SKILLS: SkillBadge[] = [
  { id: 'mutation-swarm', label: 'Swarm Sync', icon: 'Orbit', dominance: 0.92, color: '#b7a2ff' },
  { id: 'mutation-foresight', label: 'Foresight', icon: 'Eye', dominance: 0.89, color: '#89f4d3' },
  { id: 'mutation-chaos', label: 'Chaos Taming', icon: 'WandSparkles', dominance: 0.91, color: '#ffb4f2' },
];
