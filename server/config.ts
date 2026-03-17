import { resolve } from 'node:path';
import { resolveSkillInstallRoot } from './skillInstaller.ts';

export interface MarketplaceServerConfig {
  host: string;
  port: number;
  publicOrigin: string;
  clientOrigin: string;
  sqlitePath: string;
  storageDir: string;
  maxUploadBytes: number;
  sessionSecret: string;
  discordClientId: string;
  discordClientSecret: string;
  discordRedirectUri: string;
  skillInstallRoot: string;
  serveDist: boolean;
  distDir: string;
}

function required(value: string | undefined, fallback = '') {
  return value?.trim() || fallback;
}

export function loadConfig(overrides: Partial<MarketplaceServerConfig> = {}): MarketplaceServerConfig {
  const cwd = process.cwd();
  const storageDir = overrides.storageDir ?? resolve(cwd, process.env.MARKETPLACE_STORAGE_DIR ?? 'marketplace-data');
  const publicOrigin = overrides.publicOrigin ?? required(process.env.MARKETPLACE_PUBLIC_ORIGIN, 'http://localhost:8787');
  const openClawWorkspace = resolveSkillInstallRoot(
    process.env.MARKETPLACE_OPENCLAW_WORKSPACE ?? process.env.OPENCLAW_WORKSPACE ?? cwd,
    cwd,
  );
  const skillInstallRoot = resolveSkillInstallRoot(
    overrides.skillInstallRoot ??
      process.env.MARKETPLACE_SKILL_INSTALL_DIR ??
      process.env.OPENCLAW_SKILLS_DIR ??
      resolve(openClawWorkspace, 'skills'),
    cwd,
  );

  return {
    host: overrides.host ?? process.env.MARKETPLACE_HOST ?? '0.0.0.0',
    port: overrides.port ?? Number(process.env.MARKETPLACE_PORT ?? 8787),
    publicOrigin,
    clientOrigin: overrides.clientOrigin ?? required(process.env.MARKETPLACE_CLIENT_ORIGIN, 'http://localhost:5173'),
    sqlitePath: overrides.sqlitePath ?? resolve(storageDir, process.env.MARKETPLACE_DB_NAME ?? 'clawpark.sqlite'),
    storageDir,
    maxUploadBytes: overrides.maxUploadBytes ?? Number(process.env.MARKETPLACE_MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
    sessionSecret: overrides.sessionSecret ?? required(process.env.MARKETPLACE_SESSION_SECRET, 'dev-session-secret-change-me'),
    discordClientId: overrides.discordClientId ?? required(process.env.DISCORD_CLIENT_ID),
    discordClientSecret: overrides.discordClientSecret ?? required(process.env.DISCORD_CLIENT_SECRET),
    discordRedirectUri:
      overrides.discordRedirectUri ?? required(process.env.DISCORD_REDIRECT_URI, `${publicOrigin}/api/auth/discord/callback`),
    skillInstallRoot,
    serveDist: overrides.serveDist ?? process.env.MARKETPLACE_SERVE_DIST !== '0',
    distDir: overrides.distDir ?? resolve(cwd, 'dist'),
  };
}

export function isDiscordAuthConfigured(config: MarketplaceServerConfig) {
  return Boolean(config.discordClientId && config.discordClientSecret && config.discordRedirectUri);
}
