import type {
  ClawBundle,
  MarketplaceDraft,
  MarketplaceListing,
  MarketplaceSession,
} from '../types/marketplace';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // ignore non-json error bodies
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getMarketplaceSession(): Promise<MarketplaceSession> {
  const response = await fetch('/api/auth/session', { credentials: 'include' });
  return parseJson<MarketplaceSession>(response);
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  const response = await fetch('/api/marketplace/listings', { credentials: 'include' });
  return parseJson<MarketplaceListing[]>(response);
}

export async function createMarketplaceDraft(bundle: File): Promise<MarketplaceDraft> {
  const body = new FormData();
  body.append('bundle', bundle);

  const response = await fetch('/api/marketplace/drafts', {
    method: 'POST',
    body,
    credentials: 'include',
  });

  return parseJson<MarketplaceDraft>(response);
}

export async function updateMarketplaceDraft(
  draftId: string,
  payload: {
    title?: string;
    summary?: string;
    toolsVisibility?: 'full' | 'summary';
    coverStyle?: 'avatar' | 'containment-card';
  },
): Promise<MarketplaceDraft> {
  const response = await fetch(`/api/marketplace/drafts/${draftId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseJson<MarketplaceDraft>(response);
}

export async function publishMarketplaceDraft(draftId: string): Promise<MarketplaceListing> {
  const response = await fetch(`/api/marketplace/drafts/${draftId}/publish`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseJson<MarketplaceListing>(response);
}

export async function downloadMarketplaceBundle(slug: string): Promise<ClawBundle> {
  const response = await fetch(`/api/marketplace/listings/${slug}/bundle`, {
    credentials: 'include',
  });

  return parseJson<ClawBundle>(response);
}

export function getDiscordAuthUrl() {
  return '/api/auth/discord/start';
}
