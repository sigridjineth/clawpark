import { motion } from 'framer-motion';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';

interface BirthPhaseProps {
  child: Claw;
}

export function BirthPhase({ child }: BirthPhaseProps) {
  return (
    <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-jungle-700/60 bg-jungle-900 p-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.16, 1], opacity: 1 }}
        transition={{ type: 'spring', stiffness: 190, damping: 15 }}
        className="space-y-4 text-center"
      >
        <div className="mx-auto h-40 w-40 rounded-full bg-amber/10 blur-3xl" />
        <div className="-mt-32 flex justify-center">
          <ClawAvatar visual={child.visual} name={child.name} size={200} pulse />
        </div>
        <div className="jp-label">New specimen</div>
      </motion.div>
    </div>
  );
}
