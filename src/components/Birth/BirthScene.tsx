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

function labelForPhase(phase: BirthPhase) {
  return phase.replace('reveal_', 'reveal ');
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
    <section className="space-y-5">
      <div className="shell-card p-4 md:p-5">
        <div className="flex flex-wrap gap-3">
          {PHASE_SEQUENCE.map((entry, index) => {
            const active = entry.phase === phase;
            const passed = activeIndex > index;
            return (
              <div
                key={entry.phase}
                className={`rounded-[0.55rem] border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition md:px-4 md:py-3 ${
                  active
                    ? 'border-[#8c6731] bg-[#d7b36a] text-[#141811] shadow-candy'
                    : passed
                      ? 'border-[#334239] bg-[#172019] text-[#dfe8c9] shadow-glow'
                      : 'border-[#253028] bg-[#101612] text-[#6c7a63]'
                }`}
              >
                0{index + 1} · {labelForPhase(entry.phase)}
              </div>
            );
          })}
        </div>
      </div>

      {phase === 'merge' && <MergePhase parents={parents} />}
      {phase === 'blend' && <BlendPhase parents={parents} result={result} />}
      {phase === 'birth' && <BirthBody child={result.child} />}
      {phase === 'reveal_name' && <RevealPhase child={result.child} parents={parents} result={result} phase={phase} />}
      {(phase === 'reveal_archetype' || phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
        <RevealPhase child={result.child} parents={parents} result={result} phase={phase} />
      )}

      {phase === 'complete' && (
        <div className="shell-card flex flex-wrap justify-center gap-3 p-4 md:p-5">
          <button type="button" onClick={onViewLineage} className="candy-button-secondary w-full sm:w-auto">View Lineage</button>
          <button type="button" onClick={onBreedAgain} className="candy-button w-full sm:w-auto">Breed Again</button>
          <button type="button" onClick={onBackToGallery} className="candy-button-secondary w-full sm:w-auto">Back to Gallery</button>
        </div>
      )}
    </section>
  );
}
