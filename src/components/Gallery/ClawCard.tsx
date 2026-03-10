import { Sparkles } from 'lucide-react';
import { getClawIdentity, getClawTools } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { DEMO_PARENT_IDS } from '../../utils/demoMode';
import { ClawAvatar } from '../shared/ClawAvatar';
import { TraitBadge } from '../shared/TraitBadge';

interface ClawCardProps {
  claw: Claw;
  selected: boolean;
  onSelect: () => void;
  demoMode: boolean;
}

export function ClawCard({ claw, selected, onSelect, demoMode }: ClawCardProps) {
  const isDemoHighlight = demoMode && DEMO_PARENT_IDS.includes(claw.id as (typeof DEMO_PARENT_IDS)[number]);
  const identity = getClawIdentity(claw);
  const tools = getClawTools(claw).loadout;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-[1rem] border p-4 text-left transition md:gap-4 md:p-5 ${
        selected
          ? 'border-[#8b6734] bg-[linear-gradient(180deg,rgba(38,51,43,0.96),rgba(18,27,22,0.96))] shadow-candy'
          : 'border-[#2e3a32] bg-[linear-gradient(180deg,rgba(20,29,24,0.92),rgba(11,18,15,0.96))] shadow-card hover:-translate-y-1 hover:border-[#536556]'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,179,106,0.12),transparent_55%)] opacity-90" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[1.35rem] leading-none text-ink md:text-3xl">{claw.name}</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#8aa07b]">Gen-{claw.generation}</div>
        </div>
        {(selected || isDemoHighlight) && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8b6734] bg-[#251b10] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#f0d48b]">
            <Sparkles className="h-3.5 w-3.5" />
            {selected ? 'Selected' : 'Demo'}
          </div>
        )}
      </div>

      <div className="relative flex justify-center py-0.5">
        <ClawAvatar visual={claw.visual} name={claw.name} size={132} />
      </div>

      <div className="relative text-xs font-semibold uppercase tracking-[0.16em] text-[#b8c49e]">{claw.archetype}</div>
      <div className="relative rounded-[0.9rem] border border-[#3b4332] bg-[#171d16] px-3 py-3 text-xs text-[#d6dfbf]">
        <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#8aa07b]">Identity</div>
        <div className="mt-2 text-sm font-semibold text-ink">{identity.emoji} {identity.creature}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#7f8e71]">{identity.vibe}</div>
      </div>

      <div className="relative flex flex-wrap gap-2">
        {claw.soul.traits.map((trait) => (
          <TraitBadge key={trait.id} item={trait} kind="soul" />
        ))}
      </div>

      <div className="relative flex flex-wrap gap-2">
        {claw.skills.badges.map((badge) => (
          <TraitBadge key={badge.id} item={badge} kind="skill" subtle />
        ))}
      </div>

      <div className="relative flex flex-wrap gap-2">
        {tools.map((tool) => (
          <TraitBadge key={tool.id} item={tool} kind="tool" subtle />
        ))}
      </div>
    </button>
  );
}
