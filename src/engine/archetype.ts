import { ARCHETYPE_BY_KEY, traitComboKey } from '../data/archetypes';
import type { SkillBadge, SoulTrait } from '../types/claw';

const ADJECTIVE_BY_TRAIT: Record<string, string> = {
  'trait-caution': 'Patient',
  'trait-curiosity': 'Restless',
  'trait-critique': 'Sharp',
  'trait-documentation': 'Recorded',
  'trait-prototyping': 'Experimental',
  'trait-improvisation': 'Elastic',
  'trait-analysis': 'Signal',
  'trait-creativity': 'Wild',
  'trait-systems': 'Architectural',
  'mutation-leap-logic': 'Skeptical',
  'mutation-signal-sense': 'Resonant',
  'mutation-dreamforge': 'Mythic',
};

const NOUN_BY_SKILL: Record<string, string> = {
  'skill-review': 'Reviewer',
  'skill-strategy': 'Architect',
  'skill-prompting': 'Invoker',
  'skill-testing': 'Verifier',
  'skill-animation': 'Shaper',
  'skill-story': 'Narrator',
  'skill-security': 'Guardian',
  'skill-debug': 'Fixer',
  'skill-vision': 'Scout',
  'skill-velocity': 'Builder',
  'mutation-swarm': 'Swarmmind',
  'mutation-foresight': 'Oracle',
  'mutation-chaos': 'Tamer',
};

export function resolveArchetype(
  soulTraits: SoulTrait[],
  skillBadges: SkillBadge[],
  demoMode = false,
) {
  const key = traitComboKey(soulTraits.map((trait) => trait.id));
  const exact = ARCHETYPE_BY_KEY[key];

  if (exact) {
    return {
      archetype: exact.name,
      intro: exact.introTemplate,
    };
  }

  const leadTrait = soulTraits[0];
  const leadSkill = [...skillBadges].sort((left, right) => right.dominance - left.dominance)[0];
  const archetype = `The ${ADJECTIVE_BY_TRAIT[leadTrait.id] ?? leadTrait.label} ${
    NOUN_BY_SKILL[leadSkill.id] ?? leadSkill.label
  }`;

  const mutationTrait = soulTraits.find((trait) => trait.id.startsWith('mutation-'))?.label;
  const intro = demoMode && mutationTrait
    ? `I inherited restraint, urgency, and a sudden ${mutationTrait.toLowerCase()} — so now I prototype with purpose and move before the window closes.`
    : `I blend ${soulTraits[0].label.toLowerCase()}, ${soulTraits[1].label.toLowerCase()}, and ${
        skillBadges[0].label.toLowerCase()
      } into a style that keeps evolving under pressure.`;

  return { archetype, intro };
}
