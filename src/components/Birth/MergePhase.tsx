import { motion } from 'framer-motion';
import type { Claw } from '../../types/claw';
import { TraitTag } from './TraitTag';

interface MergePhaseProps {
  parents: [Claw, Claw];
}

export function MergePhase({ parents }: MergePhaseProps) {
  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-8 shadow-card">
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(215,179,106,0.16),rgba(120,184,167,0.10),transparent_74%)] blur-2xl" />
      {[0, 1].map((parentIndex) => {
        const parent = parents[parentIndex];
        const direction = parentIndex === 0 ? -1 : 1;

        return parent.soul.traits.map((trait, traitIndex) => (
          <motion.div
            key={`${parent.id}-${trait.id}`}
            initial={{ x: direction * 260, y: traitIndex * 42 - 30, opacity: 0.35 }}
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
