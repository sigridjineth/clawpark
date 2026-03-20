import { motion } from 'framer-motion';
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
    <div
      className="rounded-[10px] border border-white/10 px-4 py-3"
      style={{ background: 'var(--openclaw-glass)' }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--openclaw-muted)]">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-white">{value}</div>
    </div>
  );
}

function inferSuggestedActionScreen(action: SuggestedAction): Screen | null {
  switch (action.action) {
    case 'import_openclaw':
    case 'import_more':
      return 'import';
    case 'claim_specimens':
      return 'nursery';
    case 'breed':
      return 'nursery';
    case 'save_children':
      return null;
    default:
      if (action.endpoint.includes('/imports/openclaw')) return 'import';
      if (action.endpoint.includes('/specimens/:id/claim')) return 'nursery';
      if (action.endpoint.includes('/breeding/runs/:id/save')) return 'lineage';
      if (action.endpoint.includes('/breeding/runs')) return 'nursery';
      return null;
  }
}

function actionIcon(screen: Screen | null) {
  switch (screen) {
    case 'import':
      return <Inbox className="h-5 w-5" />;
    case 'nursery':
      return <Package className="h-5 w-5" />;
    case 'breedLab':
      return <Dna className="h-5 w-5" />;
    case 'exchange':
      return <Users className="h-5 w-5" />;
    default:
      return <Zap className="h-5 w-5" />;
  }
}

function actionCta(action: SuggestedAction, screen: Screen | null) {
  if (screen === 'import') return 'Open import';
  if (screen === 'nursery') return 'Open nursery';
  if (screen === 'lineage') return 'Open lineage';
  return `${action.method} ${action.endpoint}`;
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function Home({ homePayload, loading, onNavigate }: HomeProps) {
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="jp-card p-5">
          <div className="h-4 w-24 animate-pulse rounded-md bg-white/10" />
          <div className="mt-3 h-12 w-64 animate-pulse rounded-md bg-white/10" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-white/10" />
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

  const defaultActions: Array<{
    label: string;
    description: string;
    screen: Screen;
    icon: React.ReactNode;
    cta: string;
  }> = [
    {
      label: 'Import',
      description: 'Upload a .zip workspace exported from OpenClaw to add a specimen to your nursery.',
      screen: 'import',
      icon: <Inbox className="h-5 w-5" />,
      cta: 'Import specimens',
    },
    {
      label: 'Nursery',
      description: 'Browse your collection and select two specimens to send to the Lab.',
      screen: 'nursery',
      icon: <Package className="h-5 w-5" />,
      cta: 'Browse collection',
    },
    {
      label: 'Lab',
      description: 'Combine two selected specimens into a new child with inherited traits.',
      screen: 'breedLab',
      icon: <Dna className="h-5 w-5" />,
      cta: 'Enter lab',
    },
  ];

  return (
    <motion.section
      className="space-y-4"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Hero card */}
      <motion.div variants={fadeUp} className="jp-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="jp-label">Control room</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] leading-[0.95] text-white">
              ClawPark
            </h2>
            <p className="mt-2 max-w-2xl font-mono text-sm text-[var(--openclaw-muted)]">
              Buy, sell, and synthesize OpenClaw agents in a living ecosystem of intelligence.
            </p>
          </div>
          {homePayload?.connected_identity && (
            <div
              className="rounded-[10px] border border-white/10 px-4 py-3 text-sm"
              style={{ background: 'var(--openclaw-glass)' }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--openclaw-muted)]">
                Discord
              </div>
              <div className="mt-1 font-mono font-semibold text-white">
                {homePayload.connected_identity.discordHandle ?? homePayload.connected_identity.discordUserId}
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        {homePayload && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        )}
      </motion.div>

      {/* What to do next */}
      {homePayload?.what_to_do_next && (
        <motion.div variants={fadeUp} className="jp-card flex items-center gap-4 p-5">
          <Zap className="h-5 w-5 shrink-0 text-white/60" />
          <p className="flex-1 font-mono text-sm text-[var(--openclaw-muted)]">
            {homePayload.what_to_do_next}
          </p>
        </motion.div>
      )}

      {/* Suggested actions from server */}
      {homePayload && homePayload.suggested_actions.length > 0 && (
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...homePayload.suggested_actions]
            .sort((a, b) => a.priority - b.priority)
            .map((action) => {
              const targetScreen = inferSuggestedActionScreen(action);
              const cta = actionCta(action, targetScreen);

              return (
                <button
                  key={`${action.action}-${action.endpoint}`}
                  type="button"
                  disabled={!targetScreen}
                  onClick={() => targetScreen && onNavigate(targetScreen)}
                  className="group flex flex-col gap-4 rounded-[10px] border border-white/10 p-5 text-left transition-colors hover:border-white/25"
                  style={{ background: 'var(--openclaw-glass)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/50">{actionIcon(targetScreen)}</span>
                    <span className="font-display text-[24px] leading-6 text-white">
                      {action.label}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">
                    {action.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2 font-mono text-xs text-[var(--openclaw-muted)] transition-colors group-hover:text-white">
                    {cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
        </motion.div>
      )}

      {/* Default actions when no server data */}
      {!homePayload && (
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
          {defaultActions.map((item) => (
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
              <p className="font-mono text-[10px] leading-4 text-[var(--openclaw-muted)]">
                {item.description}
              </p>
              <div className="mt-auto flex items-center gap-2 font-mono text-xs text-[var(--openclaw-muted)] transition-colors group-hover:text-white">
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </motion.section>
  );
}
