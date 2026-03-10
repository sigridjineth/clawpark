import type { SkillBadge, SoulTrait } from "../types/claw";

export function buildFallbackIntro(
  traits: SoulTrait[],
  skills: SkillBadge[],
): string {
  const leadTrait = traits[0]?.label ?? "직감";
  const supportTrait = traits[1]?.label ?? "질서";
  const leadSkill = skills[0]?.label ?? "실험";

  return `나는 ${leadTrait}으로 움직이고 ${supportTrait}으로 균형을 잡는다. 결국 모든 건 ${leadSkill}으로 증명한다.`;
}
