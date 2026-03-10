import { motion } from 'framer-motion';
import type { BreedResult, Claw } from '../../types/claw';
import { TraitTag } from './TraitTag';

interface BlendPhaseProps {
  parents: [Claw, Claw];
  result: BreedResult;
}

export function BlendPhase({ parents, result }: BlendPhaseProps) {
  const parentTraits = [...parents[0].soul.traits, ...parents[1].soul.traits];
  const inheritedIds = new Set(result.child.soul.traits.map((trait) => trait.id));
  const mutationTraitId = result.mutatedTrait?.id;

  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-8 shadow-card">
      <div className="absolute inset-x-12 top-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(215,179,106,0.18),transparent_72%)] blur-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        {parentTraits.map((trait, index) => {
          const inherited = inheritedIds.has(trait.id);
          return (
            <motion.div
              key={`${trait.id}-${index}`}
              animate={inherited ? { scale: 1.05, opacity: 1, y: -10 } : { scale: 0.82, opacity: 0.32, y: 16 }}
              transition={{ duration: inherited ? 0.6 : 0.8, ease: inherited ? 'easeOut' : 'easeIn' }}
            >
              <TraitTag label={trait.label} color={trait.color} state={inherited ? 'inherited' : 'eliminated'} />
            </motion.div>
          );
        })}
      </div>
      {result.mutationOccurred && mutationTraitId && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [0, 1.5, 1], rotate: [-180, 0], x: [0, -4, 4, -2, 0] }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <TraitTag label={result.mutatedTrait?.label ?? 'Mutation'} color="#d7b36a" state="mutation" />
        </motion.div>
      )}
    </div>
  );
}
