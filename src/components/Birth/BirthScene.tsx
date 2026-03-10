import { useEffect } from 'react';
import type { BreedResult, BirthPhase, Claw } from '../../types/claw';
import { BirthPhase as BirthBody } from './BirthPhase';
import { BlendPhase } from './BlendPhase';
import { MergePhase } from './MergePhase';
import { RevealPhase } from './RevealPhase';

const PHASE_SEQUENCE: Array<{ phase: BirthPhase; duration: number }> = [
  { phase: 'merge', duration: 1500 },
  { phase: 'blend', duration: 2000 },
  { phase: 'birth', duration: 1000 },
  { phase: 'reveal_name', duration: 500 },
  { phase: 'reveal_archetype', duration: 800 },
  { phase: 'reveal_traits', duration: 1200 },
  { phase: 'reveal_intro', duration: 500 },
  { phase: 'complete', duration: 0 },
];

interface BirthSceneProps {
  parents: [Claw, Claw];
  result: BreedResult;
  phase: BirthPhase;
  onPhaseChange: (phase: BirthPhase) => void;
  onViewLineage: () => void;
  onBreedAgain: () => void;
  onBackToGallery: () => void;
}

export function BirthScene({ parents, result, phase, onPhaseChange, onViewLineage, onBreedAgain, onBackToGallery }: BirthSceneProps) {
  useEffect(() => {
    const timers: number[] = [];
    let elapsed = 0;

    PHASE_SEQUENCE.forEach(({ phase: nextPhase, duration }) => {
      const timeout = window.setTimeout(() => onPhaseChange(nextPhase), elapsed);
      timers.push(timeout);
      elapsed += duration;
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onPhaseChange, result.child.id]);

  const activeIndex = PHASE_SEQUENCE.findIndex((entry) => entry.phase === phase);

  return (
    <section className="space-y-4">
      {/* Minimal phase progress bar */}
      <div className="flex items-center gap-1">
        {PHASE_SEQUENCE.map((entry, index) => {
          const active = entry.phase === phase;
          const passed = activeIndex > index;
          return (
            <div
              key={entry.phase}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                active
                  ? 'bg-amber'
                  : passed
                    ? 'bg-fern/60'
                    : 'bg-jungle-800'
              }`}
            />
          );
        })}
      </div>

      {phase === 'merge' && <MergePhase parents={parents} />}
      {phase === 'blend' && <BlendPhase parents={parents} result={result} />}
      {phase === 'birth' && <BirthBody child={result.child} />}
      {phase === 'reveal_name' && <RevealPhase child={result.child} parents={parents} result={result} phase={phase} />}
      {(phase === 'reveal_archetype' || phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
        <RevealPhase child={result.child} parents={parents} result={result} phase={phase} />
      )}

      {phase === 'complete' && (
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onViewLineage} className="jp-btn-secondary">View Lineage</button>
          <button type="button" onClick={onBreedAgain} className="jp-btn">Breed Again</button>
          <button type="button" onClick={onBackToGallery} className="jp-btn-secondary">Gallery</button>
        </div>
      )}
    </section>
  );
}
