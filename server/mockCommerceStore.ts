import { randomUUID } from 'node:crypto';
import type { Claw } from '../src/types/claw.ts';
import { INITIAL_CLAWS } from '../src/data/claws.ts';
import type {
  MockBreedRunRequest,
  MockBreedRunResponse,
  MockBreedingStatus,
  MockInventoryResponse,
  MockInventorySpecimen,
  MockListingMutationRequest,
  MockListingPriceUpdateRequest,
  MockListingSnapshot,
  MockMeResponse,
  MockMeSummaryResponse,
  MockPrice,
  MockProvenanceResponse,
  MockPurchaseResponse,
  MockSaleLifecycle,
  MockSaleState,
  MockTransactionEvent,
  MockTransactionsResponse,
} from '../src/types/mockCommerce.ts';

export class MockCommerceError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface MockCommerceStore {
  getMe(): MockMeResponse;
  getSummary(): MockMeSummaryResponse;
  listMarketplaceListings(): MockListingSnapshot[];
  listMyClaws(filters: { inventoryState?: string | null; breedable?: string | null; sourceKind?: string | null }): MockInventoryResponse;
  getSpecimenDetail(specimenId: string): {
    specimen: MockInventorySpecimen;
    listing: MockListingSnapshot | null;
    recentEvents: MockTransactionEvent[];
  };
  getSpecimenActivity(specimenId: string): MockTransactionEvent[];
  createListing(payload: MockListingMutationRequest): MockListingSnapshot;
  updateListingPrice(slug: string, payload: MockListingPriceUpdateRequest): MockListingSnapshot;
  delistListing(slug: string): MockListingSnapshot;
  relistListing(slug: string): MockListingSnapshot;
  purchaseListing(slug: string): MockPurchaseResponse;
  getBreedingEligibility(specimenId: string): MockBreedingStatus & { specimenId: string };
  runBreed(payload: MockBreedRunRequest): MockBreedRunResponse;
  listTransactions(): MockTransactionsResponse;
  getProvenance(clawId: string): MockProvenanceResponse;
}

type InternalUser = MockMeResponse;

interface InternalSpecimen {
  specimenId: string;
  sourceKind: MockInventorySpecimen['sourceKind'];
  ownerId: string;
  inventoryState: MockInventorySpecimen['inventoryState'];
  location: MockInventorySpecimen['location'];
  activeListingSlug: string | null;
  acquiredAt: string;
  claw: Claw;
  breeding: MockBreedingStatus;
  market: {
    saleState: MockSaleState;
    price: MockPrice | null;
  };
}

interface InternalListing {
  listingId: string;
  slug: string;
  specimenId: string;
  sellerId: string;
  currentOwnerId: string;
  saleState: MockSaleState;
  price: MockPrice;
  saleLifecycle: MockSaleLifecycle;
  breedStatus: Pick<MockBreedingStatus, 'isEligible' | 'reasonCode' | 'cooldownEndsAt'>;
  provenanceSummary: {
    birthEventId: string | null;
    lastTransferEventId: string | null;
  };
  claw: Claw;
}

interface InternalState {
  currentUserId: string;
  users: Record<string, InternalUser>;
  specimens: Record<string, InternalSpecimen>;
  listings: Record<string, InternalListing>;
  listingBySpecimen: Record<string, string | undefined>;
  transactions: MockTransactionEvent[];
  counters: {
    listing: number;
    specimen: number;
    event: number;
    breedRun: number;
  };
}

const FEATURE_FLAGS = {
  mockCommerce: true,
  sellerManagement: true,
  buyFlow: true,
};

function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return structuredClone(value) as T;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatPrice(amount: number, currency = 'USD'): MockPrice {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
  return {
    amount,
    currency,
    formatted: formatter.format(amount),
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'listing'
  );
}

function addHours(iso: string, hours: number) {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function cloneClaw(base: Claw, overrides: Partial<Claw>): Claw {
  const next = deepClone(base);
  return { ...next, ...overrides };
}

function buildInitialState(): InternalState {
  const users: Record<string, InternalUser> = {
    user_sigrid: {
      userId: 'user_sigrid',
      displayName: 'Sigrid',
      handle: '@sigrid',
      portfolio: {
        ownedCount: 0,
        listedCount: 0,
        breedableCount: 0,
        cooldownCount: 0,
      },
      featureFlags: FEATURE_FLAGS,
    },
    user_ranger: {
      userId: 'user_ranger',
      displayName: 'Park Ranger',
      handle: '@parkranger',
      portfolio: {
        ownedCount: 0,
        listedCount: 0,
        breedableCount: 0,
        cooldownCount: 0,
      },
      featureFlags: FEATURE_FLAGS,
    },
    user_curator: {
      userId: 'user_curator',
      displayName: 'Curator',
      handle: '@curator',
      portfolio: {
        ownedCount: 0,
        listedCount: 0,
        breedableCount: 0,
        cooldownCount: 0,
      },
      featureFlags: FEATURE_FLAGS,
    },
  };

  const meridianClaw = cloneClaw(INITIAL_CLAWS[0], { id: 'claw-meridian-001', name: 'Meridian', generation: 2 });
  const ridgebackClaw = cloneClaw(INITIAL_CLAWS[1], { id: 'claw-ridgeback-002', name: 'Ridgeback', generation: 2 });
  const orchidClaw = cloneClaw(INITIAL_CLAWS[2], { id: 'claw-orchid-003', name: 'Orchid Glass', generation: 2 });
  const northglassClaw = cloneClaw(INITIAL_CLAWS[3], { id: 'claw-northglass-301', name: 'Northglass', generation: 3 });
  const sentinelClaw = cloneClaw(INITIAL_CLAWS[4], { id: 'claw-solstice-201', name: 'Solstice Sentinel', generation: 1 });
  const archiveClaw = cloneClaw(INITIAL_CLAWS[5], { id: 'claw-archive-777', name: 'Archive Ledger', generation: 1 });

  const specimens: Record<string, InternalSpecimen> = {
    spec_meridian_001: {
      specimenId: 'spec_meridian_001',
      sourceKind: 'published-listing',
      ownerId: 'user_sigrid',
      inventoryState: 'listed',
      location: 'market',
      activeListingSlug: 'listing_meridian_001',
      acquiredAt: '2026-03-16T18:10:00.000Z',
      claw: meridianClaw,
      breeding: {
        isEligible: false,
        reasonCode: 'LISTED_FOR_SALE',
        lastBredAt: '2026-03-15T14:00:00.000Z',
        cooldownEndsAt: null,
        breedCount: 1,
      },
      market: {
        saleState: 'published',
        price: formatPrice(120),
      },
    },
    spec_ridgeback_002: {
      specimenId: 'spec_ridgeback_002',
      sourceKind: 'published-listing',
      ownerId: 'user_sigrid',
      inventoryState: 'owned',
      location: 'my-claws',
      activeListingSlug: null,
      acquiredAt: '2026-03-14T09:00:00.000Z',
      claw: ridgebackClaw,
      breeding: {
        isEligible: true,
        reasonCode: null,
        lastBredAt: null,
        cooldownEndsAt: null,
        breedCount: 0,
      },
      market: {
        saleState: 'not_listed',
        price: null,
      },
    },
    spec_orchid_003: {
      specimenId: 'spec_orchid_003',
      sourceKind: 'published-listing',
      ownerId: 'user_sigrid',
      inventoryState: 'owned',
      location: 'my-claws',
      activeListingSlug: null,
      acquiredAt: '2026-03-13T11:45:00.000Z',
      claw: orchidClaw,
      breeding: {
        isEligible: true,
        reasonCode: null,
        lastBredAt: null,
        cooldownEndsAt: null,
        breedCount: 0,
      },
      market: {
        saleState: 'not_listed',
        price: null,
      },
    },
    spec_cartographer_004: {
      specimenId: 'spec_cartographer_004',
      sourceKind: 'published-listing',
      ownerId: 'user_sigrid',
      inventoryState: 'owned',
      location: 'my-claws',
      activeListingSlug: null,
      acquiredAt: '2026-03-12T13:20:00.000Z',
      claw: cloneClaw(meridianClaw, { id: 'claw-cartographer-004', name: 'Cartographer', generation: 1 }),
      breeding: {
        isEligible: false,
        reasonCode: 'COOLDOWN_ACTIVE',
        lastBredAt: '2026-03-16T16:22:00.000Z',
        cooldownEndsAt: '2026-03-17T16:22:00.000Z',
        breedCount: 2,
      },
      market: {
        saleState: 'not_listed',
        price: null,
      },
    },
    spec_northglass_301: {
      specimenId: 'spec_northglass_301',
      sourceKind: 'bred-child',
      ownerId: 'user_sigrid',
      inventoryState: 'newborn',
      location: 'newborn',
      activeListingSlug: null,
      acquiredAt: '2026-03-16T18:22:00.000Z',
      claw: northglassClaw,
      breeding: {
        isEligible: false,
        reasonCode: 'NEWBORN_IMPRINTING',
        lastBredAt: null,
        cooldownEndsAt: null,
        breedCount: 0,
      },
      market: {
        saleState: 'not_listed',
        price: null,
      },
    },
    spec_solstice_201: {
      specimenId: 'spec_solstice_201',
      sourceKind: 'published-listing',
      ownerId: 'user_curator',
      inventoryState: 'listed',
      location: 'market',
      activeListingSlug: 'listing_solstice_201',
      acquiredAt: '2026-03-10T08:00:00.000Z',
      claw: sentinelClaw,
      breeding: {
        isEligible: false,
        reasonCode: 'LISTED_FOR_SALE',
        lastBredAt: null,
        cooldownEndsAt: null,
        breedCount: 0,
      },
      market: {
        saleState: 'published',
        price: formatPrice(340),
      },
    },
    spec_archive_777: {
      specimenId: 'spec_archive_777',
      sourceKind: 'published-listing',
      ownerId: 'user_ranger',
      inventoryState: 'sold',
      location: 'my-claws',
      activeListingSlug: 'listing_archive_777',
      acquiredAt: '2026-03-15T11:05:00.000Z',
      claw: archiveClaw,
      breeding: {
        isEligible: false,
        reasonCode: 'NOT_OWNED',
        lastBredAt: null,
        cooldownEndsAt: null,
        breedCount: 0,
      },
      market: {
        saleState: 'sold',
        price: null,
      },
    },
  };

  const listings: Record<string, InternalListing> = {
    listing_meridian_001: {
      listingId: 'listing_meridian_001',
      slug: 'listing_meridian_001',
      specimenId: 'spec_meridian_001',
      sellerId: 'user_sigrid',
      currentOwnerId: 'user_sigrid',
      saleState: 'published',
      price: formatPrice(120),
      saleLifecycle: {
        publishedAt: '2026-03-16T18:12:00.000Z',
        reservedAt: null,
        soldAt: null,
        delistedAt: null,
        lastPriceUpdatedAt: '2026-03-16T18:12:00.000Z',
      },
      breedStatus: {
        isEligible: false,
        reasonCode: 'LISTED_FOR_SALE',
        cooldownEndsAt: null,
      },
      provenanceSummary: {
        birthEventId: 'evt_publish_meridian',
        lastTransferEventId: null,
      },
      claw: meridianClaw,
    },
    listing_solstice_201: {
      listingId: 'listing_solstice_201',
      slug: 'listing_solstice_201',
      specimenId: 'spec_solstice_201',
      sellerId: 'user_curator',
      currentOwnerId: 'user_curator',
      saleState: 'published',
      price: formatPrice(340),
      saleLifecycle: {
        publishedAt: '2026-03-15T07:00:00.000Z',
        reservedAt: null,
        soldAt: null,
        delistedAt: null,
        lastPriceUpdatedAt: '2026-03-15T07:00:00.000Z',
      },
      breedStatus: {
        isEligible: false,
        reasonCode: 'LISTED_FOR_SALE',
        cooldownEndsAt: null,
      },
      provenanceSummary: {
        birthEventId: 'evt_publish_solstice',
        lastTransferEventId: null,
      },
      claw: sentinelClaw,
    },
    listing_archive_777: {
      listingId: 'listing_archive_777',
      slug: 'listing_archive_777',
      specimenId: 'spec_archive_777',
      sellerId: 'user_curator',
      currentOwnerId: 'user_ranger',
      saleState: 'sold',
      price: formatPrice(215),
      saleLifecycle: {
        publishedAt: '2026-03-14T04:00:00.000Z',
        reservedAt: '2026-03-15T10:59:00.000Z',
        soldAt: '2026-03-15T11:00:00.000Z',
        delistedAt: null,
        lastPriceUpdatedAt: '2026-03-14T04:00:00.000Z',
      },
      breedStatus: {
        isEligible: false,
        reasonCode: 'SOLD',
        cooldownEndsAt: null,
      },
      provenanceSummary: {
        birthEventId: 'evt_publish_archive',
        lastTransferEventId: 'evt_purchase_archive',
      },
      claw: archiveClaw,
    },
  };

  const listingBySpecimen: Record<string, string | undefined> = {
    spec_meridian_001: 'listing_meridian_001',
    spec_solstice_201: 'listing_solstice_201',
    spec_archive_777: 'listing_archive_777',
  };

  const transactions: MockTransactionEvent[] = [
    {
      eventId: 'evt_publish_meridian',
      eventType: 'published',
      occurredAt: '2026-03-16T18:10:00.000Z',
      specimenId: 'spec_meridian_001',
      clawId: 'claw-meridian-001',
      listingSlug: 'listing_meridian_001',
      actorUserId: 'user_sigrid',
      summary: 'Meridian was published to the registry.',
    },
    {
      eventId: 'evt_list_meridian',
      eventType: 'listed_for_sale',
      occurredAt: '2026-03-16T18:12:00.000Z',
      specimenId: 'spec_meridian_001',
      clawId: 'claw-meridian-001',
      listingSlug: 'listing_meridian_001',
      actorUserId: 'user_sigrid',
      summary: 'Sigrid listed Meridian for $120.',
      price: formatPrice(120),
    },
    {
      eventId: 'evt_publish_solstice',
      eventType: 'published',
      occurredAt: '2026-03-15T06:50:00.000Z',
      specimenId: 'spec_solstice_201',
      clawId: 'claw-solstice-201',
      listingSlug: 'listing_solstice_201',
      actorUserId: 'user_curator',
      summary: 'Curator published Solstice Sentinel.',
    },
    {
      eventId: 'evt_list_solstice',
      eventType: 'listed_for_sale',
      occurredAt: '2026-03-15T07:00:00.000Z',
      specimenId: 'spec_solstice_201',
      clawId: 'claw-solstice-201',
      listingSlug: 'listing_solstice_201',
      actorUserId: 'user_curator',
      summary: 'Solstice Sentinel listed for $340.',
      price: formatPrice(340),
    },
    {
      eventId: 'evt_publish_archive',
      eventType: 'published',
      occurredAt: '2026-03-14T04:00:00.000Z',
      specimenId: 'spec_archive_777',
      clawId: 'claw-archive-777',
      listingSlug: 'listing_archive_777',
      actorUserId: 'user_curator',
      summary: 'Archive Ledger was published to the registry.',
    },
    {
      eventId: 'evt_purchase_archive',
      eventType: 'purchase_completed',
      occurredAt: '2026-03-15T11:00:00.000Z',
      specimenId: 'spec_archive_777',
      clawId: 'claw-archive-777',
      listingSlug: 'listing_archive_777',
      actorUserId: 'user_ranger',
      fromOwnerUserId: 'user_curator',
      toOwnerUserId: 'user_ranger',
      summary: 'Archive Ledger transferred from Curator to Park Ranger for $215.',
      price: formatPrice(215),
    },
    {
      eventId: 'evt_breed_northglass',
      eventType: 'breed_run_completed',
      occurredAt: '2026-03-16T18:22:00.000Z',
      specimenId: 'spec_northglass_301',
      clawId: 'claw-northglass-301',
      actorUserId: 'user_sigrid',
      summary: 'Sigrid bred Ridgeback with Orchid Glass.',
    },
    {
      eventId: 'evt_birth_northglass',
      eventType: 'specimen_born',
      occurredAt: '2026-03-16T18:22:00.000Z',
      specimenId: 'spec_northglass_301',
      clawId: 'claw-northglass-301',
      toOwnerUserId: 'user_sigrid',
      summary: 'Northglass joined your inventory as a newborn.',
    },
  ];

  return {
    currentUserId: 'user_sigrid',
    users,
    specimens,
    listings,
    listingBySpecimen,
    transactions,
    counters: {
      listing: 802,
      specimen: 950,
      event: 1900,
      breedRun: 400,
    },
  };
}

export function createMockCommerceStore(options: { now?: () => Date } = {}): MockCommerceStore {
  const clock = options.now ?? (() => new Date());
  const state = buildInitialState();

  function nowIso() {
    return clock().toISOString();
  }

  function getCurrentUser() {
    const user = state.users[state.currentUserId];
    if (!user) {
      throw new MockCommerceError(401, 'SESSION_EXPIRED', 'Current user is not available.');
    }
    return user;
  }

  function getSpecimenOrThrow(specimenId: string) {
    const specimen = state.specimens[specimenId];
    if (!specimen) {
      throw new MockCommerceError(404, 'SPECIMEN_NOT_FOUND', 'Specimen not found.');
    }
    return specimen;
  }

  function getListingOrThrow(slug: string) {
    const listing = state.listings[slug];
    if (!listing) {
      throw new MockCommerceError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
    }
    return listing;
  }

  function toSpecimenResponse(specimen: InternalSpecimen): MockInventorySpecimen {
    const owner = state.users[specimen.ownerId];
    return {
      specimenId: specimen.specimenId,
      sourceKind: specimen.sourceKind,
      owner: {
        userId: owner.userId,
        displayName: owner.displayName,
        handle: owner.handle,
      },
      inventoryState: specimen.inventoryState,
      location: specimen.location,
      activeListingId: specimen.activeListingSlug,
      acquiredAt: specimen.acquiredAt,
      claw: deepClone(specimen.claw),
      breeding: deepClone(specimen.breeding),
      market: {
        saleState: specimen.market.saleState,
        listingSlug: specimen.activeListingSlug,
        price: specimen.market.price ? { ...specimen.market.price } : null,
      },
    };
  }

  function specimenEvents(specimenId: string) {
    return state.transactions.filter((event) => event.specimenId === specimenId);
  }

  function toListingSnapshot(listing: InternalListing): MockListingSnapshot {
    const seller = state.users[listing.sellerId];
    const owner = state.users[listing.currentOwnerId];
    const eventCount = specimenEvents(listing.specimenId).length;
    return {
      listingId: listing.listingId,
      slug: listing.slug,
      specimenId: listing.specimenId,
      saleState: listing.saleState,
      seller: {
        userId: seller.userId,
        displayName: seller.displayName,
        handle: seller.handle,
      },
      owner: {
        userId: owner.userId,
        displayName: owner.displayName,
        handle: owner.handle,
      },
      price: { ...listing.price },
      saleLifecycle: { ...listing.saleLifecycle },
      breedStatus: { ...listing.breedStatus },
      provenanceSummary: {
        birthEventId: listing.provenanceSummary.birthEventId,
        lastTransferEventId: listing.provenanceSummary.lastTransferEventId,
        eventCount,
      },
      claw: deepClone(listing.claw),
    };
  }

  function recordEvent(event: MockTransactionEvent) {
    state.transactions.push(event);
  }

  function ensureCurrentUserOwns(specimen: InternalSpecimen) {
    if (specimen.ownerId !== state.currentUserId) {
      throw new MockCommerceError(403, 'NOT_OWNER', 'You do not own this specimen.');
    }
  }

  function applyListingBreedingBlock(specimen: InternalSpecimen, reason: string) {
    specimen.breeding.isEligible = false;
    specimen.breeding.reasonCode = reason;
  }

  function releaseListingBreedingBlock(specimen: InternalSpecimen) {
    if (specimen.breeding.reasonCode === 'LISTED_FOR_SALE' || specimen.breeding.reasonCode === 'RESERVED_FOR_TRANSFER') {
      specimen.breeding.isEligible = true;
      specimen.breeding.reasonCode = null;
    }
  }

  function formatCounts(specimensForUser: InternalSpecimen[]) {
    const counts = {
      owned: specimensForUser.filter((spec) => spec.inventoryState === 'owned').length,
      listed: specimensForUser.filter((spec) => spec.inventoryState === 'listed').length,
      cooldown: specimensForUser.filter((spec) => spec.breeding.reasonCode === 'COOLDOWN_ACTIVE').length,
      newborn: specimensForUser.filter((spec) => spec.inventoryState === 'newborn').length,
    };
    return counts;
  }

  function portfolioSummary(specimensForUser: InternalSpecimen[]) {
    return {
      ownedCount: specimensForUser.length,
      listedCount: specimensForUser.filter((spec) => spec.inventoryState === 'listed').length,
      breedableCount: specimensForUser.filter((spec) => spec.breeding.isEligible).length,
      cooldownCount: specimensForUser.filter((spec) => spec.breeding.reasonCode === 'COOLDOWN_ACTIVE').length,
    };
  }

  function nextListingSlug(baseName: string) {
    state.counters.listing += 1;
    return `${slugify(baseName)}-${state.counters.listing}`;
  }

  function nextSpecimenId() {
    state.counters.specimen += 1;
    return `spec_child_${state.counters.specimen}`;
  }

  function nextListingId() {
    return `listing_${state.counters.listing}`;
  }

  function nextEventId(prefix: string) {
    state.counters.event += 1;
    return `evt_${prefix}_${state.counters.event}`;
  }

  function nextBreedRunId() {
    state.counters.breedRun += 1;
    return `breed_run_${state.counters.breedRun}`;
  }

  function validatePrice(price: { amount: number; currency?: string }) {
    if (!price || typeof price.amount !== 'number' || Number.isNaN(price.amount) || price.amount <= 0) {
      throw new MockCommerceError(400, 'INVALID_PRICE', 'Price must be a positive number.');
    }
    return formatPrice(Math.round(price.amount), price.currency ?? 'USD');
  }

  return {
    getMe(): MockMeResponse {
      const user = getCurrentUser();
      const mySpecimens = Object.values(state.specimens).filter((spec) => spec.ownerId === user.userId);
      return {
        userId: user.userId,
        displayName: user.displayName,
        handle: user.handle,
        portfolio: portfolioSummary(mySpecimens),
        featureFlags: FEATURE_FLAGS,
      };
    },

    getSummary(): MockMeSummaryResponse {
      const user = getCurrentUser();
      const mySpecimens = Object.values(state.specimens).filter((spec) => spec.ownerId === user.userId);
      return {
        portfolio: portfolioSummary(mySpecimens),
      };
    },

    listMarketplaceListings(): MockListingSnapshot[] {
      return Object.values(state.listings)
        .slice()
        .sort((left, right) => {
          const leftTime = left.saleLifecycle.publishedAt ?? left.saleLifecycle.soldAt ?? '';
          const rightTime = right.saleLifecycle.publishedAt ?? right.saleLifecycle.soldAt ?? '';
          return rightTime.localeCompare(leftTime);
        })
        .map((listing) => toListingSnapshot(listing));
    },

    listMyClaws(filters: { inventoryState?: string | null; breedable?: string | null; sourceKind?: string | null }): MockInventoryResponse {
      const user = getCurrentUser();
      let items = Object.values(state.specimens).filter((spec) => spec.ownerId === user.userId);
      if (filters.inventoryState) {
        items = items.filter((spec) => spec.inventoryState === filters.inventoryState);
      }
      if (filters.sourceKind) {
        items = items.filter((spec) => spec.sourceKind === filters.sourceKind);
      }
      if (filters.breedable === 'true') {
        items = items.filter((spec) => spec.breeding.isEligible);
      }
      const counts = formatCounts(Object.values(state.specimens).filter((spec) => spec.ownerId === user.userId));
      return {
        items: items.map((spec) => toSpecimenResponse(spec)),
        counts,
      };
    },

    getSpecimenDetail(specimenId: string) {
      const specimen = getSpecimenOrThrow(specimenId);
      ensureCurrentUserOwns(specimen);
      const listing = specimen.activeListingSlug ? state.listings[specimen.activeListingSlug] ?? null : null;
      const events = specimenEvents(specimen.specimenId)
        .slice(-5)
        .reverse()
        .map((event) => ({ ...event }));
      return {
        specimen: toSpecimenResponse(specimen),
        listing: listing ? toListingSnapshot(listing) : null,
        recentEvents: events,
      };
    },

    getSpecimenActivity(specimenId: string) {
      const specimen = getSpecimenOrThrow(specimenId);
      ensureCurrentUserOwns(specimen);
      return specimenEvents(specimen.specimenId)
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .map((event) => ({ ...event }));
    },

    createListing(payload: MockListingMutationRequest) {
      const specimen = getSpecimenOrThrow(payload.specimenId);
      ensureCurrentUserOwns(specimen);
      if (specimen.inventoryState === 'listed' || specimen.activeListingSlug) {
        throw new MockCommerceError(409, 'ALREADY_LISTED', 'Specimen already has an active listing.');
      }
      if (specimen.inventoryState === 'sold') {
        throw new MockCommerceError(409, 'SPECIMEN_NOT_AVAILABLE', 'Sold specimens cannot be listed.');
      }
      const price = validatePrice(payload.price);
      const slug = nextListingSlug(specimen.claw.name);
      const listing: InternalListing = {
        listingId: nextListingId(),
        slug,
        specimenId: specimen.specimenId,
        sellerId: state.currentUserId,
        currentOwnerId: state.currentUserId,
        saleState: 'published',
        price,
        saleLifecycle: {
          publishedAt: nowIso(),
          reservedAt: null,
          soldAt: null,
          delistedAt: null,
          lastPriceUpdatedAt: nowIso(),
        },
        breedStatus: {
          isEligible: false,
          reasonCode: 'LISTED_FOR_SALE',
          cooldownEndsAt: specimen.breeding.cooldownEndsAt,
        },
        provenanceSummary: {
          birthEventId: specimenEvents(specimen.specimenId)[0]?.eventId ?? null,
          lastTransferEventId: null,
        },
        claw: deepClone(specimen.claw),
      };
      state.listings[slug] = listing;
      state.listingBySpecimen[specimen.specimenId] = slug;
      specimen.inventoryState = 'listed';
      specimen.location = 'market';
      specimen.activeListingSlug = slug;
      specimen.market.saleState = 'published';
      specimen.market.price = { ...price };
      applyListingBreedingBlock(specimen, 'LISTED_FOR_SALE');
      recordEvent({
        eventId: nextEventId('list'),
        eventType: 'listed_for_sale',
        occurredAt: nowIso(),
        specimenId: specimen.specimenId,
        clawId: specimen.claw.id,
        listingSlug: slug,
        actorUserId: state.currentUserId,
        summary: `${getCurrentUser().displayName} listed ${specimen.claw.name} for ${price.formatted}.`,
        price,
      });
      return toListingSnapshot(listing);
    },

    updateListingPrice(slug: string, payload: MockListingPriceUpdateRequest) {
      const listing = getListingOrThrow(slug);
      if (listing.sellerId !== state.currentUserId) {
        throw new MockCommerceError(403, 'NOT_OWNER', 'You can only edit your listings.');
      }
      if (listing.saleState === 'sold') {
        throw new MockCommerceError(409, 'LISTING_NOT_EDITABLE', 'Sold listings cannot be edited.');
      }
      const price = validatePrice(payload.price);
      listing.price = price;
      listing.saleLifecycle.lastPriceUpdatedAt = nowIso();
      recordEvent({
        eventId: nextEventId('price'),
        eventType: 'listing_price_updated',
        occurredAt: listing.saleLifecycle.lastPriceUpdatedAt,
        specimenId: listing.specimenId,
        clawId: listing.claw.id,
        listingSlug: listing.slug,
        actorUserId: state.currentUserId,
        summary: `Listing price updated to ${price.formatted}.`,
        price,
      });
      const specimen = getSpecimenOrThrow(listing.specimenId);
      specimen.market.price = { ...price };
      return toListingSnapshot(listing);
    },

    delistListing(slug: string) {
      const listing = getListingOrThrow(slug);
      if (listing.sellerId !== state.currentUserId) {
        throw new MockCommerceError(403, 'NOT_OWNER', 'You can only delist your listings.');
      }
      if (listing.saleState !== 'published') {
        throw new MockCommerceError(409, 'LISTING_NOT_PUBLISHED', 'Listing must be published before delisting.');
      }
      listing.saleState = 'delisted';
      listing.saleLifecycle.delistedAt = nowIso();
      const specimen = getSpecimenOrThrow(listing.specimenId);
      specimen.inventoryState = 'owned';
      specimen.location = 'my-claws';
      specimen.market.saleState = 'not_listed';
      specimen.market.price = null;
      releaseListingBreedingBlock(specimen);
      recordEvent({
        eventId: nextEventId('delist'),
        eventType: 'listing_delisted',
        occurredAt: listing.saleLifecycle.delistedAt,
        specimenId: listing.specimenId,
        clawId: listing.claw.id,
        listingSlug: listing.slug,
        actorUserId: state.currentUserId,
        summary: `${specimen.claw.name} was delisted and returned to inventory.`,
      });
      return toListingSnapshot(listing);
    },

    relistListing(slug: string) {
      const listing = getListingOrThrow(slug);
      if (listing.sellerId !== state.currentUserId) {
        throw new MockCommerceError(403, 'NOT_OWNER', 'You can only relist your listings.');
      }
      if (listing.saleState !== 'delisted') {
        throw new MockCommerceError(409, 'LISTING_NOT_DELISTED', 'Listing must be delisted before relisting.');
      }
      listing.saleState = 'published';
      listing.saleLifecycle.publishedAt = nowIso();
      listing.saleLifecycle.delistedAt = null;
      const specimen = getSpecimenOrThrow(listing.specimenId);
      specimen.inventoryState = 'listed';
      specimen.location = 'market';
      specimen.market.saleState = 'published';
      specimen.market.price = { ...listing.price };
      specimen.activeListingSlug = listing.slug;
      applyListingBreedingBlock(specimen, 'LISTED_FOR_SALE');
      recordEvent({
        eventId: nextEventId('relist'),
        eventType: 'listing_relisted',
        occurredAt: listing.saleLifecycle.publishedAt,
        specimenId: listing.specimenId,
        clawId: listing.claw.id,
        listingSlug: listing.slug,
        actorUserId: state.currentUserId,
        summary: `${specimen.claw.name} was relisted for ${listing.price.formatted}.`,
        price: { ...listing.price },
      });
      return toListingSnapshot(listing);
    },

    purchaseListing(slug: string): MockPurchaseResponse {
      const listing = getListingOrThrow(slug);
      if (listing.saleState === 'sold') {
        throw new MockCommerceError(409, 'LISTING_UNAVAILABLE', 'This listing has already been sold.');
      }
      if (listing.saleState !== 'published') {
        throw new MockCommerceError(409, 'PURCHASE_CONFLICT', 'Listing is not available for purchase.');
      }
      if (listing.sellerId === state.currentUserId) {
        throw new MockCommerceError(400, 'CANNOT_BUY_OWN_LISTING', 'You cannot buy your own listing.');
      }
      const specimen = getSpecimenOrThrow(listing.specimenId);
      specimen.ownerId = state.currentUserId;
      specimen.inventoryState = 'owned';
      specimen.location = 'my-claws';
      specimen.market.saleState = 'not_listed';
      specimen.market.price = null;
      specimen.activeListingSlug = null;
      specimen.breeding.isEligible = true;
      specimen.breeding.reasonCode = null;
      listing.saleState = 'sold';
      listing.saleLifecycle.reservedAt = nowIso();
      listing.saleLifecycle.soldAt = listing.saleLifecycle.reservedAt;
      listing.currentOwnerId = state.currentUserId;
      listing.provenanceSummary.lastTransferEventId = nextEventId('purchase');
      state.listingBySpecimen[specimen.specimenId] = undefined;
      const eventId = listing.provenanceSummary.lastTransferEventId;
      recordEvent({
        eventId,
        eventType: 'purchase_completed',
        occurredAt: listing.saleLifecycle.soldAt!,
        specimenId: specimen.specimenId,
        clawId: specimen.claw.id,
        listingSlug: listing.slug,
        actorUserId: state.currentUserId,
        fromOwnerUserId: listing.sellerId,
        toOwnerUserId: state.currentUserId,
        summary: `${specimen.claw.name} transferred from ${state.users[listing.sellerId].displayName} to ${getCurrentUser().displayName} for ${listing.price.formatted}.`,
        price: { ...listing.price },
      });
      const transfer = {
        specimenId: specimen.specimenId,
        fromOwnerUserId: listing.sellerId,
        toOwnerUserId: state.currentUserId,
        completedAt: listing.saleLifecycle.soldAt!,
      };
      return {
        status: 'completed',
        listing: {
          listingId: listing.listingId,
          slug: listing.slug,
          saleState: listing.saleState,
          price: { ...listing.price },
        },
        transfer,
        buyerReceipt: {
          receiptId: randomUUID(),
          summary: `You purchased ${specimen.claw.name} for ${listing.price.formatted}.`,
          transactionEventId: eventId,
        },
        sellerReceipt: {
          receiptId: randomUUID(),
          summary: `${specimen.claw.name} sold to ${getCurrentUser().displayName} for ${listing.price.formatted}.`,
          transactionEventId: eventId,
        },
      };
    },

    getBreedingEligibility(specimenId: string) {
      const specimen = getSpecimenOrThrow(specimenId);
      ensureCurrentUserOwns(specimen);
      return {
        specimenId: specimen.specimenId,
        ...deepClone(specimen.breeding),
      };
    },

    runBreed(payload: MockBreedRunRequest) {
      const parentA = getSpecimenOrThrow(payload.parentASpecimenId);
      const parentB = getSpecimenOrThrow(payload.parentBSpecimenId);
      ensureCurrentUserOwns(parentA);
      ensureCurrentUserOwns(parentB);
      if (parentA.specimenId === parentB.specimenId) {
        throw new MockCommerceError(400, 'SELF_BREEDING_BLOCKED', 'Select two different specimens.');
      }
      if (!parentA.breeding.isEligible) {
        throw new MockCommerceError(409, parentA.breeding.reasonCode ?? 'BREEDING_BLOCKED', `${parentA.claw.name} is not eligible to breed.`);
      }
      if (!parentB.breeding.isEligible) {
        throw new MockCommerceError(409, parentB.breeding.reasonCode ?? 'BREEDING_BLOCKED', `${parentB.claw.name} is not eligible to breed.`);
      }

      const now = nowIso();
      const cooldownEnds = addHours(now, 24);
      parentA.breeding = {
        isEligible: false,
        reasonCode: 'COOLDOWN_ACTIVE',
        lastBredAt: now,
        cooldownEndsAt: cooldownEnds,
        breedCount: parentA.breeding.breedCount + 1,
      };
      parentB.breeding = {
        isEligible: false,
        reasonCode: 'COOLDOWN_ACTIVE',
        lastBredAt: now,
        cooldownEndsAt: cooldownEnds,
        breedCount: parentB.breeding.breedCount + 1,
      };

      const specimenId = nextSpecimenId();
      const childClaw = cloneClaw(INITIAL_CLAWS[state.counters.specimen % INITIAL_CLAWS.length], {
        id: `claw-${specimenId}`,
        name: payload.breedPrompt ? `${payload.breedPrompt.slice(0, 12)} Hatchling` : `Newborn ${state.counters.specimen}`,
        generation: Math.max(parentA.claw.generation, parentB.claw.generation) + 1,
        lineage: {
          parentA: parentA.claw.id,
          parentB: parentB.claw.id,
          inheritanceMap: parentA.claw.lineage?.inheritanceMap ?? parentB.claw.lineage?.inheritanceMap ?? [],
        },
      });

      const child: InternalSpecimen = {
        specimenId,
        sourceKind: 'bred-child',
        ownerId: state.currentUserId,
        inventoryState: 'newborn',
        location: 'newborn',
        activeListingSlug: null,
        acquiredAt: now,
        claw: childClaw,
        breeding: {
          isEligible: false,
          reasonCode: 'NEWBORN_IMPRINTING',
          lastBredAt: null,
          cooldownEndsAt: null,
          breedCount: 0,
        },
        market: {
          saleState: 'not_listed',
          price: null,
        },
      };
      state.specimens[specimenId] = child;

      const breedRunId = nextBreedRunId();
      const breedEventId = nextEventId('breed');
      recordEvent({
        eventId: breedEventId,
        eventType: 'breed_run_completed',
        occurredAt: now,
        specimenId,
        clawId: childClaw.id,
        actorUserId: state.currentUserId,
        summary: `${childClaw.name} hatched from ${parentA.claw.name} × ${parentB.claw.name}.`,
      });
      const birthEventId = nextEventId('birth');
      recordEvent({
        eventId: birthEventId,
        eventType: 'specimen_born',
        occurredAt: now,
        specimenId,
        clawId: childClaw.id,
        toOwnerUserId: state.currentUserId,
        summary: `${childClaw.name} joined your inventory.`,
      });

      return {
        breedRunId,
        child: toSpecimenResponse(child),
        parentCooldowns: [
          { specimenId: parentA.specimenId, cooldownEndsAt: cooldownEnds },
          { specimenId: parentB.specimenId, cooldownEndsAt: cooldownEnds },
        ],
        nextActions: ['view_child_dossier', 'open_my_claws', 'list_child_for_sale'],
        transactionEventIds: [breedEventId, birthEventId],
      };
    },

    listTransactions() {
      const userId = state.currentUserId;
      const relevant = state.transactions
        .filter((event) =>
          event.actorUserId === userId || event.fromOwnerUserId === userId || event.toOwnerUserId === userId,
        )
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .map((event) => ({ ...event }));
      return { items: relevant } satisfies MockTransactionsResponse;
    },

    getProvenance(clawId: string) {
      const specimen = Object.values(state.specimens).find((entry) => entry.claw.id === clawId);
      if (!specimen) {
        throw new MockCommerceError(404, 'SPECIMEN_NOT_FOUND', 'Specimen not found.');
      }
      const events = state.transactions
        .filter((event) => event.clawId === clawId)
        .slice()
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
        .map((event) => ({ ...event }));
      return {
        clawId,
        specimenId: specimen.specimenId,
        events,
      };
    },
  } satisfies MockCommerceStore;
}
