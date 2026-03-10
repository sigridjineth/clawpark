import { resolveArchetype } from './archetype';
import { inheritSkillBadges, inheritSoulTraits, inheritToolBadges } from './inherit';
import { attemptMutation } from './mutate';
import { fuseIdentity, getClawTools } from './openclaw';
import { generateVisual } from './visual';
import { isDemoShowcasePair, resolveBreedSeed } from '../utils/demoMode';
import { createSeededRng, pickWithRng } from '../utils/random';
import type { BreedRequest, BreedResult } from '../types/claw';

const CHILD_NAMES = ['Ember', 'Nova', 'Glyph', 'Relay', 'Quartz', 'Drift', 'Halo', 'Patch', 'Mycel', 'Rook'];

function buildChildName(request: BreedRequest, rng: () => number) {
  if (request.demoMode && isDemoShowcasePair(request.parentA.id, request.parentB.id)) {
    return 'Ember';
  }

  return pickWithRng(CHILD_NAMES, rng);
}

export function breed(request: BreedRequest): BreedResult {
  const seed =
    request.seed ??
    resolveBreedSeed(
      request.parentA.id,
      request.parentB.id,
      request.preferredTraitId,
      Boolean(request.demoMode),
      request.breedCount ?? 0,
    );
  const rng = createSeededRng(seed);

  const soulResult = inheritSoulTraits(
    request.parentA.soul.traits,
    request.parentB.soul.traits,
    request.preferredTraitId,
    rng,
  );

  const skillResult = inheritSkillBadges(
    request.parentA.skills.badges,
    request.parentB.skills.badges,
    rng,
  );

  const toolResult = inheritToolBadges(
    getClawTools(request.parentA).loadout,
    getClawTools(request.parentB).loadout,
    rng,
  );

  const mutationResult = attemptMutation({
    parentA: request.parentA,
    parentB: request.parentB,
    soulResult,
    skillResult,
    rng,
    demoMode: request.demoMode,
  });

  const { archetype, intro: resolvedIntro } = resolveArchetype(
    mutationResult.finalSoulTraits,
    mutationResult.finalSkillBadges,
    Boolean(request.demoMode),
  );
  const identityResult = fuseIdentity({
    parentA: request.parentA,
    parentB: request.parentB,
    childSoulTraits: mutationResult.finalSoulTraits,
    childSkillBadges: mutationResult.finalSkillBadges,
    childTools: toolResult.selected,
    archetype,
    records: [...soulResult.records, ...skillResult.records, ...toolResult.records],
  });

  const child = {
    id: `claw-${crypto.randomUUID().slice(0, 8)}`,
    name: buildChildName(request, rng),
    archetype,
    generation: Math.max(request.parentA.generation, request.parentB.generation) + 1,
    identity: identityResult.identity,
    soul: { traits: mutationResult.finalSoulTraits },
    skills: { badges: mutationResult.finalSkillBadges },
    tools: { loadout: toolResult.selected },
    visual: generateVisual(
      request.parentA.visual,
      request.parentB.visual,
      mutationResult.finalSoulTraits,
      mutationResult.finalSkillBadges,
      mutationResult.occurred,
    ),
    intro:
      request.demoMode && isDemoShowcasePair(request.parentA.id, request.parentB.id)
        ? 'I inherited caution from Sage, velocity from Bolt, and a dangerous instinct to leap when the hidden route appears.'
        : resolvedIntro,
    lineage: {
      parentA: request.parentA.id,
      parentB: request.parentB.id,
      inheritanceMap: [
        ...identityResult.records,
        ...soulResult.records,
        ...skillResult.records,
        ...toolResult.records,
        ...(mutationResult.record ? [mutationResult.record] : []),
      ],
    },
  };

  return {
    child,
    inheritanceMap: child.lineage.inheritanceMap,
    mutationOccurred: mutationResult.occurred,
    mutatedTrait: mutationResult.newTrait,
    eliminatedSoulIds: soulResult.eliminated.map((trait) => trait.id),
    eliminatedSkillIds: skillResult.eliminated.map((badge) => badge.id),
    eliminatedToolIds: toolResult.eliminated.map((tool) => tool.id),
  };
}
