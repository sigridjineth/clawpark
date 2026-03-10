import { motion } from 'framer-motion';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';

interface BirthPhaseProps {
  child: Claw;
}

export function BirthPhase({ child }: BirthPhaseProps) {
  return (
    <div className="flex min-h-[24rem] items-center justify-center rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-8 shadow-card">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.16, 1], opacity: 1 }}
        transition={{ type: 'spring', stiffness: 190, damping: 15 }}
        className="space-y-6 text-center"
      >
        <div className="mx-auto h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(215,179,106,0.2),rgba(120,184,167,0.12),transparent_72%)] blur-3xl" />
        <div className="-mt-36 flex justify-center">
          <ClawAvatar visual={child.visual} name={child.name} size={230} pulse />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#8aa07b]">New specimen incoming</div>
      </motion.div>
    </div>
  );
}
