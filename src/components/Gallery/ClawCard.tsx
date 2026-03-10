import { Download } from 'lucide-react';
import { getClawIdentity } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { DEMO_PARENT_IDS } from '../../utils/demoMode';
import { ClawAvatar } from '../shared/ClawAvatar';

interface ClawCardProps {
  claw: Claw;
  selected: boolean;
  onSelect: () => void;
  onExport: () => void;
  demoMode: boolean;
}

export function ClawCard({ claw, selected, onSelect, onExport, demoMode }: ClawCardProps) {
  const isDemoHighlight = demoMode && DEMO_PARENT_IDS.includes(claw.id as (typeof DEMO_PARENT_IDS)[number]);
  const identity = getClawIdentity(claw);

  return (
    <div
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-lg border p-4 transition ${
        selected
          ? 'border-amber/50 bg-jungle-800 shadow-amber'
          : 'border-jungle-700/60 bg-jungle-900 hover:border-jungle-600'
      }`}
    >
      {/* Main clickable area */}
      <button type="button" onClick={onSelect} className="flex flex-col gap-3 text-left" aria-label={claw.name}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-2xl leading-none text-bone">{claw.name}</div>
            <div className="mt-1 text-xs text-bone-muted">Gen-{claw.generation}</div>
          </div>
          {(selected || isDemoHighlight) && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              selected ? 'bg-amber text-jungle-950' : 'bg-jungle-700 text-amber-light'
            }`}>
              {selected ? 'Selected' : 'Demo'}
            </span>
          )}
        </div>

        <div className="flex justify-center py-1">
          <ClawAvatar visual={claw.visual} name={claw.name} size={120} />
        </div>

        <div className="text-sm font-semibold text-amber">{claw.archetype}</div>

        <div className="text-sm text-bone-dim">
          {identity.emoji} {identity.creature} — {identity.vibe}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {claw.soul.traits.map((trait) => (
            <span
              key={trait.id}
              className="rounded-full border border-jungle-600/40 bg-jungle-950 px-2 py-0.5 text-[10px] font-semibold text-bone-dim"
            >
              {trait.label}
            </span>
          ))}
          {claw.skills.badges.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full border border-fern/20 bg-jungle-950 px-2 py-0.5 text-[10px] font-semibold text-fern"
            >
              {skill.label}
            </span>
          ))}
        </div>
      </button>

      {/* Export button */}
      <button
        type="button"
        onClick={onExport}
        className="flex items-center justify-center gap-1.5 rounded-md border border-jungle-600/40 bg-jungle-950 py-1.5 text-[10px] font-bold uppercase tracking-wider text-bone-muted transition hover:border-fern/40 hover:text-bone-dim"
        aria-label={`Export ${claw.name}`}
      >
        <Download className="h-3 w-3" />
        Export
      </button>
    </div>
  );
}
