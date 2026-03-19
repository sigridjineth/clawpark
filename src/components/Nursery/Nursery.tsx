import { useMemo, useState } from 'react';
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

const BREED_STATE_STYLES: Record<BreedState, string> = {
  ready: 'border-[rgba(61,235,186,0.5)] bg-[rgba(61,235,186,0.15)]',
  cooldown: 'border-[rgba(235,194,61,0.5)] bg-[rgba(235,194,61,0.15)]',
  ineligible: 'border-[rgba(235,61,61,0.5)] bg-[rgba(235,61,61,0.15)]',
};

const PROVENANCE_STYLES: Record<string, string> = {
  genesis: 'border-amber/30 text-amber',
  bred: 'border-fern/30 text-fern',
  imported: 'border-jungle-600/40 text-bone-dim',
  claimed: 'border-jungle-600/40 text-bone-dim',
  purchased: 'border-fern/20 text-fern',
};

interface SpecimenCardProps {
  claw: Claw;
  specimen?: Specimen;
  selected: boolean;
  onSelect: () => void;
}

function SpecimenCard({ claw, specimen, selected, onSelect }: SpecimenCardProps) {
  return (
    <div
      className={`group relative flex flex-col gap-0 overflow-hidden rounded-[10px] border p-4 transition-colors ${
        selected
          ? 'border-white/35'
          : 'border-white/10 hover:border-white/25'
      }`}
      style={{ background: 'var(--openclaw-glass)' }}
    >
      {/* Avatar area — matches 129px image area in AgentListingCard */}
      <div className="relative h-[110px] w-full shrink-0 overflow-hidden rounded-[8px] mb-3 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_65%)]">
        <ClawAvatar visual={claw.visual} name={claw.name} size={90} />
        {selected && (
          <span className="absolute right-2 top-2 rounded-[6px] border border-white/30 bg-white/15 px-2 py-0.5 font-mono text-[10px] text-white">
            Selected
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex flex-col justify-between" style={{ minHeight: 130 }}>
        <div>
          <div className="font-display text-[22px] leading-6 text-white">{claw.name}</div>
          <div className="mt-1 font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">
            Gen-{claw.generation}
            {specimen && ` · ${specimen.provenance.badge}`}
          </div>
          {claw.identity && (
            <div className="mt-1 font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">
              {claw.identity.emoji} {claw.identity.creature}
            </div>
          )}
        </div>

        {/* Trait badges — matches AgentListingCard trait chips */}
        <div className="mt-2 flex flex-wrap gap-x-[10px] gap-y-[8px] overflow-hidden" style={{ maxHeight: 70 }}>
          {claw.soul.traits.map((trait) => (
            <span
              key={trait.id}
              className="inline-flex h-5 items-center gap-1 rounded-[8px] border border-white/20 bg-white/10 px-2 font-mono text-[11px] leading-4 text-[var(--openclaw-cta)]"
            >
              {trait.label}
            </span>
          ))}
          {claw.skills.badges.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex h-5 items-center gap-1 rounded-[8px] border border-[rgba(61,151,235,0.5)] bg-[rgba(61,151,235,0.15)] px-2 font-mono text-[11px] leading-4 text-[var(--openclaw-cta)]"
            >
              {skill.label}
            </span>
          ))}
          {claw.tools?.loadout.map((tool) => (
            <span
              key={tool.id}
              className="inline-flex h-5 items-center gap-1 rounded-[8px] border border-[rgba(235,194,61,0.5)] bg-[rgba(235,194,61,0.15)] px-2 font-mono text-[11px] leading-4 text-[var(--openclaw-cta)]"
            >
              {tool.label}
            </span>
          ))}
          {specimen && (
            <span
              className={`inline-flex h-5 items-center rounded-[8px] border px-2 font-mono text-[11px] leading-4 text-[var(--openclaw-cta)] ${
                BREED_STATE_STYLES[specimen.breedState] ?? 'border-white/20 bg-white/10'
              }`}
            >
              {specimen.breedState}
            </span>
          )}
        </div>
      </div>

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
    </div>
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

  return (
    <section className="space-y-4">
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

      {showFilters && (
        <div className="jp-card flex flex-wrap gap-6 p-4">
          <div>
            <div className="jp-label mb-2">Ownership</div>
            <div className="flex flex-wrap gap-2">
              {OWNERSHIP_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOwnershipFilter(value)}
                  className={`rounded-[8px] border px-3 py-1 font-mono text-[11px] transition-colors ${
                    ownershipFilter === value
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/10 text-[var(--openclaw-muted)] hover:border-white/25 hover:text-white'
                  }`}
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
                  className={`rounded-[8px] border px-3 py-1 font-mono text-[11px] transition-colors ${
                    breedFilter === value
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/10 text-[var(--openclaw-muted)] hover:border-white/25 hover:text-white'
                  }`}
                  style={breedFilter === value ? undefined : { background: 'transparent' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="jp-card p-8 text-center font-mono text-[var(--openclaw-muted)]">
          No specimens match your filters.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
