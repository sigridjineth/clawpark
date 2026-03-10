import { getClawIdentity, getClawTools } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';
import { TraitBadge } from '../shared/TraitBadge';

interface ParentSlotProps {
  claw: Claw;
  label: string;
}

export function ParentSlot({ claw, label }: ParentSlotProps) {
  const identity = getClawIdentity(claw);
  const tools = getClawTools(claw).loadout;

  return (
    <div className="rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-4 shadow-card md:p-5">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">{label}</div>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <ClawAvatar visual={claw.visual} name={claw.name} size={108} />
        <div>
          <div className="font-display text-2xl text-ink md:text-3xl">{claw.name}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#b8c49e]">{claw.archetype}</div>
          <div className="mt-3 rounded-[0.9rem] border border-[#3b4332] bg-[#171d16] px-3 py-2 text-sm text-[#d6dfbf]">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Identity</div>
            <div className="mt-1 font-semibold text-ink">{identity.emoji} {identity.creature}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#7f8e71]">{identity.vibe}</div>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Soul</div>
          <div className="flex flex-wrap gap-2">
            {claw.soul.traits.map((trait) => (
              <TraitBadge key={trait.id} item={trait} kind="soul" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Skills</div>
          <div className="flex flex-wrap gap-2">
            {claw.skills.badges.map((badge) => (
              <TraitBadge key={badge.id} item={badge} kind="skill" subtle />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Tools</div>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <TraitBadge key={tool.id} item={tool} kind="tool" subtle />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
