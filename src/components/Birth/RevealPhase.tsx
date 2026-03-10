import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getClawIdentity, getClawTools } from '../../engine/openclaw';
import type { BreedResult, BirthPhase, Claw, InheritanceRecord } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';
import { TraitBadge } from '../shared/TraitBadge';

interface RevealPhaseProps {
  child: Claw;
  parents: [Claw, Claw];
  result: BreedResult;
  phase: BirthPhase;
}

function kindLabel(record: InheritanceRecord | undefined) {
  if (!record?.kind) {
    return 'Inherited';
  }
  return record.kind.charAt(0).toUpperCase() + record.kind.slice(1);
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
      return 'Unknown';
  }
}

export function RevealPhase({ child, parents, result, phase }: RevealPhaseProps) {
  const [typedArchetype, setTypedArchetype] = useState(phase === 'reveal_archetype' ? '' : child.archetype);
  const identity = getClawIdentity(child);
  const tools = getClawTools(child).loadout;

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
  const skillCards = useMemo(
    () => child.skills.badges.map((skill) => ({ skill, record: result.inheritanceMap.find((record) => record.traitId === skill.id) })),
    [child.skills.badges, result.inheritanceMap],
  );
  const identityRecords = useMemo(() => result.inheritanceMap.filter((record) => record.type === 'identity'), [result.inheritanceMap]);

  return (
    <div className="rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.94),rgba(11,18,15,0.98))] p-8 shadow-card">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-[1rem] border border-[#334239] bg-[#111813] p-4 shadow-glow">
            <ClawAvatar visual={child.visual} name={child.name} size={236} pulse={phase !== 'complete'} />
          </div>
          <div className="rounded-full border border-[#334239] bg-[#172019] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">
            Generation {child.generation}
          </div>
        </div>

        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#8aa07b]">Newest arrival</div>
            <h2 className="mt-3 font-display text-6xl leading-none text-ink">{child.name}</h2>
          </motion.div>

          {(phase === 'reveal_archetype' || phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
            <div className="font-display text-4xl leading-tight text-[#d7b36a]">{typedArchetype}</div>
          )}

          {(phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[0.9rem] border border-[#334239] bg-[#172019] p-4 shadow-glow">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Identity</div>
                <div className="mt-2 text-lg font-semibold text-ink">{identity.emoji} {identity.creature}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#7f8e71]">{identity.vibe}</div>
                <div className="mt-3 text-sm leading-6 text-[#d6dfbf]">{identity.directive}</div>
                <div className="mt-4 space-y-2">
                  {identityRecords.map((record) => (
                    <div key={record.traitId} className="rounded-[0.8rem] bg-[#101612] px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8aa07b]">
                        <span>{kindLabel(record)}</span>
                        <span>•</span>
                        <span>{originLabel(record, parents)}</span>
                      </div>
                      <div className="mt-1 text-sm text-ink">{record.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[0.9rem] border border-[#334239] bg-[#172019] p-4 shadow-glow">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Tools</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <TraitBadge key={tool.id} item={tool} kind="tool" subtle />
                  ))}
                </div>
              </div>
            </div>
          )}

          {(phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
            <div className="grid gap-3 md:grid-cols-3">
              {traitCards.map(({ trait, record }, index) => (
                <motion.div key={trait.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.16, duration: 0.3 }} className="rounded-[0.9rem] border border-[#334239] bg-[#172019] p-4 shadow-glow">
                  <div className="text-sm font-semibold text-ink">{trait.label}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8aa07b]">
                    <span>{originLabel(record, parents)}</span>
                    <span>•</span>
                    <span>{kindLabel(record)}</span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#d6dfbf]">{record?.detail ?? 'Inherited into the final SOUL matrix.'}</div>
                </motion.div>
              ))}
            </div>
          )}

          {(phase === 'reveal_traits' || phase === 'reveal_intro' || phase === 'complete') && (
            <div className="rounded-[0.9rem] border border-[#334239] bg-[#172019] p-4 shadow-glow">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">Skills</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {skillCards.map(({ skill, record }, index) => (
                  <motion.div key={skill.id} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.12, duration: 0.28 }} className="rounded-[0.8rem] border border-[#3b4332] bg-[#101612] p-4">
                    <div className="text-sm font-semibold text-ink">{skill.label}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8aa07b]">
                      <span>{originLabel(record, parents)}</span>
                      <span>•</span>
                      <span>{kindLabel(record)}</span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#d6dfbf]">{record?.detail ?? 'Skill routine survived incubation and reached the final loadout.'}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(phase === 'reveal_intro' || phase === 'complete') && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.45 }} className="max-w-2xl rounded-[1rem] border border-[#334239] bg-[#172019] px-5 py-4 text-lg leading-8 text-[#d6dfbf] shadow-glow">
              “{child.intro}”
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
