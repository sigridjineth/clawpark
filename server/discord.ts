import type { MarketplaceServerConfig } from './config.ts';

const DISCORD_API = 'https://discord.com/api';

export interface DiscordUserResponse {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
}

export function createDiscordAuthUrl(config: MarketplaceServerConfig, state: string) {
  const url = new URL(`${DISCORD_API}/oauth2/authorize`);
  url.searchParams.set('client_id', config.discordClientId);
  url.searchParams.set('redirect_uri', config.discordRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeDiscordCode(config: MarketplaceServerConfig, code: string) {
  const body = new URLSearchParams({
    client_id: config.discordClientId,
    client_secret: config.discordClientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.discordRedirectUri,
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error('Discord token exchange failed.');
  }

  return (await response.json()) as { access_token: string };
}

export async function fetchDiscordUser(accessToken: string) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord profile.');
  }

  return (await response.json()) as DiscordUserResponse;
}
