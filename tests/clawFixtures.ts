import type { Claw, ClawVisual, SkillBadge, SoulTrait } from "../src/types/claw";

function makeTrait(
  id: string,
  label: string,
  weight: number,
  color: string,
  shapeModifier: SoulTrait["visualSymbol"]["shapeModifier"],
  description = `${label} fixture`
): SoulTrait {
  return {
    id,
    label,
    description,
    weight,
    color,
    visualSymbol: {
      shapeModifier,
      description,
    },
  };
}

function makeSkill(
  id: string,
  label: string,
  dominance: number,
  color: string,
  icon = "Sparkles"
): SkillBadge {
  return {
    id,
    label,
    dominance,
    color,
    icon,
  };
}

function makeVisual(
  primaryColor: string,
  secondaryColor: string,
  shapeModifiers: ClawVisual["shapeModifiers"],
  pattern: ClawVisual["pattern"]
): ClawVisual {
  return {
    primaryColor,
    secondaryColor,
    shapeModifiers,
    pattern,
    glowIntensity: 0.3,
  };
}

function makeClaw(
  id: string,
  name: string,
  archetype: string,
  soulTraits: SoulTrait[],
  skillBadges: SkillBadge[],
  visual: ClawVisual,
  intro: string
): Claw {
  return {
    id,
    name,
    archetype,
    generation: 0,
    soul: { traits: soulTraits },
    skills: { badges: skillBadges },
    visual,
    intro,
    lineage: null,
  };
}

export function createParentPair() {
  const cautious = makeTrait("cautious", "신중함", 0.8, "#3B82F6", "symmetric");
  const analytical = makeTrait("analytical", "분석적", 0.7, "#6366F1", "geometric");
  const patient = makeTrait("patient", "인내심", 0.5, "#8B5CF6", "crystalline");
  const spontaneous = makeTrait("spontaneous", "즉흥적", 0.9, "#F59E0B", "organic");
  const curious = makeTrait("curious", "호기심", 0.7, "#EF4444", "tentacle");
  const optimistic = makeTrait("optimistic", "낙관적", 0.5, "#F97316", "spiral");

  const codeReview = makeSkill("code_review", "코드리뷰", 0.9, "#10B981", "Search");
  const testing = makeSkill("testing", "테스팅", 0.7, "#14B8A6", "Shield");
  const documentation = makeSkill("documentation", "문서화", 0.5, "#06B6D4", "FileText");
  const prototyping = makeSkill("prototyping", "프로토타이핑", 0.9, "#FBBF24", "Zap");
  const ideation = makeSkill("ideation", "아이디어", 0.7, "#FB923C", "Lightbulb");
  const speedCoding = makeSkill("speed_coding", "속도코딩", 0.6, "#F87171", "Timer");

  const parentA = makeClaw(
    "claw-001",
    "Sage",
    "The Patient Analyst",
    [cautious, analytical, patient],
    [codeReview, testing, documentation],
    makeVisual("#3B82F6", "#6366F1", ["symmetric", "geometric", "crystalline"], "gradient"),
    "I never skip the proof. Every conclusion earns its place."
  );

  const parentB = makeClaw(
    "claw-002",
    "Bolt",
    "The Reckless Prototyper",
    [spontaneous, curious, optimistic],
    [prototyping, ideation, speedCoding],
    makeVisual("#F59E0B", "#EF4444", ["organic", "tentacle", "spiral"], "wave"),
    "Ship first, ask questions while it's already running."
  );

  return { parentA, parentB };
}

export function createSharedParentPair() {
  const { parentA, parentB } = createParentPair();
  const sharedTrait = parentA.soul.traits[0];
  const sharedSkill = parentA.skills.badges[1];

  return {
    parentA,
    parentB: {
      ...parentB,
      soul: {
        traits: [sharedTrait, ...parentB.soul.traits.slice(1)],
      },
      skills: {
        badges: [sharedSkill, ...parentB.skills.badges.slice(1)],
      },
    },
    sharedTraitId: sharedTrait.id,
    sharedSkillId: sharedSkill.id,
  };
}
