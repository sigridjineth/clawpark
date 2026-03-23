// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startScenarioServer, type ScenarioServerHandle } from './scenarioTestUtils.ts';

describe('Scenario 6 — mock portfolio/listing/buy/breed', () => {
  let handle: ScenarioServerHandle;

  beforeEach(async () => {
    handle = await startScenarioServer();
  });

  afterEach(async () => {
    await handle.close();
    handle.cleanup();
  });

  it('covers mock read/list/purchase/eligibility/provenance/breed flows', async () => {
    const meResponse = await fetch(`${handle.baseUrl}/api/me`);
    expect(meResponse.status).toBe(200);

    const clawsResponse = await fetch(`${handle.baseUrl}/api/my/claws`);
    expect(clawsResponse.status).toBe(200);

    const txResponse = await fetch(`${handle.baseUrl}/api/my/transactions`);
    expect(txResponse.status).toBe(200);

    const mockListingsResponse = await fetch(`${handle.baseUrl}/api/marketplace/mock-listings`);
    expect(mockListingsResponse.status).toBe(200);

    const createListing = await fetch(`${handle.baseUrl}/api/marketplace/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specimenId: 'spec_ridgeback_002',
        price: { amount: 185 },
      }),
    });
    expect(createListing.status).toBe(201);
    const created = (await createListing.json()) as { slug: string; saleState: string };
    expect(created.saleState).toBe('published');

    const patchListing = await fetch(`${handle.baseUrl}/api/marketplace/listings/${created.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: { amount: 210 } }),
    });
    expect(patchListing.status).toBe(200);

    const delistListing = await fetch(`${handle.baseUrl}/api/marketplace/listings/${created.slug}/delist`, { method: 'POST' });
    expect(delistListing.status).toBe(200);
    const delisted = (await delistListing.json()) as { saleState: string };
    expect(delisted.saleState).toBe('delisted');

    const relistListing = await fetch(`${handle.baseUrl}/api/marketplace/listings/${created.slug}/relist`, { method: 'POST' });
    expect(relistListing.status).toBe(200);
    const relisted = (await relistListing.json()) as { saleState: string };
    expect(relisted.saleState).toBe('published');

    // Keep Ridgeback breedable again for the scenario breeding step.
    const delistAgain = await fetch(`${handle.baseUrl}/api/marketplace/listings/${created.slug}/delist`, { method: 'POST' });
    expect(delistAgain.status).toBe(200);

    const purchaseResponse = await fetch(`${handle.baseUrl}/api/marketplace/listings/listing_solstice_201/purchase`, { method: 'POST' });
    expect(purchaseResponse.status).toBe(200);

    const eligibilityResponse = await fetch(`${handle.baseUrl}/api/breeding/eligibility?specimenId=spec_ridgeback_002`);
    expect(eligibilityResponse.status).toBe(200);
    const eligibility = (await eligibilityResponse.json()) as { specimenId: string };
    expect(eligibility.specimenId).toBe('spec_ridgeback_002');

    const provenanceResponse = await fetch(`${handle.baseUrl}/api/claws/claw-ridgeback-002/provenance`);
    expect(provenanceResponse.status).toBe(200);
    const provenance = (await provenanceResponse.json()) as { clawId: string; events: unknown[] };
    expect(provenance.clawId).toBe('claw-ridgeback-002');
    expect(Array.isArray(provenance.events)).toBe(true);

    const breedResponse = await fetch(`${handle.baseUrl}/api/breeding/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentASpecimenId: 'spec_ridgeback_002',
        parentBSpecimenId: 'spec_orchid_003',
        breedPrompt: 'Northglass',
      }),
    });
    expect(breedResponse.status).toBe(200);
    const breed = (await breedResponse.json()) as {
      breedRunId: string;
      child: { specimenId: string };
      parentCooldowns: Array<{ specimenId: string }>;
      nextActions: string[];
      transactionEventIds: string[];
    };
    expect(breed.breedRunId).toContain('breed_run_');
    expect(breed.child.specimenId).toContain('spec_child_');
    expect(breed.parentCooldowns).toHaveLength(2);
    expect(breed.nextActions.length).toBeGreaterThan(0);
    expect(breed.transactionEventIds).toHaveLength(2);
  });
});
