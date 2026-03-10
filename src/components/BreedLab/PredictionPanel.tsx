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
    <div className="jp-card p-5">
      <div className="jp-label">Expected inheritance</div>

      <div className="mt-4 space-y-3">
        {prediction.traitPredictions.map((trait) => (
          <div key={trait.traitId}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-bone-dim">{trait.label}</span>
              <span className="font-bold text-amber">{Math.round(trait.probability * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-jungle-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fern to-amber"
                style={{ width: `${Math.round(trait.probability * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-jungle-700/40 pt-4">
        <div>
          <div className="jp-label">Mutation chance</div>
          <div className="mt-1 font-display text-3xl text-danger">{Math.round(prediction.mutationChance * 100)}%</div>
        </div>
        <div>
          <div className="jp-label">Predicted archetype</div>
          <div className="mt-1 text-sm font-semibold text-bone">{prediction.predictedArchetype}</div>
        </div>
      </div>

      {forecastCards.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-jungle-700/40 pt-4">
          {forecastCards.map((card) => (
            <div key={card.label} className="rounded-md border border-jungle-700/40 bg-jungle-950 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{card.label}</div>
              <div className="mt-1 text-xs text-bone-dim">{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
