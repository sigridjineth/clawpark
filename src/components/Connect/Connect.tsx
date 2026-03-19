import { motion } from 'framer-motion';
import { ExternalLink, LogIn, ShieldCheck, Unlink, User } from 'lucide-react';
import type { ConnectedIdentity } from '../../types/home';

interface ConnectProps {
  connectedIdentity: ConnectedIdentity | null;
  discordAuthUrl?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export function Connect({ connectedIdentity, discordAuthUrl }: ConnectProps) {
  const authUrl = discordAuthUrl ?? '/auth/discord';

  return (
    <motion.section
      className="space-y-4"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header card */}
      <motion.div variants={fadeUp} className="jp-card p-5">
        <div className="jp-label">Identity verification</div>
        <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] leading-[0.95] text-white">
          Discord Connect
        </h2>
        <p className="mt-2 font-mono text-sm text-[var(--openclaw-muted)]">
          Link your Discord account to enable verified provenance, marketplace publishing, and
          cross-device specimen sync.
        </p>
      </motion.div>

      {connectedIdentity ? (
        /* Connected state */
        <motion.div variants={fadeUp} className="jp-card space-y-4 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
              {connectedIdentity.avatarUrl ? (
                <img
                  src={connectedIdentity.avatarUrl}
                  alt={connectedIdentity.discordHandle}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-[var(--openclaw-muted)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[22px] leading-6 text-white">
                  {connectedIdentity.discordHandle}
                </span>
                <ShieldCheck className="h-4 w-4 text-[rgba(61,235,186,0.8)]" />
              </div>
              <div className="mt-0.5 font-mono text-xs text-[var(--openclaw-muted)]">
                ID: {connectedIdentity.discordUserId}
              </div>
              <div className="mt-1 font-mono text-xs text-[var(--openclaw-muted)]">
                Verified{' '}
                {new Date(connectedIdentity.verifiedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div
            className="rounded-[8px] border border-[rgba(61,235,186,0.25)] px-4 py-3 font-mono text-sm text-[var(--openclaw-text)]"
            style={{ background: 'rgba(61,235,186,0.07)' }}
          >
            <strong>Linked mode active.</strong> Your specimens carry a verified Discord provenance
            badge. Marketplace listings will be attributed to your handle.
          </div>

          <button type="button" className="jp-btn-secondary">
            <Unlink className="h-4 w-4" />
            Unlink Discord
          </button>
        </motion.div>
      ) : (
        /* Not connected state */
        <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
          {/* Sign in card */}
          <div className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Not connected</div>
              <h3 className="mt-2 font-display text-[28px] leading-6 text-white">
                Sign in with Discord
              </h3>
            </div>
            <p className="font-mono text-sm text-[var(--openclaw-muted)]">
              Connect your Discord account to unlock verified provenance and marketplace features.
            </p>
            <a href={authUrl} className="jp-btn inline-flex">
              <LogIn className="h-4 w-4" />
              Sign in with Discord
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>

          {/* Local-only explanation */}
          <div className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Local-only mode</div>
              <h3 className="mt-2 font-display text-[28px] leading-6 text-white">
                No account needed
              </h3>
            </div>
            <ul className="space-y-3 font-mono text-sm text-[var(--openclaw-muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(61,235,186,0.6)]" />
                Import and breed specimens without any account.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(61,235,186,0.6)]" />
                Your collection lives in memory — no cloud sync.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                Provenance badges will show as unverified.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                Marketplace publishing requires Discord sign-in.
              </li>
            </ul>
            <div
              className="rounded-[8px] border border-white/10 px-3 py-2 font-mono text-xs text-[var(--openclaw-muted)]"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              You can continue without linking. Connect later to retroactively verify your
              specimens.
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
