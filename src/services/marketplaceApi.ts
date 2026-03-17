import type {
  ClawBundle,
  MarketplaceDraft,
  MarketplaceSkillInstallResult,
  MarketplaceListing,
  MarketplaceSession,
} from '../types/marketplace';
import type {
  MockBreedRunRequest,
  MockBreedRunResponse,
  MockBreedingStatus,
  MockInventoryResponse,
  MockListingMutationRequest,
  MockListingPriceUpdateRequest,
  MockListingSnapshot,
  MockMeResponse,
  MockMeSummaryResponse,
  MockProvenanceResponse,
  MockPurchaseResponse,
  MockSpecimenDetailResponse,
  MockTransactionEvent,
  MockTransactionsResponse,
} from '../types/mockCommerce';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

type ErrorPayload = { error?: string; [key: string]: unknown };

export class MarketplaceApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: ErrorPayload,
  ) {
    super(message);
    this.name = 'MarketplaceApiError';
  }
}

async function parseError(response: Response) {
  let message = `Request failed (${response.status})`;
  let payload: ErrorPayload | undefined;

  try {
    payload = (await response.json()) as ErrorPayload;
    if (payload?.error) {
      message = payload.error;
    }
  } catch {
    // ignore non-json error bodies
  }

  return { message, payload };
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const { message, payload } = await parseError(response);
    throw new MarketplaceApiError(message, response.status, payload);
  }

  return (await response.json()) as T;
}

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function getMarketplaceSession(): Promise<MarketplaceSession> {
  const response = await fetch('/api/auth/session', { credentials: 'include' });
  return parseJson<MarketplaceSession>(response);
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  const response = await fetch('/api/marketplace/listings', { credentials: 'include' });
  return parseJson<MarketplaceListing[]>(response);
}

export async function getMockMarketplaceListings(): Promise<MockListingSnapshot[]> {
  const response = await fetch('/api/marketplace/mock-listings', { credentials: 'include' });
  return parseJson<MockListingSnapshot[]>(response);
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

export async function downloadMarketplaceArtifact(slug: string, fallbackFilename: string) {
  const response = await fetch(`/api/marketplace/listings/${slug}/bundle`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const { message, payload } = await parseError(response);
    throw new MarketplaceApiError(message, response.status, payload);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFilename),
    contentType: response.headers.get('Content-Type') ?? 'application/octet-stream',
  };
}

export async function installMarketplaceSkill(slug: string, overwrite = false) {
  const response = await fetch(`/api/marketplace/listings/${slug}/install`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ overwrite }),
  });

  return parseJson<MarketplaceSkillInstallResult>(response);
}

export async function getMockMe(): Promise<MockMeResponse> {
  const response = await fetch('/api/me', { credentials: 'include' });
  return parseJson<MockMeResponse>(response);
}

export async function getMockMeSummary(): Promise<MockMeSummaryResponse> {
  const response = await fetch('/api/me/summary', { credentials: 'include' });
  return parseJson<MockMeSummaryResponse>(response);
}

export async function getMyClaws(filters?: {
  inventoryState?: string;
  breedable?: boolean;
  sourceKind?: string;
}): Promise<MockInventoryResponse> {
  const params = new URLSearchParams();
  if (filters?.inventoryState) params.set('inventoryState', filters.inventoryState);
  if (typeof filters?.breedable === 'boolean') params.set('breedable', String(filters.breedable));
  if (filters?.sourceKind) params.set('sourceKind', filters.sourceKind);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/my/claws${suffix}`, { credentials: 'include' });
  return parseJson<MockInventoryResponse>(response);
}

export async function getMyClawDetail(specimenId: string): Promise<MockSpecimenDetailResponse> {
  const response = await fetch(`/api/my/claws/${encodeURIComponent(specimenId)}`, { credentials: 'include' });
  return parseJson<MockSpecimenDetailResponse>(response);
}

export async function getMyClawActivity(specimenId: string): Promise<MockTransactionEvent[]> {
  const response = await fetch(`/api/my/claws/${encodeURIComponent(specimenId)}/activity`, { credentials: 'include' });
  return parseJson<MockTransactionEvent[]>(response);
}

export async function getMyTransactions(): Promise<MockTransactionsResponse> {
  const response = await fetch('/api/my/transactions', { credentials: 'include' });
  return parseJson<MockTransactionsResponse>(response);
}

export async function createMockMarketplaceListing(payload: MockListingMutationRequest): Promise<MockListingSnapshot> {
  const response = await fetch('/api/marketplace/listings', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parseJson<MockListingSnapshot>(response);
}

export async function updateMockMarketplaceListingPrice(
  slug: string,
  payload: MockListingPriceUpdateRequest,
): Promise<MockListingSnapshot> {
  const response = await fetch(`/api/marketplace/listings/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parseJson<MockListingSnapshot>(response);
}

export async function delistMockMarketplaceListing(slug: string): Promise<MockListingSnapshot> {
  const response = await fetch(`/api/marketplace/listings/${encodeURIComponent(slug)}/delist`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson<MockListingSnapshot>(response);
}

export async function relistMockMarketplaceListing(slug: string): Promise<MockListingSnapshot> {
  const response = await fetch(`/api/marketplace/listings/${encodeURIComponent(slug)}/relist`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson<MockListingSnapshot>(response);
}

export async function purchaseMockMarketplaceListing(slug: string): Promise<MockPurchaseResponse> {
  const response = await fetch(`/api/marketplace/listings/${encodeURIComponent(slug)}/purchase`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson<MockPurchaseResponse>(response);
}

export async function getBreedingEligibility(specimenId: string): Promise<MockBreedingStatus & { specimenId: string }> {
  const response = await fetch(`/api/breeding/eligibility?specimenId=${encodeURIComponent(specimenId)}`, {
    credentials: 'include',
  });
  return parseJson<MockBreedingStatus & { specimenId: string }>(response);
}

export async function runMockBreed(payload: MockBreedRunRequest): Promise<MockBreedRunResponse> {
  const response = await fetch('/api/breeding/runs', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parseJson<MockBreedRunResponse>(response);
}

export async function getClawProvenance(clawId: string): Promise<MockProvenanceResponse> {
  const response = await fetch(`/api/claws/${encodeURIComponent(clawId)}/provenance`, { credentials: 'include' });
  return parseJson<MockProvenanceResponse>(response);
}

export function getDiscordAuthUrl() {
  return '/api/auth/discord/start';
}
