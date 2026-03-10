import { getClawIdentity } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';

interface ParentSlotProps {
  claw: Claw;
  label: string;
}

export function ParentSlot({ claw, label }: ParentSlotProps) {
  const identity = getClawIdentity(claw);

  return (
    <div className="jp-card p-4">
      <div className="jp-label">{label}</div>
      <div className="mt-3 flex items-center gap-3">
        <ClawAvatar visual={claw.visual} name={claw.name} size={80} />
        <div className="min-w-0">
          <div className="font-display text-2xl text-bone">{claw.name}</div>
          <div className="text-sm text-amber">{claw.archetype}</div>
          <div className="mt-1 text-xs text-bone-muted">{identity.emoji} {identity.creature}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {claw.soul.traits.map((trait) => (
          <span key={trait.id} className="rounded-full border border-jungle-600/40 bg-jungle-950 px-2 py-0.5 text-[10px] text-bone-dim">
            {trait.label}
          </span>
        ))}
        {claw.skills.badges.map((skill) => (
          <span key={skill.id} className="rounded-full border border-fern/20 bg-jungle-950 px-2 py-0.5 text-[10px] text-fern">
            {skill.label}
          </span>
        ))}
      </div>
    </div>
  );
}
