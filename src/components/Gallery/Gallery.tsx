import { ArrowRight, Sparkles } from 'lucide-react';
import type { Claw } from '../../types/claw';
import { DEMO_PARENT_IDS } from '../../utils/demoMode';
import { ClawCard } from './ClawCard';

interface GalleryProps {
  claws: Claw[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onContinue: () => void;
  demoMode: boolean;
}

export function Gallery({ claws, selectedIds, onSelect, onContinue, demoMode }: GalleryProps) {
  const showcasePairSelected = demoMode && DEMO_PARENT_IDS.every((id) => selectedIds.includes(id));

  return (
    <section className="space-y-5">
      <div className="shell-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">Claw catalogue</div>
            <h1 className="mt-2 font-display text-4xl leading-none text-ink md:text-6xl">ClawPark</h1>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#334239] bg-[#172019] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[#d6dfbf]">
              <Sparkles className="h-4 w-4 text-butter" />
              {selectedIds.length}/2
            </div>
            {demoMode && (
              <div className={`rounded-full border px-4 py-3 text-[11px] uppercase tracking-[0.24em] ${
                showcasePairSelected
                  ? 'border-[#4f7267] bg-[#1a2824] text-[#dfe8c9]'
                  : 'border-[#8b6734] bg-[#251b10] text-[#f0d48b]'
              }`}>
                {showcasePairSelected ? 'Showcase ready' : 'Demo mode'}
              </div>
            )}
            <button
              type="button"
              disabled={selectedIds.length !== 2}
              onClick={onContinue}
              className="inline-flex w-full items-center justify-center gap-3 rounded-[0.55rem] border border-[#8c6731] bg-[#d7b36a] px-5 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#141811] transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_0.18rem_0_0_#8c6731] disabled:cursor-not-allowed disabled:border-[#334239] disabled:bg-[#172019] disabled:text-[#657160] sm:w-auto"
            >
              Enter Breed Lab
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {claws.map((claw) => (
          <ClawCard
            key={claw.id}
            claw={claw}
            selected={selectedIds.includes(claw.id)}
            onSelect={() => onSelect(claw.id)}
            demoMode={demoMode}
          />
        ))}
      </div>
    </section>
  );
}
