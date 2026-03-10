import type { SkillBadge } from '../../types/claw';
import { IconGlyph } from './IconGlyph';

export function SkillPill({ badge }: { badge: SkillBadge }) {
  return (
    <span className="skill-pill" style={{ ['--skill-color' as string]: badge.color }}>
      <IconGlyph name={badge.icon as Parameters<typeof IconGlyph>[0]['name']} size={14} strokeWidth={2.2} />
      {badge.label}
    </span>
  );
}
