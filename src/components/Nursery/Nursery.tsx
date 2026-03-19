import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Filter } from 'lucide-react';
import type { Claw } from '../../types/claw';
import type { BreedState, OwnershipState, Specimen } from '../../types/specimen';
import { ClawAvatar } from '../shared/ClawAvatar';

interface NurseryProps {
  claws: Claw[];
  specimens: Specimen[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onContinue: () => void;
}

const OWNERSHIP_FILTERS: Array<{ value: OwnershipState | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'imported', label: 'Imported' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'archived', label: 'Archived' },
  { value: 'published', label: 'Published' },
];

const BREED_FILTERS: Array<{ value: BreedState | 'all'; label: string }> = [
  { value: 'all', label: 'Any' },
  { value: 'ready', label: 'Ready' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'ineligible', label: 'Ineligible' },
];

// Trait chip colors — matches AgentListingCard traitVisualMap
const SOUL_TRAIT_CHIP = 'border-[rgba(171,114,255,0.65)] bg-[rgba(171,114,255,0.19)]';
const SKILL_CHIP = 'border-[rgba(61,151,235,0.65)] bg-[rgba(61,151,235,0.19)]';
const TOOL_CHIP = 'border-[rgba(235,194,61,0.65)] bg-[rgba(235,194,61,0.19)]';

const BREED_STATE_CHIP: Record<BreedState, string> = {
  ready: 'border-[rgba(61,235,186,0.65)] bg-[rgba(61,235,186,0.19)]',
  cooldown: 'border-[rgba(235,194,61,0.65)] bg-[rgba(235,194,61,0.19)]',
  ineligible: 'border-[rgba(235,61,61,0.65)] bg-[rgba(235,61,61,0.19)]',
};

interface SpecimenCardProps {
  claw: Claw;
  specimen?: Specimen;
  selected: boolean;
  onSelect: () => void;
}

function SpecimenCard({ claw, specimen, selected, onSelect }: SpecimenCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`relative flex flex-col gap-0 overflow-hidden rounded-[10px] border p-4 transition-colors ${
        selected ? 'border-white/35' : 'border-white/10 hover:border-white/25'
      }`}
      style={{ background: 'var(--openclaw-glass)' }}
    >
      {/* Image area — matches AgentListingCard h-[129px] */}
      <div className="relative mb-3 flex h-[129px] w-full shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_65%)]">
        <ClawAvatar visual={claw.visual} name={claw.name} size={100} />
        {selected && (
          <span className="absolute right-2 top-2 rounded-[6px] border border-white/30 bg-white/15 px-2 py-0.5 font-mono text-[10px] text-white">
            Selected
          </span>
        )}
      </div>

      {/* Content — matches AgentListingCard h-[154px] flex flex-col justify-between */}
      <div className="flex flex-col justify-between" style={{ minHeight: 154 }}>
        {/* Name + generation — matches font-display text-[24px] */}
        <div className="overflow-hidden">
          <h2 className="font-display text-[24px] leading-6 text-white">{claw.name}</h2>
          <div className="mt-1 font-mono text-[10px] leading-4 text-white">
            <p>Gen-{claw.generation}</p>
            {claw.identity && (
              <p className="max-w-[180px]">
                {claw.identity.emoji} {claw.identity.creature}
              </p>
            )}
            {!claw.identity && claw.intro && (
              <p className="max-w-[180px] truncate">{claw.intro}</p>
            )}
          </div>
        </div>

        {/* Trait chips — matches AgentListingCard trait chip pattern */}
        <div className="flex h-[82px] flex-wrap content-start items-start gap-x-[10px] gap-y-[8px] overflow-hidden">
          {claw.soul.traits.map((trait) => (
            <span
              key={trait.id}
              className={`inline-flex h-5 items-center rounded-[8px] border px-2 font-mono text-[12px] leading-4 text-[var(--openclaw-cta)] ${SOUL_TRAIT_CHIP}`}
            >
              {trait.label}
            </span>
          ))}
          {claw.skills.badges.map((skill) => (
            <span
              key={skill.id}
              className={`inline-flex h-5 items-center rounded-[8px] border px-2 font-mono text-[12px] leading-4 text-[var(--openclaw-cta)] ${SKILL_CHIP}`}
            >
              {skill.label}
            </span>
          ))}
          {claw.tools?.loadout.map((tool) => (
            <span
              key={tool.id}
              className={`inline-flex h-5 items-center rounded-[8px] border px-2 font-mono text-[12px] leading-4 text-[var(--openclaw-cta)] ${TOOL_CHIP}`}
            >
              {tool.label}
            </span>
          ))}
          {specimen && (
            <span
              className={`inline-flex h-5 items-center rounded-[8px] border px-2 font-mono text-[12px] leading-4 text-[var(--openclaw-cta)] ${
                BREED_STATE_CHIP[specimen.breedState] ?? 'border-white/20 bg-white/10'
              }`}
            >
              {specimen.breedState}
            </span>
          )}
        </div>
      </div>

      {/* Select button */}
      <button
        type="button"
        onClick={onSelect}
        className={`mt-3 w-full rounded-[8px] border py-1.5 font-mono text-[11px] transition-colors ${
          selected
            ? 'border-white/30 bg-white/15 text-white'
            : 'border-white/10 text-[var(--openclaw-muted)] hover:border-white/25 hover:text-white'
        }`}
        style={selected ? undefined : { background: 'transparent' }}
      >
        {selected ? 'Deselect' : 'Select for breeding'}
      </button>
    </motion.div>
  );
}

export function Nursery({ claws, specimens, selectedIds, onSelect, onContinue }: NurseryProps) {
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipState | 'all'>('all');
  const [breedFilter, setBreedFilter] = useState<BreedState | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const specimenMap = useMemo(
    () => new Map(specimens.map((s) => [s.claw.id, s])),
    [specimens],
  );

  const filtered = useMemo(() => {
    return claws.filter((claw) => {
      const specimen = specimenMap.get(claw.id);
      if (ownershipFilter !== 'all' && specimen?.ownershipState !== ownershipFilter) return false;
      if (breedFilter !== 'all' && specimen?.breedState !== breedFilter) return false;
      return true;
    });
  }, [claws, specimenMap, ownershipFilter, breedFilter]);

  const filterButtonClass = (active: boolean) =>
    `rounded-[8px] border px-3 py-1 font-mono text-[11px] transition-colors ${
      active
        ? 'border-white/30 bg-white/15 text-white'
        : 'border-white/10 text-[var(--openclaw-muted)] hover:border-white/25 hover:text-white'
    }`;

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="jp-pill">{selectedIds.length}/2 selected</span>
          <span className="jp-pill">{filtered.length} specimens</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="jp-btn-secondary"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            type="button"
            disabled={selectedIds.length !== 2}
            onClick={onContinue}
            className="jp-btn"
          >
            Enter Lab
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="jp-card flex flex-wrap gap-6 p-4"
        >
          <div>
            <div className="jp-label mb-2">Ownership</div>
            <div className="flex flex-wrap gap-2">
              {OWNERSHIP_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOwnershipFilter(value)}
                  className={filterButtonClass(ownershipFilter === value)}
                  style={ownershipFilter === value ? undefined : { background: 'transparent' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="jp-label mb-2">Breed state</div>
            <div className="flex flex-wrap gap-2">
              {BREED_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBreedFilter(value)}
                  className={filterButtonClass(breedFilter === value)}
                  style={breedFilter === value ? undefined : { background: 'transparent' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="jp-card p-8 text-center font-mono text-[var(--openclaw-muted)]">
          No specimens match your filters.
        </div>
      )}

      {/* Grid — matches AgentListingCard grid pattern */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((claw) => (
          <SpecimenCard
            key={claw.id}
            claw={claw}
            specimen={specimenMap.get(claw.id)}
            selected={selectedIds.includes(claw.id)}
            onSelect={() => onSelect(claw.id)}
          />
        ))}
      </div>
    </section>
  );
}
