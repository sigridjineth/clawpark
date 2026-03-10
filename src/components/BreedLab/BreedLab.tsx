import { ArrowLeft } from 'lucide-react';
import type { Claw } from '../../types/claw';
import { BreedButton } from './BreedButton';
import { ParentSlot } from './ParentSlot';
import { PredictionPanel } from './PredictionPanel';

interface BreedLabProps {
  parents: [Claw, Claw];
  preferredTraitId: string | null;
  onPreferredTrait: (traitId: string | null) => void;
  onBack: () => void;
  onBreed: () => void;
  prediction: NonNullable<import('../../types/claw').BreedPrediction>;
}

export function BreedLab({ parents, preferredTraitId, onPreferredTrait, onBack, onBreed, prediction }: BreedLabProps) {
  const traitPool = Array.from(
    new Map([...parents[0].soul.traits, ...parents[1].soul.traits].map((trait) => [trait.id, trait])).values(),
  );
  const dimensionCards = [
    { label: 'Identity', detail: 'Role and directive fuse in containment.' },
    { label: 'Soul', detail: 'Primary lane for pre-hatch steering.' },
    { label: 'Skills', detail: 'Operational routines merge and survive.' },
    { label: 'Tools', detail: 'Field kit resolves from the final genome.' },
  ];

  return (
    <section className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#8aa07b] transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <ParentSlot claw={parents[0]} label="Parent A" />
          <ParentSlot claw={parents[1]} label="Parent B" />
        </div>
        <PredictionPanel prediction={prediction} />
      </div>

      <div className="rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-4 shadow-card md:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dimensionCards.map((dimension) => (
            <div key={dimension.label} className="rounded-[0.9rem] border border-[#3b4332] bg-[#171d16] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">{dimension.label}</div>
              <div className="mt-2 text-sm leading-6 text-[#d6dfbf]">{dimension.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">Trait bias</div>
            <div className="mt-2 text-sm leading-6 text-[#b8c49e]">Favor one SOUL strand before the rest of the OpenClaw genome fuses.</div>
          </div>
          <button
            type="button"
            onClick={() => onPreferredTrait(null)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
              preferredTraitId === null
                ? 'border-[#8c6731] bg-[#d7b36a] text-[#141811]'
                : 'border-[#334239] bg-[#172019] text-[#dfe8c9] hover:border-[#536556]'
            }`}
          >
            Balanced genome
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {traitPool.map((trait) => (
            <button
              type="button"
              key={trait.id}
              onClick={() => onPreferredTrait(trait.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
                preferredTraitId === trait.id
                  ? 'bg-[#d7b36a] text-[#141811]'
                  : 'bg-[#172019] text-[#dfe8c9] hover:border-[#536556]'
              }`}
              style={{ borderColor: `${trait.color}55` }}
            >
              SOUL · {trait.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <BreedButton onClick={onBreed} />
      </div>
    </section>
  );
}
