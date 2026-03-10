import { ArrowRight, ShoppingBag } from 'lucide-react';
import type { Claw } from '../../types/claw';
import { exportClaw } from '../../utils/clawIO';
import { DEMO_PARENT_IDS } from '../../utils/demoMode';
import { ClawCard } from './ClawCard';

interface GalleryProps {
  claws: Claw[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onContinue: () => void;
  onMarketplace: () => void;
  demoMode: boolean;
}

export function Gallery({ claws, selectedIds, onSelect, onContinue, onMarketplace, demoMode }: GalleryProps) {
  const showcasePairSelected = demoMode && DEMO_PARENT_IDS.every((id) => selectedIds.includes(id));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="jp-pill">{selectedIds.length}/2 selected</span>
          {demoMode && (
            <span className={`jp-pill ${showcasePairSelected ? 'border-fern/40 text-fern' : 'border-amber/30 text-amber'}`}>
              {showcasePairSelected ? 'Ready' : 'Demo'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMarketplace} className="jp-btn-secondary">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </button>
          <button
            type="button"
            disabled={selectedIds.length !== 2}
            onClick={onContinue}
            className="jp-btn"
          >
            Enter Breed Lab
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {claws.map((claw) => (
          <ClawCard
            key={claw.id}
            claw={claw}
            selected={selectedIds.includes(claw.id)}
            onSelect={() => onSelect(claw.id)}
            onExport={() => exportClaw(claw)}
            demoMode={demoMode}
          />
        ))}
      </div>
    </section>
  );
}
