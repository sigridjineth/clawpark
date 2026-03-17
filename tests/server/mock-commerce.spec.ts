// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMarketplaceServer } from '../../server/index.ts';

describe('mock commerce API', () => {
  let tempRoot: string;
  let serverHandle: ReturnType<typeof createMarketplaceServer>;
  let baseUrl: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-commerce-'));
    serverHandle = createMarketplaceServer({
      publicOrigin: 'http://127.0.0.1:8787',
      clientOrigin: 'http://127.0.0.1:5173',
      sqlitePath: join(tempRoot, 'marketplace.sqlite'),
      storageDir: join(tempRoot, 'storage'),
      sessionSecret: 'test-secret',
      serveDist: false,
    });
    await new Promise<void>((resolve) => serverHandle.server.listen(0, '127.0.0.1', resolve));
    const address = serverHandle.server.address();
    if (!address || typeof address === 'string') throw new Error('Unexpected server address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => serverHandle.server.close(() => resolve()));
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('returns session summaries and seeded inventory', async () => {
    const meResponse = await fetch(`${baseUrl}/api/me`);
    expect(meResponse.status).toBe(200);
    const me = (await meResponse.json()) as { portfolio: { ownedCount: number; listedCount: number } };
    expect(me.portfolio.ownedCount).toBeGreaterThan(0);

    const clawsResponse = await fetch(`${baseUrl}/api/my/claws`);
    expect(clawsResponse.status).toBe(200);
    const claws = (await clawsResponse.json()) as { items: Array<{ specimenId: string }>; counts: { owned: number } };
    expect(claws.items.length).toBeGreaterThan(0);
    expect(claws.counts.owned).toBeGreaterThan(0);
  });

  it('creates a listing for an owned specimen and reflects it in detail view', async () => {
    const createResponse = await fetch(`${baseUrl}/api/marketplace/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specimenId: 'spec_ridgeback_002',
        price: { amount: 185 },
      }),
    });
    expect(createResponse.status).toBe(201);
    const listing = (await createResponse.json()) as { saleState: string; slug: string };
    expect(listing.saleState).toBe('published');

    const detailResponse = await fetch(`${baseUrl}/api/my/claws/spec_ridgeback_002`);
    expect(detailResponse.status).toBe(200);
    const detail = (await detailResponse.json()) as {
      specimen: { inventoryState: string };
      listing: { slug: string | null } | null;
    };
    expect(detail.specimen.inventoryState).toBe('listed');
    expect(detail.listing?.slug).toBe(listing.slug);
  });

  it('completes a purchase for a listing owned by another user and updates inventory', async () => {
    const purchaseResponse = await fetch(`${baseUrl}/api/marketplace/listings/listing_solstice_201/purchase`, { method: 'POST' });
    expect(purchaseResponse.status).toBe(200);
    const purchase = (await purchaseResponse.json()) as { listing: { saleState: string }; transfer: { toOwnerUserId: string } };
    expect(purchase.listing.saleState).toBe('sold');
    expect(purchase.transfer.toOwnerUserId).toBe('user_sigrid');

    const clawsResponse = await fetch(`${baseUrl}/api/my/claws`);
    const claws = (await clawsResponse.json()) as { items: Array<{ specimenId: string }> };
    expect(claws.items.some((item) => item.specimenId === 'spec_solstice_201')).toBe(true);
  });

  it('runs a breeding flow and records the newborn plus transactions', async () => {
    const breedResponse = await fetch(`${baseUrl}/api/breeding/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentASpecimenId: 'spec_ridgeback_002',
        parentBSpecimenId: 'spec_orchid_003',
        breedPrompt: 'Northglass',
      }),
    });
    expect(breedResponse.status).toBe(200);
    const breed = (await breedResponse.json()) as { child: { specimenId: string }; parentCooldowns: Array<{ specimenId: string }> };
    expect(breed.child.specimenId).toMatch(/spec_child_/);
    expect(breed.parentCooldowns).toHaveLength(2);

    const transactionsResponse = await fetch(`${baseUrl}/api/my/transactions`);
    const transactions = (await transactionsResponse.json()) as { items: Array<{ eventType: string }> };
    expect(transactions.items.some((event) => event.eventType === 'specimen_born')).toBe(true);
  });
});
