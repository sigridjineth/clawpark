import type { Claw } from './claw';

export type MockSpecimenSourceKind = 'published-listing' | 'bred-child' | 'claimed-import' | 'registry-copy';
export type MockInventoryState = 'owned' | 'listed' | 'reserved_for_transfer' | 'sold' | 'newborn';
export type MockSaleState = 'not_listed' | 'published' | 'reserved' | 'sold' | 'delisted';

export interface MockUserIdentity {
  userId: string;
  displayName: string;
  handle: string;
}

export interface MockPortfolioCounts {
  owned: number;
  listed: number;
  cooldown: number;
  newborn: number;
}

export interface MockPortfolioSummary {
  ownedCount: number;
  listedCount: number;
  breedableCount: number;
  cooldownCount: number;
}

export interface MockMeResponse extends MockUserIdentity {
  portfolio: MockPortfolioSummary;
  featureFlags: Record<string, boolean>;
}

export interface MockMeSummaryResponse {
  portfolio: MockPortfolioSummary;
}

export interface MockPrice {
  amount: number;
  currency: string;
  formatted: string;
}

export interface MockSaleLifecycle {
  publishedAt: string | null;
  reservedAt: string | null;
  soldAt: string | null;
  delistedAt: string | null;
  lastPriceUpdatedAt: string | null;
}

export interface MockBreedingStatus {
  isEligible: boolean;
  reasonCode: string | null;
  lastBredAt: string | null;
  cooldownEndsAt: string | null;
  breedCount: number;
}

export interface MockMarketStatus {
  saleState: MockSaleState;
  listingSlug: string | null;
  price: MockPrice | null;
}

export interface MockInventorySpecimen {
  specimenId: string;
  sourceKind: MockSpecimenSourceKind;
  owner: MockUserIdentity;
  inventoryState: MockInventoryState;
  location: 'my-claws' | 'market' | 'newborn';
  activeListingId: string | null;
  acquiredAt: string;
  claw: Claw;
  breeding: MockBreedingStatus;
  market: MockMarketStatus;
}

export interface MockInventoryResponse {
  items: MockInventorySpecimen[];
  counts: MockPortfolioCounts;
}

export interface MockSpecimenDetailResponse {
  specimen: MockInventorySpecimen;
  listing: MockListingSnapshot | null;
  recentEvents: MockTransactionEvent[];
}

export interface MockListingSnapshot {
  listingId: string;
  slug: string;
  specimenId: string;
  saleState: MockSaleState;
  seller: MockUserIdentity;
  owner: MockUserIdentity;
  price: MockPrice;
  saleLifecycle: MockSaleLifecycle;
  breedStatus: Pick<MockBreedingStatus, 'isEligible' | 'reasonCode' | 'cooldownEndsAt'>;
  provenanceSummary: {
    birthEventId: string | null;
    lastTransferEventId: string | null;
    eventCount: number;
  };
  claw: Claw;
}

export interface MockListingMutationRequest {
  specimenId: string;
  price: {
    amount: number;
    currency?: string;
  };
}

export interface MockListingPriceUpdateRequest {
  price: {
    amount: number;
    currency?: string;
  };
}

export interface MockPurchaseResponse {
  status: 'completed' | 'failed';
  listing: Pick<MockListingSnapshot, 'listingId' | 'slug' | 'saleState' | 'price'>;
  transfer: {
    specimenId: string;
    fromOwnerUserId: string;
    toOwnerUserId: string;
    completedAt: string;
  };
  buyerReceipt: {
    receiptId: string;
    summary: string;
    transactionEventId: string;
  };
  sellerReceipt: {
    receiptId: string;
    summary: string;
    transactionEventId: string;
  };
}

export interface MockBreedRunRequest {
  parentASpecimenId: string;
  parentBSpecimenId: string;
  preferredTraitId?: string;
  breedPrompt?: string;
}

export interface MockBreedRunResponse {
  breedRunId: string;
  child: MockInventorySpecimen;
  parentCooldowns: Array<{
    specimenId: string;
    cooldownEndsAt: string;
  }>;
  nextActions: string[];
  transactionEventIds: string[];
}

export interface MockTransactionEvent {
  eventId: string;
  eventType:
    | 'published'
    | 'listed_for_sale'
    | 'listing_price_updated'
    | 'listing_delisted'
    | 'listing_relisted'
    | 'purchase_completed'
    | 'breed_run_completed'
    | 'specimen_born'
    | 'transfer_recorded';
  occurredAt: string;
  specimenId: string;
  clawId: string;
  listingSlug?: string | null;
  actorUserId?: string | null;
  fromOwnerUserId?: string | null;
  toOwnerUserId?: string | null;
  summary: string;
  price?: MockPrice | null;
}

export interface MockTransactionsResponse {
  items: MockTransactionEvent[];
}

export interface MockProvenanceResponse {
  clawId: string;
  specimenId: string;
  events: MockTransactionEvent[];
}
