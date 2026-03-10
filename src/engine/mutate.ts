import { MUTATION_SKILLS, MUTATION_SOUL_TRAITS } from '../data/mutations';
import type { Claw, InheritanceRecord, SkillBadge, SoulTrait } from '../types/claw';
import type { SkillInheritanceResult, SoulInheritanceResult } from './inherit';

export interface MutationResult {
  occurred: boolean;
  finalSoulTraits: SoulTrait[];
  finalSkillBadges: SkillBadge[];
  newTrait?: SoulTrait | SkillBadge;
  record?: InheritanceRecord;
}

export function computeMutationChance(parentA: Claw, parentB: Claw, demoMode = false) {
  if (demoMode) {
    return 1;
  }

  const sharedTraits = parentA.soul.traits.filter((trait) =>
    parentB.soul.traits.some((candidate) => candidate.id === trait.id),
  ).length;

  if (sharedTraits >= 3) {
    return 0.15;
  }

  if (sharedTraits === 0) {
    return 0.05;
  }

  return 0.1;
}

function lowestWeightId(weights: Record<string, number>) {
  return Object.entries(weights).sort((left, right) => left[1] - right[1])[0]?.[0];
}

function originFilter<T extends { id: string }>(items: T[], parentA: T[], parentB: T[]) {
  const excluded = new Set([...items, ...parentA, ...parentB].map((item) => item.id));
  return (candidate: T) => !excluded.has(candidate.id);
}

export function attemptMutation({
  parentA,
  parentB,
  soulResult,
  skillResult,
  rng,
  demoMode,
}: {
  parentA: Claw;
  parentB: Claw;
  soulResult: SoulInheritanceResult;
  skillResult: SkillInheritanceResult;
  rng: () => number;
  demoMode?: boolean;
}): MutationResult {
  const chance = computeMutationChance(parentA, parentB, demoMode);
  if (rng() > chance) {
    return {
      occurred: false,
      finalSoulTraits: soulResult.selected,
      finalSkillBadges: skillResult.selected,
    };
  }

  const mutateSoul = rng() < 0.5;

  if (mutateSoul) {
    const candidate = MUTATION_SOUL_TRAITS.filter(
      originFilter(soulResult.selected, parentA.soul.traits, parentB.soul.traits),
    )[0];

    if (!candidate) {
      return {
        occurred: false,
        finalSoulTraits: soulResult.selected,
        finalSkillBadges: skillResult.selected,
      };
    }

    const replaceId = lowestWeightId(soulResult.weights);
    const finalSoulTraits = soulResult.selected.map((trait) => (trait.id === replaceId ? candidate : trait));

    return {
      occurred: true,
      finalSoulTraits,
      finalSkillBadges: skillResult.selected,
      newTrait: candidate,
      record: {
        type: 'soul',
        traitId: candidate.id,
        label: candidate.label,
        origin: 'mutation',
        originWeight: 1,
        kind: 'mutation',
        detail: `${candidate.label} erupted as a new SOUL mutation during fusion.`,
      },
    };
  }

  const candidate = MUTATION_SKILLS.filter(
    originFilter(skillResult.selected, parentA.skills.badges, parentB.skills.badges),
  )[0];

  if (!candidate) {
    return {
      occurred: false,
      finalSoulTraits: soulResult.selected,
      finalSkillBadges: skillResult.selected,
    };
  }

  const replaceId = lowestWeightId(skillResult.weights);
  const finalSkillBadges = skillResult.selected.map((badge) => (badge.id === replaceId ? candidate : badge));

  return {
    occurred: true,
    finalSoulTraits: soulResult.selected,
    finalSkillBadges,
    newTrait: candidate,
    record: {
      type: 'skill',
      traitId: candidate.id,
      label: candidate.label,
      origin: 'mutation',
      originWeight: 1,
      kind: 'mutation',
      detail: `${candidate.label} materialized as a mutated SKILL routine.`,
    },
  };
}
