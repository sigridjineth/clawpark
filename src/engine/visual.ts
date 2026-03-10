import { averageHexColors, blendHexColors } from '../utils/color';
import type { ClawVisual, SkillBadge, SoulTrait } from '../types/claw';

const patterns: ClawVisual['pattern'][] = ['solid', 'gradient', 'stripe', 'dot', 'wave'];

export function generateVisual(
  visualA: ClawVisual,
  visualB: ClawVisual,
  childSoulTraits: SoulTrait[],
  childSkillBadges: SkillBadge[],
  hasMutation: boolean,
): ClawVisual {
  const patternIndex = childSkillBadges.reduce((sum, badge) => sum + badge.id.length, 0) % patterns.length;

  return {
    primaryColor: blendHexColors(visualA.primaryColor, visualB.primaryColor, 0.5),
    secondaryColor: averageHexColors(childSoulTraits.map((trait) => trait.color)),
    shapeModifiers: childSoulTraits.map((trait) => trait.visualSymbol.shapeModifier),
    pattern: patterns[patternIndex],
    glowIntensity: hasMutation ? 0.82 : 0.34,
  };
}
