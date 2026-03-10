import { resolveArchetype } from './archetype';
import { computeMutationChance } from './mutate';
import { buildDimensionForecast } from './openclaw';
import type { BreedPrediction, Claw } from '../types/claw';

export function predictBreed(
  parentA: Claw,
  parentB: Claw,
  preferredTraitId?: string,
  demoMode?: boolean,
): BreedPrediction {
  const combined = new Map<
    string,
    { label: string; score: number; source: 'parentA' | 'parentB' | 'both'; sample: Claw['soul']['traits'][number] }
  >();

  const register = (
    trait: Claw['soul']['traits'][number],
    source: 'parentA' | 'parentB',
  ) => {
    const existing = combined.get(trait.id);
    if (existing) {
      existing.source = 'both';
      existing.score = Math.min(1, existing.score + trait.weight * 0.5);
      return;
    }

    combined.set(trait.id, {
      label: trait.label,
      score: trait.weight,
      source,
      sample: trait,
    });
  };

  parentA.soul.traits.forEach((trait) => register(trait, 'parentA'));
  parentB.soul.traits.forEach((trait) => register(trait, 'parentB'));

  const pool = [...combined.entries()].map(([traitId, value]) => ({
    traitId,
    label: value.label,
    source: value.source,
    score: traitId === preferredTraitId ? Math.min(1, value.score * 1.5) : value.score,
    sample: value.sample,
  }));

  const total = pool.reduce((sum, trait) => sum + trait.score, 0) || 1;
  const sorted = pool.sort((left, right) => right.score - left.score);
  const predictedArchetype = resolveArchetype(
    sorted.slice(0, 3).map((trait) => trait.sample),
    [...parentA.skills.badges, ...parentB.skills.badges]
      .sort((left, right) => right.dominance - left.dominance)
      .slice(0, 3),
    demoMode,
  ).archetype;

  return {
    traitPredictions: sorted.map((trait) => ({
      traitId: trait.traitId,
      label: trait.label,
      probability: trait.score / total,
      type: 'soul',
      source: trait.source,
    })),
    mutationChance: computeMutationChance(parentA, parentB, demoMode),
    predictedArchetype,
    dimensionForecast: buildDimensionForecast({
      parentA,
      parentB,
      predictedArchetype,
      traitLabels: sorted.map((trait) => trait.label),
    }),
  };
}
