import { deriveToolLoadout } from './openclaw';
import type { InheritanceRecord, SkillBadge, SoulTrait, ToolBadge, TraitOrigin } from '../types/claw';

type Candidate<T extends { id: string; label: string }> = {
  item: T;
  score: number;
  origin: TraitOrigin;
};

const STEERING_ALIASES: Record<string, string[]> = {
  critique: ['skeptic', 'skeptical', 'review', 'challenge', 'critic'],
  caution: ['cautious', 'careful', 'safe', 'safety', 'verify', 'guardrail'],
  documentation: ['document', 'trace', 'notes', 'write', 'record'],
  systems: ['system', 'systems', 'architecture', 'workflow', 'orchestrate'],
  curiosity: ['curious', 'explore', 'discover', 'novel'],
  creativity: ['creative', 'imagine', 'invent'],
  security: ['security', 'secure', 'sandbox', 'guard'],
  debugging: ['debug', 'bug', 'fix', 'diagnose'],
  testing: ['test', 'qa', 'validate'],
  'code review': ['review', 'audit', 'pr'],
  'workflow grid': ['workflow', 'pipeline', 'orchestrate'],
  'sandbox ward': ['sandbox', 'guard', 'safe', 'safety'],
  'search probe': ['search', 'inspect', 'investigate'],
  'launch rail': ['launch', 'ship', 'release'],
};

function promptSignalScore(steeringPrompt: string | undefined, item: { label: string; description?: string }) {
  if (!steeringPrompt) return 0;
  const lower = steeringPrompt.toLowerCase();
  const label = item.label.toLowerCase();
  const labelHit = lower.includes(label) ? 0.45 : 0;
  const aliasHits = (STEERING_ALIASES[label] ?? []).reduce((sum, token) => sum + (lower.includes(token) ? 0.12 : 0), 0);
  const descriptionWords = (item.description ?? '')
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((token) => token.length >= 4)
    .slice(0, 6);
  const descriptionHits = descriptionWords.reduce((sum, token) => sum + (lower.includes(token) ? 0.05 : 0), 0);
  return Math.min(0.7, labelHit + aliasHits + descriptionHits);
}

function inheritanceDetail(type: 'soul' | 'skill' | 'tool', label: string, origin: TraitOrigin) {
  const noun = type === 'soul' ? 'SOUL strand' : type === 'skill' ? 'SKILL routine' : 'TOOL loadout';

  switch (origin) {
    case 'both':
      return `${label} stabilized as a shared ${noun.toLowerCase()} from both parents.`;
    case 'parentA':
      return `${label} was inherited intact from Parent A's ${noun.toLowerCase()}.`;
    case 'parentB':
      return `${label} was inherited intact from Parent B's ${noun.toLowerCase()}.`;
    case 'mutation':
      return `${label} emerged as a mutation across the ${noun.toLowerCase()}.`;
    default:
      return `${label} propagated through the ${noun.toLowerCase()}.`;
  }
}

export interface SoulInheritanceResult {
  selected: SoulTrait[];
  eliminated: SoulTrait[];
  records: InheritanceRecord[];
  weights: Record<string, number>;
}

export interface SkillInheritanceResult {
  selected: SkillBadge[];
  eliminated: SkillBadge[];
  records: InheritanceRecord[];
  weights: Record<string, number>;
}

export interface ToolInheritanceResult {
  selected: ToolBadge[];
  eliminated: ToolBadge[];
  records: InheritanceRecord[];
  weights: Record<string, number>;
}

function weightedTake<T extends { id: string; label: string }>(
  candidates: Candidate<T>[],
  count: number,
  rng: () => number,
) {
  const guaranteed = candidates.filter((candidate) => candidate.origin === 'both');
  const selected = [...guaranteed].slice(0, count);
  const pool = candidates.filter((candidate) => !selected.some((entry) => entry.item.id === candidate.item.id));

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, candidate) => sum + candidate.score, 0);
    let threshold = rng() * total;
    let pickIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      threshold -= pool[index].score;
      if (threshold <= 0) {
        pickIndex = index;
        break;
      }
    }

    selected.push(pool.splice(pickIndex, 1)[0]);
  }

  return selected;
}

function mergeTraitPool(
  traitsA: SoulTrait[],
  traitsB: SoulTrait[],
  preferredTraitId: string | undefined,
  steeringPrompt: string | undefined,
): Candidate<SoulTrait>[] {
  const map = new Map<string, Candidate<SoulTrait>>();

  const register = (trait: SoulTrait, origin: Exclude<TraitOrigin, 'both' | 'mutation'>) => {
    const existing = map.get(trait.id);
    if (existing) {
      existing.origin = 'both';
      existing.score = Math.min(1, existing.score + trait.weight * 0.5);
      return;
    }

    map.set(trait.id, {
      item: trait,
      score: trait.weight,
      origin,
    });
  };

  traitsA.forEach((trait) => register(trait, 'parentA'));
  traitsB.forEach((trait) => register(trait, 'parentB'));

  const candidates = [...map.values()].map((candidate) => {
    const score =
      candidate.item.id === preferredTraitId
        ? Math.min(1, candidate.score * 1.5)
        : Math.min(1, candidate.score + promptSignalScore(steeringPrompt, candidate.item));
    return { ...candidate, score };
  });

  return candidates.sort((left, right) => right.score - left.score);
}

function mergeSkillPool(badgesA: SkillBadge[], badgesB: SkillBadge[], steeringPrompt: string | undefined): Candidate<SkillBadge>[] {
  const map = new Map<string, Candidate<SkillBadge>>();

  const register = (badge: SkillBadge, origin: Exclude<TraitOrigin, 'both' | 'mutation'>) => {
    const existing = map.get(badge.id);
    if (existing) {
      existing.origin = 'both';
      existing.score = Math.min(1, existing.score + badge.dominance * 0.45);
      return;
    }

    map.set(badge.id, {
      item: badge,
      score: badge.dominance,
      origin,
    });
  };

  badgesA.forEach((badge) => register(badge, 'parentA'));
  badgesB.forEach((badge) => register(badge, 'parentB'));

  return [...map.values()]
    .map((candidate) => ({
      ...candidate,
      score: Math.min(1, candidate.score + promptSignalScore(steeringPrompt, candidate.item)),
    }))
    .sort((left, right) => right.score - left.score);
}

function mergeToolPool(
  loadoutA: ToolBadge[],
  loadoutB: ToolBadge[],
  steeringPrompt: string | undefined,
  emergentSkills: SkillBadge[],
): Candidate<ToolBadge>[] {
  const map = new Map<string, Candidate<ToolBadge>>();

  const register = (tool: ToolBadge, origin: Exclude<TraitOrigin, 'both' | 'mutation'>) => {
    const existing = map.get(tool.id);
    if (existing) {
      existing.origin = 'both';
      existing.score = Math.min(1, existing.score + tool.potency * 0.45);
      return;
    }

    map.set(tool.id, {
      item: tool,
      score: tool.potency,
      origin,
    });
  };

  loadoutA.forEach((tool) => register(tool, 'parentA'));
  loadoutB.forEach((tool) => register(tool, 'parentB'));

  const derivedTools = deriveToolLoadout(emergentSkills);
  for (const tool of derivedTools) {
    const existing = map.get(tool.id);
    if (existing) {
      existing.score = Math.min(1, existing.score + 0.2);
      continue;
    }
    map.set(tool.id, {
      item: tool,
      score: Math.min(1, tool.potency + 0.15),
      origin: emergentSkills.some((skill) => skill.id.startsWith('mutation-')) ? 'mutation' : 'both',
    });
  }

  return [...map.values()]
    .map((candidate) => ({
      ...candidate,
      score: Math.min(1, candidate.score + promptSignalScore(steeringPrompt, candidate.item)),
    }))
    .sort((left, right) => right.score - left.score);
}

export function inheritSoulTraits(
  traitsA: SoulTrait[],
  traitsB: SoulTrait[],
  preferredTraitId: string | undefined,
  rng: () => number,
  steeringPrompt?: string,
): SoulInheritanceResult {
  const candidates = mergeTraitPool(traitsA, traitsB, preferredTraitId, steeringPrompt);
  const selectedCandidates = weightedTake(candidates, 3, rng);
  const selectedIds = new Set(selectedCandidates.map((candidate) => candidate.item.id));

  return {
    selected: selectedCandidates.map((candidate) => candidate.item),
    eliminated: candidates
      .filter((candidate) => !selectedIds.has(candidate.item.id))
      .map((candidate) => candidate.item),
    weights: Object.fromEntries(selectedCandidates.map((candidate) => [candidate.item.id, candidate.score])),
    records: selectedCandidates.map((candidate) => ({
      type: 'soul',
      traitId: candidate.item.id,
      label: candidate.item.label,
      origin: candidate.origin,
      originWeight: candidate.score,
      kind: candidate.origin === 'both' ? 'dominant' : 'inherited',
      detail: inheritanceDetail('soul', candidate.item.label, candidate.origin),
    })),
  };
}

export function inheritSkillBadges(
  badgesA: SkillBadge[],
  badgesB: SkillBadge[],
  rng: () => number,
  steeringPrompt?: string,
): SkillInheritanceResult {
  const candidates = mergeSkillPool(badgesA, badgesB, steeringPrompt);
  const selectedCandidates = weightedTake(candidates, 3, rng);
  const selectedIds = new Set(selectedCandidates.map((candidate) => candidate.item.id));

  return {
    selected: selectedCandidates.map((candidate) => candidate.item),
    eliminated: candidates
      .filter((candidate) => !selectedIds.has(candidate.item.id))
      .map((candidate) => candidate.item),
    weights: Object.fromEntries(selectedCandidates.map((candidate) => [candidate.item.id, candidate.score])),
    records: selectedCandidates.map((candidate) => ({
      type: 'skill',
      traitId: candidate.item.id,
      label: candidate.item.label,
      origin: candidate.origin,
      originWeight: candidate.score,
      kind: candidate.origin === 'both' ? 'dominant' : 'inherited',
      detail: inheritanceDetail('skill', candidate.item.label, candidate.origin),
    })),
  };
}

export function inheritToolBadges(
  loadoutA: ToolBadge[],
  loadoutB: ToolBadge[],
  rng: () => number,
  steeringPrompt?: string,
  emergentSkills: SkillBadge[] = [],
): ToolInheritanceResult {
  const candidates = mergeToolPool(loadoutA, loadoutB, steeringPrompt, emergentSkills);
  const selectedCandidates = weightedTake(candidates, 3, rng);
  const selectedIds = new Set(selectedCandidates.map((candidate) => candidate.item.id));

  return {
    selected: selectedCandidates.map((candidate) => candidate.item),
    eliminated: candidates
      .filter((candidate) => !selectedIds.has(candidate.item.id))
      .map((candidate) => candidate.item),
    weights: Object.fromEntries(selectedCandidates.map((candidate) => [candidate.item.id, candidate.score])),
    records: selectedCandidates.map((candidate) => ({
      type: 'tool',
      traitId: candidate.item.id,
      label: candidate.item.label,
      origin: candidate.origin,
      originWeight: candidate.score,
      kind: candidate.origin === 'both' ? 'dominant' : 'inherited',
      detail:
        candidate.origin === 'both'
          ? `${candidate.item.label} fused into the shared tool loadout.`
          : candidate.item.description,
    })),
  };
}
