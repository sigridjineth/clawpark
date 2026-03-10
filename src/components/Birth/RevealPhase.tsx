import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getClawIdentity,
  summarizeSkills,
  summarizeSoul,
  summarizeTools,
} from '../../engine/openclaw';
import type { BreedResult, BirthPhase, Claw, InheritanceRecord } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';

interface RevealPhaseProps {
  child: Claw;
  parents: [Claw, Claw];
  result: BreedResult;
  phase: BirthPhase;
}

function originLabel(record: InheritanceRecord | undefined, parents: [Claw, Claw]) {
  switch (record?.origin) {
    case 'parentA':
      return parents[0].name;
    case 'parentB':
      return parents[1].name;
    case 'both':
      return `${parents[0].name} + ${parents[1].name}`;
    case 'mutation':
      return 'Mutation ✦';
    default:
      return '';
  }
}

export function RevealPhase({ child, parents, result, phase }: RevealPhaseProps) {
  const [typedArchetype, setTypedArchetype] = useState(phase === 'reveal_archetype' ? '' : child.archetype);
  const identity = getClawIdentity(child);
  const soulSummary = summarizeSoul(child);
  const skillSummary = summarizeSkills(child);
  const toolSummary = summarizeTools(child);

  useEffect(() => {
    if (phase !== 'reveal_archetype') {
      setTypedArchetype(child.archetype);
      return;
    }

    let frame = 0;
    const interval = window.setInterval(() => {
      frame += 1;
      setTypedArchetype(child.archetype.slice(0, frame));
      if (frame >= child.archetype.length) {
        window.clearInterval(interval);
      }
    }, 45);

    return () => window.clearInterval(interval);
  }, [child.archetype, phase]);

  const traitCards = useMemo(
    () => child.soul.traits.map((trait) => ({ trait, record: result.inheritanceMap.find((record) => record.traitId === trait.id) })),
    [child.soul.traits, result.inheritanceMap],
  );
  const doctrine = child.lineage?.doctrine;
  const breedingConversation = child.lineage?.breedingConversation ?? [];
  const showTraits = phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete';
  const showIntro = phase === 'reveal_intro' || phase === 'complete';

  return (
    <div className="rounded-lg border border-jungle-700/60 bg-jungle-900 p-6">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <ClawAvatar visual={child.visual} name={child.name} size={200} pulse={phase !== 'complete'} />
          <span className="jp-pill">Gen {child.generation}</span>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="font-display text-5xl text-bone">{child.name}</h2>
          </motion.div>

          {(phase === 'reveal_archetype' || showTraits || showIntro) && (
            <div className="font-display text-3xl text-amber">{typedArchetype}</div>
          )}

          {showTraits && (
            <>
              {/* Identity */}
              <div className="rounded-md border border-jungle-700/40 bg-jungle-950 p-3">
                <div className="text-sm font-semibold text-bone">{identity.emoji} {identity.creature}</div>
                <div className="text-xs text-bone-muted">{identity.vibe}</div>
              </div>

              {/* Trait cards */}
              <div className="grid gap-2 sm:grid-cols-3">
                {traitCards.map(({ trait, record }, index) => (
                  <motion.div
                    key={trait.id}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.12, duration: 0.25 }}
                    className={`rounded-md border p-3 ${
                      record?.origin === 'mutation'
                        ? 'border-danger/40 bg-danger/10'
                        : 'border-jungle-700/40 bg-jungle-950'
                    }`}
                  >
                    <div className="text-sm font-semibold text-bone">{trait.label}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-fern">
                      {originLabel(record, parents)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Genome summary */}
              <div className="space-y-1 text-sm text-bone-dim">
                <p><span className="font-semibold text-bone">Soul.</span> {soulSummary}</p>
                <p><span className="font-semibold text-bone">Skills.</span> {skillSummary}</p>
                <p><span className="font-semibold text-bone">Tools.</span> {toolSummary}</p>
              </div>
            </>
          )}

          {showTraits && doctrine && (
            <div className="rounded-md border border-amber/30 bg-amber/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber">{doctrine.title}</div>
              <div className="mt-1 text-sm font-semibold text-bone">{doctrine.creed}</div>
              <div className="mt-1 text-sm text-bone-dim">{doctrine.summary}</div>
            </div>
          )}

          {showIntro && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-md border border-amber/20 bg-jungle-950 px-4 py-3 text-lg italic text-bone-dim"
            >
              "{child.intro}"
            </motion.p>
          )}

          {showIntro && breedingConversation.length > 0 && (
            <div className="space-y-2">
              <div className="jp-label">Breeding transcript</div>
              {breedingConversation.map((turn) => (
                <div key={turn.id} className="rounded-md border border-jungle-700/40 bg-jungle-950 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{turn.title}</div>
                  <div className="mt-1 text-sm text-bone-dim">{turn.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
