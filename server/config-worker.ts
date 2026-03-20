export interface Env {
  DB?: import('./db-worker.ts').D1Database;
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

export interface WorkerServerConfig {
  publicOrigin: string;
  clientOrigin: string;
  sessionSecret: string;
  discordClientId: string;
  discordClientSecret: string;
  discordRedirectUri: string;
}

function required(value: string | undefined, fallback = '') {
  return value?.trim() || fallback;
}

export function loadWorkerConfig(env: Env): WorkerServerConfig {
  const publicOrigin = required(env.MARKETPLACE_PUBLIC_ORIGIN, 'https://example.workers.dev');

  return {
    publicOrigin,
    clientOrigin: required(env.MARKETPLACE_CLIENT_ORIGIN, publicOrigin),
    sessionSecret: required(env.MARKETPLACE_SESSION_SECRET, 'dev-session-secret-change-me'),
    discordClientId: required(env.DISCORD_CLIENT_ID),
    discordClientSecret: required(env.DISCORD_CLIENT_SECRET),
    discordRedirectUri: required(env.DISCORD_REDIRECT_URI, `${publicOrigin}/api/auth/discord/callback`),
  };
}
