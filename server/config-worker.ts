import type { MarketplaceServerConfig } from './config.ts';

export interface Env {
  DB: import('./db-worker.ts').D1Database;
  MARKETPLACE_HOST?: string;
  MARKETPLACE_PORT?: string;
  MARKETPLACE_PUBLIC_ORIGIN?: string;
  MARKETPLACE_CLIENT_ORIGIN?: string;
  MARKETPLACE_STORAGE_DIR?: string;
  MARKETPLACE_DB_NAME?: string;
  MARKETPLACE_MAX_UPLOAD_BYTES?: string;
  MARKETPLACE_SESSION_SECRET?: string;
  MARKETPLACE_OPENCLAW_WORKSPACE?: string;
  OPENCLAW_WORKSPACE?: string;
  MARKETPLACE_SKILL_INSTALL_DIR?: string;
  OPENCLAW_SKILLS_DIR?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  MARKETPLACE_SERVE_DIST?: string;
}

function required(value: string | undefined, fallback = '') {
  return value?.trim() || fallback;
}

export function loadWorkerConfig(env: Env): MarketplaceServerConfig {
  // For Workers, we don’t use cwd-based paths; storageDir, sqlitePath, and distDir
  // should be treated as logical identifiers or used only in non-Worker contexts.
  const storageDir = required(env.MARKETPLACE_STORAGE_DIR, 'marketplace-data');
  const publicOrigin = required(env.MARKETPLACE_PUBLIC_ORIGIN, 'https://example.workers.dev');

  return {
    host: required(env.MARKETPLACE_HOST, '0.0.0.0'),
    port: Number(env.MARKETPLACE_PORT ?? 8787),
    publicOrigin,
    clientOrigin: required(env.MARKETPLACE_CLIENT_ORIGIN, publicOrigin),
    sqlitePath: required(env.MARKETPLACE_DB_NAME, 'clawpark.sqlite'),
    storageDir,
    maxUploadBytes: Number(env.MARKETPLACE_MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
    sessionSecret: required(env.MARKETPLACE_SESSION_SECRET, 'dev-session-secret-change-me'),
    discordClientId: required(env.DISCORD_CLIENT_ID),
    discordClientSecret: required(env.DISCORD_CLIENT_SECRET),
    discordRedirectUri: required(env.DISCORD_REDIRECT_URI, `${publicOrigin}/api/auth/discord/callback`),
    skillInstallRoot: required(env.MARKETPLACE_SKILL_INSTALL_DIR ?? env.OPENCLAW_SKILLS_DIR, 'skills'),
    serveDist: env.MARKETPLACE_SERVE_DIST !== '0',
    distDir: 'dist',
  };
}

