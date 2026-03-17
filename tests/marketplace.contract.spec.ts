import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';
import { INITIAL_CLAWS } from '../src/data/claws';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

const clawListing = {
  id: 'listing-claw-1',
  slug: 'sage-demo',
  kind: 'claw' as const,
  trust: 'unsigned' as const,
  publisherMode: 'local-skill' as const,
  title: 'Sage',
  summary: 'A calm park analyst ready for public listing.',
  claw: INITIAL_CLAWS[0],
  publisher: {
    id: 'publisher-1',
    kind: 'unsigned' as const,
    displayName: 'Local Moltbot Publisher',
    avatarUrl: null,
    profileUrl: null,
  },
  manifest: {
    kind: 'claw' as const,
    bundleVersion: 1,
    source: 'openclaw-workspace-zip' as const,
    includedFiles: ['IDENTITY.md', 'SOUL.md'],
    ignoredFiles: [],
    warnings: [],
    generatedAt: '2026-03-10T00:00:00.000Z',
    toolsVisibility: 'full' as const,
    coverStyle: 'avatar' as const,
  },
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  publishedAt: '2026-03-10T00:00:00.000Z',
  currentVersion: { version: 1, publishedAt: '2026-03-10T00:00:00.000Z' },
  bundleDownloadUrl: '/api/marketplace/listings/sage-demo/bundle',
  claimable: true as const,
};

const skillListing = {
  id: 'listing-skill-1',
  slug: 'park-audit-skill',
  kind: 'skill' as const,
  trust: 'unsigned' as const,
  publisherMode: 'local-skill' as const,
  title: 'Park Audit',
  summary: 'Scans an enclosure for broken assumptions.',
  skill: {
    slug: 'park-audit',
    name: 'Park Audit',
    description: 'Scans an enclosure for broken assumptions.',
    summary: 'Scans an enclosure for broken assumptions.',
    entrypoint: 'SKILL.md',
    scriptFiles: ['scripts/park_audit.py'],
    assetFiles: [],
    referenceFiles: ['README.md'],
  },
  publisher: {
    id: 'publisher-2',
    kind: 'unsigned' as const,
    displayName: 'Local Moltbot Publisher',
    avatarUrl: null,
    profileUrl: null,
  },
  manifest: {
    kind: 'skill' as const,
    bundleVersion: 1,
    source: 'openclaw-skill-zip' as const,
    includedFiles: ['SKILL.md', 'scripts/park_audit.py'],
    ignoredFiles: [],
    warnings: [],
    generatedAt: '2026-03-10T00:00:00.000Z',
    entrypoint: 'SKILL.md',
    scriptFiles: ['scripts/park_audit.py'],
    assetFiles: [],
    referenceFiles: ['README.md'],
  },
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  publishedAt: '2026-03-10T00:00:00.000Z',
  currentVersion: { version: 1, publishedAt: '2026-03-10T00:00:00.000Z' },
  bundleDownloadUrl: '/api/marketplace/listings/park-audit-skill/bundle',
  claimable: false as const,
  installHint: 'Install into ~/.agents/skills/park-audit',
};

describe('marketplace integration contracts', () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');

    const me = {
      userId: 'user_sigrid',
      displayName: 'Sigrid',
      handle: '@sigrid',
      portfolio: {
        ownedCount: 4,
        listedCount: 1,
        breedableCount: 2,
        cooldownCount: 1,
      },
      featureFlags: {
        mockCommerce: true,
        sellerManagement: true,
        buyFlow: true,
      },
    };

    const myClaws = {
      counts: {
        owned: 4,
        listed: 1,
        cooldown: 1,
        newborn: 1,
      },
      items: [
        {
          specimenId: 'spec_ridgeback_002',
          sourceKind: 'published-listing',
          owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
          inventoryState: 'owned',
          location: 'my-claws',
          activeListingId: null,
          acquiredAt: '2026-03-14T09:00:00.000Z',
          claw: { ...INITIAL_CLAWS[1], id: 'claw-ridgeback-002', name: 'Ridgeback', generation: 2 },
          breeding: { isEligible: true, reasonCode: null, lastBredAt: null, cooldownEndsAt: null, breedCount: 0 },
          market: { saleState: 'not_listed', listingSlug: null, price: null },
        },
        {
          specimenId: 'spec_orchid_003',
          sourceKind: 'published-listing',
          owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
          inventoryState: 'owned',
          location: 'my-claws',
          activeListingId: null,
          acquiredAt: '2026-03-13T11:45:00.000Z',
          claw: { ...INITIAL_CLAWS[2], id: 'claw-orchid-003', name: 'Orchid Glass', generation: 2 },
          breeding: { isEligible: true, reasonCode: null, lastBredAt: null, cooldownEndsAt: null, breedCount: 0 },
          market: { saleState: 'not_listed', listingSlug: null, price: null },
        },
      ],
    };

    const mockListings = [
      {
        listingId: 'listing_solstice_201',
        slug: 'listing_solstice_201',
        specimenId: 'spec_solstice_201',
        saleState: 'published',
        seller: { userId: 'user_curator', displayName: 'Curator', handle: '@curator' },
        owner: { userId: 'user_curator', displayName: 'Curator', handle: '@curator' },
        price: { amount: 340, currency: 'USD', formatted: '$340' },
        saleLifecycle: {
          publishedAt: '2026-03-15T07:00:00.000Z',
          reservedAt: null,
          soldAt: null,
          delistedAt: null,
          lastPriceUpdatedAt: '2026-03-15T07:00:00.000Z',
        },
        breedStatus: { isEligible: false, reasonCode: 'LISTED_FOR_SALE', cooldownEndsAt: null },
        provenanceSummary: { birthEventId: 'evt_publish_solstice', lastTransferEventId: null, eventCount: 2 },
        claw: { ...INITIAL_CLAWS[4], id: 'claw-solstice-201', name: 'Solstice Sentinel', generation: 1 },
      },
    ];

    const transactions = [
      {
        eventId: 'evt_list_solstice',
        eventType: 'listed_for_sale',
        occurredAt: '2026-03-15T07:00:00.000Z',
        specimenId: 'spec_solstice_201',
        clawId: 'claw-solstice-201',
        listingSlug: 'listing_solstice_201',
        summary: 'Solstice Sentinel listed for $340.',
        price: { amount: 340, currency: 'USD', formatted: '$340' },
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/auth/session')) {
          return new Response(JSON.stringify({ user: null, authConfigured: true }), { status: 200 });
        }
        if (url.endsWith('/api/marketplace/listings') && method === 'GET') {
          return new Response(JSON.stringify([clawListing, skillListing]), { status: 200 });
        }
        if (url.endsWith('/api/marketplace/mock-listings')) {
          return new Response(JSON.stringify(mockListings), { status: 200 });
        }
        if (url.endsWith('/api/me')) {
          return new Response(JSON.stringify(me), { status: 200 });
        }
        if (url.endsWith('/api/my/transactions')) {
          return new Response(JSON.stringify({ items: transactions }), { status: 200 });
        }
        if (url.endsWith('/api/my/claws')) {
          return new Response(JSON.stringify(myClaws), { status: 200 });
        }
        if (url.includes('/api/my/claws/spec_ridgeback_002')) {
          return new Response(JSON.stringify({ specimen: myClaws.items[0], listing: null, recentEvents: [] }), { status: 200 });
        }
        if (url.includes('/api/my/claws/spec_orchid_003')) {
          return new Response(JSON.stringify({ specimen: myClaws.items[1], listing: null, recentEvents: [] }), { status: 200 });
        }
        if (url.includes('/api/claws/claw-ridgeback-002/provenance')) {
          return new Response(JSON.stringify({ clawId: 'claw-ridgeback-002', specimenId: 'spec_ridgeback_002', events: [] }), { status: 200 });
        }
        if (url.includes('/api/claws/claw-orchid-003/provenance')) {
          return new Response(JSON.stringify({ clawId: 'claw-orchid-003', specimenId: 'spec_orchid_003', events: [] }), { status: 200 });
        }
        if (url.endsWith('/api/marketplace/listings') && method === 'POST') {
          myClaws.items[0].market.saleState = 'published';
          myClaws.items[0].market.listingSlug = 'listing_ridgeback_002';
          myClaws.items[0].market.price = { amount: 180, currency: 'USD', formatted: '$180' };
          mockListings.unshift({
            listingId: 'listing_ridgeback_002',
            slug: 'listing_ridgeback_002',
            specimenId: 'spec_ridgeback_002',
            saleState: 'published',
            seller: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
            owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
            price: { amount: 180, currency: 'USD', formatted: '$180' },
            saleLifecycle: {
              publishedAt: '2026-03-17T00:00:00.000Z',
              reservedAt: null,
              soldAt: null,
              delistedAt: null,
              lastPriceUpdatedAt: '2026-03-17T00:00:00.000Z',
            },
            breedStatus: { isEligible: false, reasonCode: 'LISTED_FOR_SALE', cooldownEndsAt: null },
            provenanceSummary: { birthEventId: null, lastTransferEventId: null, eventCount: 1 },
            claw: myClaws.items[0].claw,
          });
          return new Response(JSON.stringify(mockListings[0]), { status: 201 });
        }
        if (url.endsWith('/api/marketplace/listings/listing_solstice_201/purchase')) {
          const purchased = {
            specimenId: 'spec_solstice_201',
            sourceKind: 'published-listing',
            owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
            inventoryState: 'owned',
            location: 'my-claws',
            activeListingId: null,
            acquiredAt: '2026-03-17T00:10:00.000Z',
            claw: mockListings[0].claw,
            breeding: { isEligible: true, reasonCode: null, lastBredAt: null, cooldownEndsAt: null, breedCount: 0 },
            market: { saleState: 'not_listed', listingSlug: null, price: null },
          };
          myClaws.items.push(purchased);
          me.portfolio.ownedCount += 1;
          transactions.unshift({
            eventId: 'evt_purchase_solstice',
            eventType: 'purchase_completed',
            occurredAt: '2026-03-17T00:10:00.000Z',
            specimenId: 'spec_solstice_201',
            clawId: 'claw-solstice-201',
            listingSlug: 'listing_solstice_201',
            summary: 'You purchased Solstice Sentinel for $340.',
            price: { amount: 340, currency: 'USD', formatted: '$340' },
          });
          mockListings[0] = { ...mockListings[0], saleState: 'sold', owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' } };
          return new Response(JSON.stringify({
            status: 'completed',
            listing: { listingId: 'listing_solstice_201', slug: 'listing_solstice_201', saleState: 'sold', price: { amount: 340, currency: 'USD', formatted: '$340' } },
            transfer: { specimenId: 'spec_solstice_201', fromOwnerUserId: 'user_curator', toOwnerUserId: 'user_sigrid', completedAt: '2026-03-17T00:10:00.000Z' },
            buyerReceipt: { receiptId: 'receipt-1', summary: 'You purchased Solstice Sentinel for $340.', transactionEventId: 'evt_purchase_solstice' },
            sellerReceipt: { receiptId: 'receipt-2', summary: 'Curator sold Solstice Sentinel for $340.', transactionEventId: 'evt_purchase_solstice' },
          }), { status: 200 });
        }
        if (url.endsWith('/api/breeding/runs')) {
          const child = {
            specimenId: 'spec_child_999',
            sourceKind: 'bred-child',
            owner: { userId: 'user_sigrid', displayName: 'Sigrid', handle: '@sigrid' },
            inventoryState: 'newborn',
            location: 'newborn',
            activeListingId: null,
            acquiredAt: '2026-03-17T00:20:00.000Z',
            claw: { ...INITIAL_CLAWS[3], id: 'claw-child-999', name: 'Northglass Echo', generation: 3 },
            breeding: { isEligible: false, reasonCode: 'NEWBORN_IMPRINTING', lastBredAt: null, cooldownEndsAt: null, breedCount: 0 },
            market: { saleState: 'not_listed', listingSlug: null, price: null },
          };
          myClaws.items.push(child);
          transactions.unshift({
            eventId: 'evt_birth_child_999',
            eventType: 'specimen_born',
            occurredAt: '2026-03-17T00:20:00.000Z',
            specimenId: 'spec_child_999',
            clawId: 'claw-child-999',
            summary: 'Northglass Echo joined your inventory as a newborn.',
          });
          return new Response(JSON.stringify({
            breedRunId: 'breed-run-1',
            child,
            parentCooldowns: [
              { specimenId: 'spec_ridgeback_002', cooldownEndsAt: '2026-03-18T00:20:00.000Z' },
              { specimenId: 'spec_orchid_003', cooldownEndsAt: '2026-03-18T00:20:00.000Z' },
            ],
            nextActions: ['Add newborn to gallery', 'List later'],
            transactionEventIds: ['evt_birth_child_999'],
          }), { status: 200 });
        }
        if (url.includes('/api/marketplace/listings/sage-demo/bundle')) {
          return new Response(JSON.stringify({ kind: 'claw', claw: clawListing.claw, manifest: clawListing.manifest }), { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  it('wires browse, portfolio, seller, buy, breed, and publish surfaces together', async () => {
    render(createElement(App));

    fireEvent.click(await screen.findByRole('button', { name: /Marketplace/i }));

    expect(await screen.findByText(/Sage/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Buy \$340/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /My Claws/i }));

    expect((await screen.findAllByText(/Ridgeback/i)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: /List for Sale/i })[0]!);
    await waitFor(() => expect(screen.getByText(/Listed Ridgeback/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Browse/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Buy \$340/i }));
    await waitFor(() => expect(screen.getAllByText(/You purchased Solstice Sentinel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /My Claws/i }));
    await waitFor(() => expect(screen.getAllByText(/Solstice Sentinel/i).length).toBeGreaterThan(0));

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'spec_ridgeback_002' } });
    fireEvent.change(selects[1], { target: { value: 'spec_orchid_003' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Mock Breed/i }));
    await waitFor(() => expect(screen.getByText(/Northglass Echo/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Sign in with Discord/i })).toBeInTheDocument();
      expect(screen.getByText(/Moltbot-style publish/i)).toBeInTheDocument();
      expect(screen.getByText(/CLAWPARK_MARKETPLACE_URL/i)).toBeInTheDocument();
    });
  });
});
