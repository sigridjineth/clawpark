import type { SoulTrait } from '../types/claw';

export const SOUL_TRAITS: SoulTrait[] = [
  {
    id: 'trait-caution',
    label: 'Caution',
    description: 'Verifies twice before committing to a move.',
    weight: 0.84,
    color: '#8dd3ff',
    visualSymbol: { shapeModifier: 'symmetric', description: 'Balanced, stable forms.' },
  },
  {
    id: 'trait-curiosity',
    label: 'Curiosity',
    description: 'Reaches into unknown branches and hidden prompts.',
    weight: 0.72,
    color: '#6ef2d9',
    visualSymbol: { shapeModifier: 'tentacle', description: 'Extending tendrils and hooks.' },
  },
  {
    id: 'trait-critique',
    label: 'Critique',
    description: 'Cuts through weak logic with precise edges.',
    weight: 0.77,
    color: '#ff9d74',
    visualSymbol: { shapeModifier: 'angular', description: 'Sharp wedges and facets.' },
  },
  {
    id: 'trait-documentation',
    label: 'Documentation',
    description: 'Leaves an observable trail for every decision.',
    weight: 0.74,
    color: '#f2d176',
    visualSymbol: { shapeModifier: 'grid', description: 'Layered grids and measured marks.' },
  },
  {
    id: 'trait-prototyping',
    label: 'Prototyping',
    description: 'Builds quickly from fragments and rough sparks.',
    weight: 0.79,
    color: '#ff78d5',
    visualSymbol: { shapeModifier: 'fragmented', description: 'Assembled shards and scraps.' },
  },
  {
    id: 'trait-improvisation',
    label: 'Improvisation',
    description: 'Trusts instinct and bends around obstacles.',
    weight: 0.69,
    color: '#c89bff',
    visualSymbol: { shapeModifier: 'organic', description: 'Fluid curves and asymmetry.' },
  },
  {
    id: 'trait-analysis',
    label: 'Analysis',
    description: 'Finds patterns and scales hidden in the noise.',
    weight: 0.82,
    color: '#7ee1ff',
    visualSymbol: { shapeModifier: 'geometric', description: 'Measured circles and marks.' },
  },
  {
    id: 'trait-creativity',
    label: 'Creativity',
    description: 'Turns collisions into luminous concepts.',
    weight: 0.7,
    color: '#fe8cff',
    visualSymbol: { shapeModifier: 'spiral', description: 'Swirls, loops, and expanding spirals.' },
  },
  {
    id: 'trait-systems',
    label: 'Systems',
    description: 'Sees the machine beneath the interface.',
    weight: 0.76,
    color: '#a4ff9d',
    visualSymbol: { shapeModifier: 'crystalline', description: 'Crystal lattices and stable structures.' },
  },
];

export const SOUL_TRAIT_BY_ID = Object.fromEntries(SOUL_TRAITS.map((trait) => [trait.id, trait]));
