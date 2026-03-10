import { motion } from 'framer-motion';
import type { Claw } from '../../types/claw';
import { TraitTag } from './TraitTag';

interface MergePhaseProps {
  parents: [Claw, Claw];
}

export function MergePhase({ parents }: MergePhaseProps) {
  return (
    <div className="relative min-h-[20rem] overflow-hidden rounded-lg border border-jungle-700/60 bg-jungle-900 p-8">
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/10 blur-3xl" />
      {[0, 1].map((parentIndex) => {
        const parent = parents[parentIndex];
        const direction = parentIndex === 0 ? -1 : 1;

        return parent.soul.traits.map((trait, traitIndex) => (
          <motion.div
            key={`${parent.id}-${trait.id}`}
            initial={{ x: direction * 260, y: traitIndex * 42 - 30, opacity: 0.3 }}
            animate={{ x: direction * 28, y: traitIndex * 14, opacity: 0.95 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: traitIndex * 0.08 }}
            className={`absolute ${parentIndex === 0 ? 'left-8' : 'right-8'}`}
            style={{ top: `${28 + traitIndex * 18}%` }}
          >
            <TraitTag label={trait.label} color={trait.color} />
          </motion.div>
        ));
      })}
    </div>
  );
}
