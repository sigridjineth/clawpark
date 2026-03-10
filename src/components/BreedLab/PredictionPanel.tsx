import type { BreedPrediction } from '../../types/claw';

interface PredictionPanelProps {
  prediction: BreedPrediction;
}

export function PredictionPanel({ prediction }: PredictionPanelProps) {
  const forecastCards = prediction.dimensionForecast
    ? [
        { label: 'Identity', value: prediction.dimensionForecast.identity },
        { label: 'Soul', value: prediction.dimensionForecast.soul },
        { label: 'Skills', value: prediction.dimensionForecast.skills },
        { label: 'Tools', value: prediction.dimensionForecast.tools },
      ]
    : [];

  return (
    <div className="rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-6 shadow-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">Expected inheritance</div>
      <div className="mt-2 text-sm leading-6 text-[#b8c49e]">Identity, Soul, Skills, and Tools fuse here before the hatch.</div>
      <div className="mt-4 space-y-4">
        {prediction.traitPredictions.map((trait) => (
          <div key={trait.traitId} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm text-[#d6dfbf]">
              <span>{trait.label}</span>
              <span className="text-[#8aa07b]">{Math.round(trait.probability * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#111813]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#78b8a7] to-[#d7b36a]" style={{ width: `${Math.round(trait.probability * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 border-t border-[#253028] pt-5 md:grid-cols-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">Mutation chance</div>
          <div className="mt-2 font-display text-4xl text-ink">{Math.round(prediction.mutationChance * 100)}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-[#8aa07b]">Predicted archetype</div>
          <div className="mt-2 text-lg font-semibold leading-tight text-[#d6dfbf]">{prediction.predictedArchetype}</div>
        </div>
      </div>
      {forecastCards.length > 0 && (
        <div className="mt-6 grid gap-3 border-t border-[#253028] pt-5 md:grid-cols-2">
          {forecastCards.map((card) => (
            <div key={card.label} className="rounded-[0.9rem] border border-[#3b4332] bg-[#171d16] px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8aa07b]">{card.label}</div>
              <div className="mt-2 text-sm leading-6 text-[#d6dfbf]">{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
