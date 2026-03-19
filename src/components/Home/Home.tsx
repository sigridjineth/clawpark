import { ArrowRight, Dna, Inbox, Package, Users, Zap } from 'lucide-react';
import type { HomePayload, SuggestedAction } from '../../types/home';
import type { Screen } from '../../types/claw';

interface HomeProps {
  homePayload: HomePayload | null;
  loading: boolean;
  onNavigate: (screen: Screen) => void;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-white/10 px-4 py-3" style={{ background: 'var(--openclaw-glass)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--openclaw-muted)]">{label}</div>
      <div className="mt-2 font-display text-3xl text-white">{value}</div>
    </div>
  );
}

const ACTION_ICONS: Record<SuggestedAction['screen'], React.ReactNode> = {
  import: <Inbox className="h-5 w-5" />,
  nursery: <Package className="h-5 w-5" />,
  breedLab: <Dna className="h-5 w-5" />,
  exchange: <Users className="h-5 w-5" />,
};

export function Home({ homePayload, loading, onNavigate }: HomeProps) {
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="jp-card p-5">
          <div className="h-8 w-48 animate-pulse rounded-md bg-jungle-800" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-md bg-jungle-800" />
        </div>
      </section>
    );
  }

  const stats = homePayload
    ? [
        { label: 'Owned', value: homePayload.owned_claw_count },
        { label: 'Breedable pairs', value: homePayload.breedable_pairs },
        { label: 'Pending claims', value: homePayload.pending_claims },
        { label: 'Unsaved children', value: homePayload.unsaved_children },
      ]
    : [];

  return (
    <section className="space-y-4">
      {/* Header card */}
      <div className="jp-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="jp-label">Control room</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] leading-[0.95] text-white">ClawPark</h2>
            <p className="mt-2 max-w-2xl font-mono text-sm text-[var(--openclaw-muted)]">
              Breed, evolve, and trade your specimens.
            </p>
          </div>
          {homePayload?.connected_identity && (
            <div className="rounded-[10px] border border-white/10 px-4 py-3 text-sm" style={{ background: 'var(--openclaw-glass)' }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--openclaw-muted)]">Discord</div>
              <div className="mt-1 font-mono font-semibold text-white">
                {homePayload.connected_identity.discordHandle}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {homePayload && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {homePayload?.what_to_do_next && (
        <div className="jp-card flex items-center gap-4 p-5">
          <Zap className="h-5 w-5 shrink-0 text-white/60" />
          <p className="flex-1 font-mono text-sm text-[var(--openclaw-muted)]">{homePayload.what_to_do_next}</p>
        </div>
      )}

      {/* Suggested actions */}
      {homePayload && homePayload.suggested_actions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...homePayload.suggested_actions]
            .sort((a, b) => a.priority - b.priority)
            .map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.screen)}
                className="group flex flex-col gap-4 rounded-[10px] border border-white/10 p-5 text-left transition-colors hover:border-white/25"
                style={{ background: 'var(--openclaw-glass)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/50">{ACTION_ICONS[action.screen]}</span>
                  <span className="font-display text-[24px] leading-6 text-white">{action.label}</span>
                </div>
                <p className="font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">{action.description}</p>
                <div className="mt-auto flex items-center gap-2 font-mono text-xs text-[var(--openclaw-muted)] group-hover:text-white transition-colors">
                  {action.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Empty state when no server */}
      {!homePayload && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              { label: 'Import', description: 'Upload a ZIP to add specimens', screen: 'import' as Screen, icon: <Inbox className="h-5 w-5" /> },
              { label: 'Nursery', description: 'Browse and select your collection', screen: 'nursery' as Screen, icon: <Package className="h-5 w-5" /> },
              { label: 'Lab', description: 'Combine two specimens into a child', screen: 'breedLab' as Screen, icon: <Dna className="h-5 w-5" /> },
            ] as { label: string; description: string; screen: Screen; icon: React.ReactNode }[]
          ).map((item) => (
            <button
              key={item.screen}
              type="button"
              onClick={() => onNavigate(item.screen)}
              className="group flex flex-col gap-4 rounded-[10px] border border-white/10 p-5 text-left transition-colors hover:border-white/25"
              style={{ background: 'var(--openclaw-glass)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-white/50">{item.icon}</span>
                <span className="font-display text-[24px] leading-6 text-white">{item.label}</span>
              </div>
              <p className="font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">{item.description}</p>
              <div className="mt-auto flex items-center gap-2 font-mono text-xs text-[var(--openclaw-muted)] group-hover:text-white transition-colors">
                Enter
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
