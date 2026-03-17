# ClawPark mock API scenarios

Date: March 16, 2026
Owner: worker-1
Scope: scenario-driven mock API contract for the next ownership, inventory, sale, breeding, and provenance loop.

## Why this document exists

ClawPark already supports gallery browsing, breeding, reveal, lineage, marketplace browsing, verified Claw publish, and unsigned local-skill publish. The current backend does **not** yet model a true sell/buy/ownership system, and the current frontend still treats owned specimens as a local gallery concept rather than a persistent inventory.

The next product milestone in `TODO(task).md` requires frontend and backend teams to build in parallel around the same stateful contract for:

- **My Claws** inventory
- seller listing management
- buy flow
- ownership transfer
- breeding eligibility and cooldowns
- newborn placement into inventory
- transaction history and provenance

This document defines a **mock API contract** for those flows so UI and server work can move now, before the production-grade ownership model, race handling, auth hardening, and persistence strategy are finalized.

## Inputs used for this spec

This spec is grounded in the current repository state:

- `docs/clawpark-product-spec.md`
- `docs/clawpark-technical-spec.md`
- `TODO(task).md`
- `src/types/claw.ts`
- `src/types/marketplace.ts`
- `src/components/Marketplace/Marketplace.tsx`
- `server/index.ts`
- `server/db.ts`
- `server/marketplaceStore.ts`
- `tests/server/marketplace-api.spec.ts`

## Why the mock API is needed now

The current app already exposes the right nouns, but not the right state machine.

### Already true today
- Gallery stores local Claws and passes them to Marketplace as `ownedClaws`.
- Marketplace listings expose `kind`, `trust`, `publisherMode`, `publisher`, `claw`, `manifest`, and download URLs.
- Backend storage already has users, drafts, listings, listing versions, and artifacts.
- Publish and browse endpoints already exist under `/api/marketplace/*`.

### Not true yet
- There is no first-class **inventory** record per user.
- `owner_user_id` currently means listing owner/publisher, not commerce ownership history.
- There is no **sale state** (`published`, `reserved`, `sold`, `delisted`) on a listing.
- There is no purchase endpoint, reservation window, or transfer event.
- There is no breeding eligibility endpoint, cooldown state, or newborn placement contract.
- There is no transaction or provenance API for seller/buyer receipts and history views.

The mock API should fill those gaps with deterministic, stateful responses while staying close to the future production shape.

## Product and domain assumptions

These assumptions keep the mock small and useful. They should be explicit so frontend work does not accidentally depend on unstated behavior.

1. **Specimen, listing, and publisher are separate concepts.**
   - A **specimen** is the owned Claw instance in inventory.
   - A **listing** is a sale wrapper around a specimen.
   - A **publisher** is who originally published the bundle into the marketplace.
   - A **seller** is the current owner listing the specimen for sale.

2. **Reuse current marketplace terms where possible.**
   - Keep `kind`, `trust`, `publisherMode`, `publisher`, `claw`, `manifest`, and `bundleDownloadUrl` from `src/types/marketplace.ts`.
   - Add commerce fields rather than replacing the current listing payload.

3. **`My Claws` is the canonical inventory view.**
   - It includes purchased Claws, bred children, published-but-still-owned specimens, and local claimed/imported copies.
   - The frontend should not infer ownership from local gallery membership alone once the mock API is present.

4. **A listed specimen is not breedable while actively for sale.**
   - `saleState = published` or `reserved` makes a specimen unavailable for breeding.
   - `saleState = delisted` returns the specimen to owner inventory if cooldown rules allow it.

5. **Breed cooldown applies to the specimen, not the listing.**
   - Cooldown survives delist/relist.
   - Cooldown is visible both in `My Claws` and marketplace detail.

6. **Breeding creates a new specimen instance.**
   - The child keeps the repo's existing `Claw` genome shape.
   - The child is inserted directly into owner inventory with `sourceKind = bred-child`.

7. **The mock API is session-aware but may use seeded identities.**
   - A lightweight `currentUserId` model is enough for now.
   - Authentication hardening is a later step.

8. **All timestamps are ISO-8601 UTC strings.**
9. **All IDs are stable strings.**
10. **Mock responses should be deterministic for the same seed data and action sequence.**

## Compatibility notes with current repo contracts

The mock should stay close to the repo's current marketplace model so the eventual production migration is mostly additive.

| Current contract | Mock guidance | Why |
| --- | --- | --- |
| `MarketplaceClawListing.publisher` | Keep as the original publisher identity. Add separate `seller` and `owner` fields. | Resale can diverge from original publish attribution. |
| `GET /api/marketplace/listings/:slug` | Keep slug-based detail routes for compatibility. | The current server already resolves listing detail and bundle download by slug. |
| `claimable` on claw listings | Keep for the current registry flow, but do not use it as a proxy for commerce ownership. | Claim/import and ownership transfer are different actions. |
| local gallery `ownedClaws` prop | Replace progressively with `/api/my/claws` responses. | The UI needs persistent inventory state, not inferred local state. |
| `Claw` genome payload | Reuse unchanged inside all inventory, listing, and newborn responses. | Breed, dossier, and lineage UI already depend on this shape. |

## Recommended mock domain model

### 1. Inventory specimen

```json
{
  "specimenId": "spec_ridgeback_001",
  "clawId": "claw-ridgeback-001",
  "sourceKind": "published-listing",
  "owner": {
    "userId": "user_sigrid",
    "displayName": "Sigrid",
    "handle": "@sigrid"
  },
  "inventoryState": "owned",
  "location": "my-claws",
  "activeListingId": null,
  "acquiredAt": "2026-03-16T18:10:00.000Z",
  "claw": {
    "id": "claw-ridgeback-001",
    "name": "Meridian",
    "archetype": "Cartographer",
    "generation": 2
  },
  "breeding": {
    "isEligible": true,
    "reasonCode": null,
    "lastBredAt": null,
    "cooldownEndsAt": null,
    "breedCount": 0
  }
}
```

### 2. Commerce listing extension

Extend the current claw listing payload with the following fields:

```json
{
  "listingId": "listing_meridian_001",
  "saleState": "published",
  "seller": {
    "userId": "user_sigrid",
    "displayName": "Sigrid",
    "handle": "@sigrid"
  },
  "owner": {
    "userId": "user_sigrid",
    "displayName": "Sigrid",
    "handle": "@sigrid"
  },
  "specimenId": "spec_ridgeback_001",
  "price": {
    "amount": 120,
    "currency": "USD",
    "formatted": "$120"
  },
  "saleLifecycle": {
    "publishedAt": "2026-03-16T18:12:00.000Z",
    "reservedAt": null,
    "soldAt": null,
    "delistedAt": null,
    "lastPriceUpdatedAt": "2026-03-16T18:12:00.000Z"
  },
  "breedStatus": {
    "isEligible": false,
    "reasonCode": "LISTED_FOR_SALE",
    "cooldownEndsAt": null
  },
  "provenanceSummary": {
    "birthEventId": "breed_evt_201",
    "lastTransferEventId": "purchase_evt_903",
    "eventCount": 6
  }
}
```

### 3. Transaction / provenance event

Use one shared event shape for receipts, timeline cards, and specimen provenance.

```json
{
  "eventId": "evt_purchase_903",
  "eventType": "purchase_completed",
  "occurredAt": "2026-03-16T18:20:00.000Z",
  "specimenId": "spec_ridgeback_001",
  "clawId": "claw-ridgeback-001",
  "listingId": "listing_meridian_001",
  "actorUserId": "user_buyer_01",
  "fromOwnerUserId": "user_sigrid",
  "toOwnerUserId": "user_buyer_01",
  "price": {
    "amount": 120,
    "currency": "USD"
  },
  "summary": "Meridian transferred from Sigrid to Park Ranger for $120.",
  "metadata": {
    "saleStateBefore": "reserved",
    "saleStateAfter": "sold"
  }
}
```

## Scenario catalog

| ID | Scenario | Why it matters now | Main API surface |
| --- | --- | --- | --- |
| S1 | Hydrate **My Claws** portfolio | Frontend needs a real inventory page instead of reusing local gallery state. | `GET /api/my/claws` |
| S2 | Open owned specimen detail | UI needs owner, sale, lineage, and breedability in one place. | `GET /api/my/claws/:specimenId` |
| S3 | Seller lists a Claw for sale | Seller management UI needs first-class list-for-sale state. | `POST /api/marketplace/listings` |
| S4 | Seller edits price | UI needs optimistic update and price history behavior. | `PATCH /api/marketplace/listings/:listingSlug` |
| S5 | Seller delists a Claw | Seller portfolio needs reversible removal from public sale. | `POST /api/marketplace/listings/:listingSlug/delist` |
| S6 | Seller relists a Claw | Post-delist return path should not require a fresh specimen import. | `POST /api/marketplace/listings/:listingSlug/relist` |
| S7 | Buyer completes purchase | Buy flow, receipt UI, and transfer handling depend on it. | `POST /api/marketplace/listings/:listingSlug/purchase` |
| S8 | Reject stale/double purchase | Frontend needs a deterministic error path for race conditions. | purchase endpoint + errors |
| S9 | Check breeding eligibility | Breed Lab entry and CTA gating need a single source of truth. | `GET /api/breeding/eligibility` |
| S10 | Breed two owned parents | Child creation, cooldowns, and inventory placement must land together. | `POST /api/breeding/runs` |
| S11 | Show newborn in inventory and prompt relist | Birth flow needs a next step that matches the roadmap. | breed run response + `GET /api/my/claws` |
| S12 | View transaction and provenance history | Buyer/seller receipts and specimen timelines need shared events. | `GET /api/my/transactions`, `GET /api/claws/:clawId/provenance` |

## Recommended endpoint set

The mock should prefer **future-looking production paths** rather than a throwaway `/api/mock/*` namespace. If a separate mock router is needed internally, it should still serve the payloads below.

### Session and actor context

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/me` | Return current user identity, portfolio counts, and feature flags. |
| `GET` | `/api/me/summary` | Lightweight header payload for nav badges: owned count, listed count, breedable count, pending receipts. |

Example response:

```json
{
  "userId": "user_sigrid",
  "displayName": "Sigrid",
  "handle": "@sigrid",
  "portfolio": {
    "ownedCount": 7,
    "listedCount": 2,
    "breedableCount": 4,
    "cooldownCount": 1
  },
  "featureFlags": {
    "mockCommerce": true,
    "sellerManagement": true,
    "buyFlow": true
  }
}
```

### Inventory / My Claws

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/my/claws` | Portfolio list for the **My Claws** page. Support filters like `inventoryState`, `breedable`, `sourceKind`. |
| `GET` | `/api/my/claws/:specimenId` | Owned specimen detail with listing snapshot, breeding status, lineage summary, and recent events. |
| `GET` | `/api/my/claws/:specimenId/activity` | Optional focused timeline for one specimen. |

Example `GET /api/my/claws` response:

```json
{
  "items": [
    {
      "specimenId": "spec_ridgeback_001",
      "sourceKind": "published-listing",
      "inventoryState": "owned",
      "location": "my-claws",
      "activeListingId": null,
      "claw": {
        "id": "claw-ridgeback-001",
        "name": "Meridian",
        "archetype": "Cartographer",
        "generation": 2
      },
      "owner": {
        "userId": "user_sigrid",
        "displayName": "Sigrid",
        "handle": "@sigrid"
      },
      "breeding": {
        "isEligible": true,
        "reasonCode": null,
        "cooldownEndsAt": null,
        "breedCount": 0
      },
      "market": {
        "saleState": "not_listed",
        "price": null
      }
    }
  ],
  "counts": {
    "owned": 7,
    "listed": 2,
    "cooldown": 1,
    "newborn": 1
  }
}
```

### Marketplace browse + seller management

Keep the current browse endpoints and extend them.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/marketplace/listings` | Existing browse endpoint, extended with commerce fields for claw listings. |
| `GET` | `/api/marketplace/listings/:listingSlug` | Existing detail endpoint, extended with owner/seller/sale/breed data. |
| `POST` | `/api/marketplace/listings` | Create a sale listing from an owned specimen. |
| `PATCH` | `/api/marketplace/listings/:listingSlug` | Edit list price or seller note. |
| `POST` | `/api/marketplace/listings/:listingSlug/delist` | Move listing from `published` to `delisted`. |
| `POST` | `/api/marketplace/listings/:listingSlug/relist` | Move listing from `delisted` back to `published`. |

Recommended create request:

```json
{
  "specimenId": "spec_ridgeback_001",
  "price": {
    "amount": 120,
    "currency": "USD"
  }
}
```

Recommended create response:

```json
{
  "listingId": "listing_meridian_001",
  "specimenId": "spec_ridgeback_001",
  "saleState": "published",
  "price": {
    "amount": 120,
    "currency": "USD",
    "formatted": "$120"
  },
  "seller": {
    "userId": "user_sigrid",
    "displayName": "Sigrid",
    "handle": "@sigrid"
  },
  "breedStatus": {
    "isEligible": false,
    "reasonCode": "LISTED_FOR_SALE",
    "cooldownEndsAt": null
  }
}
```

### Buy flow

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/marketplace/listings/:listingSlug/purchase` | Reserve, complete transfer, and return both buyer and seller receipts. |
| `GET` | `/api/my/purchases` | Buyer-facing receipt list if the UI wants a dedicated screen. |
| `GET` | `/api/my/sales` | Seller-facing receipt list if the UI wants a dedicated screen. |

Recommended purchase response:

```json
{
  "status": "completed",
  "listing": {
    "listingId": "listing_meridian_001",
    "saleState": "sold"
  },
  "transfer": {
    "specimenId": "spec_ridgeback_001",
    "fromOwnerUserId": "user_sigrid",
    "toOwnerUserId": "user_ranger",
    "completedAt": "2026-03-16T18:20:00.000Z"
  },
  "buyerReceipt": {
    "receiptId": "receipt_buy_001",
    "summary": "You purchased Meridian for $120.",
    "transactionEventId": "evt_purchase_903"
  },
  "sellerReceipt": {
    "receiptId": "receipt_sell_001",
    "summary": "Meridian sold to Park Ranger for $120.",
    "transactionEventId": "evt_purchase_903"
  }
}
```

### Breeding eligibility and breed run

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/breeding/eligibility?specimenId=:id` | Single-parent status chip and detail drawer. |
| `POST` | `/api/breeding/check` | Pair-level validation before showing the final breed CTA. |
| `POST` | `/api/breeding/runs` | Execute breed, start cooldowns, create child, and attach inventory placement data. |

Recommended pair check request:

```json
{
  "parentASpecimenId": "spec_ridgeback_001",
  "parentBSpecimenId": "spec_orchid_002"
}
```

Recommended pair check response:

```json
{
  "isEligible": true,
  "blockingReason": null,
  "parentA": {
    "specimenId": "spec_ridgeback_001",
    "isEligible": true,
    "reasonCode": null,
    "cooldownEndsAt": null
  },
  "parentB": {
    "specimenId": "spec_orchid_002",
    "isEligible": true,
    "reasonCode": null,
    "cooldownEndsAt": null
  }
}
```

Recommended breed run request:

```json
{
  "parentASpecimenId": "spec_ridgeback_001",
  "parentBSpecimenId": "spec_orchid_002",
  "preferredTraitId": "trait-cartography",
  "breedPrompt": "Preserve strong route-finding and enclosure safety instincts."
}
```

Recommended breed run response:

```json
{
  "breedRunId": "breed_run_301",
  "child": {
    "specimenId": "spec_newborn_301",
    "sourceKind": "bred-child",
    "inventoryState": "owned",
    "location": "newborn",
    "owner": {
      "userId": "user_sigrid",
      "displayName": "Sigrid",
      "handle": "@sigrid"
    },
    "claw": {
      "id": "claw-newborn-301",
      "name": "Northglass",
      "archetype": "Containment Cartographer",
      "generation": 3
    }
  },
  "parentCooldowns": [
    {
      "specimenId": "spec_ridgeback_001",
      "cooldownEndsAt": "2026-03-17T18:22:00.000Z"
    },
    {
      "specimenId": "spec_orchid_002",
      "cooldownEndsAt": "2026-03-17T18:22:00.000Z"
    }
  ],
  "nextActions": [
    "view_child_dossier",
    "open_my_claws",
    "list_child_for_sale"
  ],
  "transactionEventIds": [
    "evt_breed_301",
    "evt_birth_302"
  ]
}
```

### Transactions and provenance

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/my/transactions` | Cross-specimen buyer/seller/breeder event feed. |
| `GET` | `/api/claws/:clawId/provenance` | Full provenance timeline for a Claw/specimen detail page. |
| `GET` | `/api/marketplace/listings/:listingSlug/history` | Optional listing-only history for seller admin or detail pages. |

Recommended provenance response:

```json
{
  "clawId": "claw-ridgeback-001",
  "specimenId": "spec_ridgeback_001",
  "events": [
    {
      "eventId": "evt_publish_101",
      "eventType": "published",
      "occurredAt": "2026-03-15T12:00:00.000Z",
      "summary": "Meridian was published to the registry."
    },
    {
      "eventId": "evt_list_201",
      "eventType": "listed_for_sale",
      "occurredAt": "2026-03-16T18:12:00.000Z",
      "summary": "Sigrid listed Meridian for $120."
    },
    {
      "eventId": "evt_purchase_903",
      "eventType": "purchase_completed",
      "occurredAt": "2026-03-16T18:20:00.000Z",
      "summary": "Meridian transferred from Sigrid to Park Ranger for $120."
    }
  ]
}
```

## State transitions

### Listing sale state

| From | Event | To | Notes |
| --- | --- | --- | --- |
| `not_listed` | seller creates listing | `published` | Specimen gets `activeListingId`; breeding blocked. |
| `published` | buyer starts purchase | `reserved` | Optional short reservation window for optimistic UI. |
| `reserved` | payment/transfer completes | `sold` | Ownership transfers; listing becomes historical. |
| `published` | seller delists | `delisted` | Specimen returns to owner inventory. |
| `delisted` | seller relists | `published` | Reuse same listing id if possible for simpler history. |
| `reserved` | purchase fails/expires | `published` | Clear stale reservation. |

### Inventory state

| From | Event | To | Notes |
| --- | --- | --- | --- |
| `owned` | seller lists | `listed` | UI should surface “For sale”. |
| `listed` | seller delists | `owned` | Breedability still depends on cooldown. |
| `listed` | buyer reserves | `reserved_for_transfer` | Prevent duplicate purchase and breeding. |
| `reserved_for_transfer` | transfer completes | `sold` | Seller no longer sees it in active inventory. |
| `reserved_for_transfer` | transfer fails | `listed` | Restore prior state. |
| `newborn` | first portfolio refresh or dismissal | `owned` | Keeps the birth flow special without inventing a second storage model. |

### Breeding status

| Condition | `isEligible` | `reasonCode` |
| --- | --- | --- |
| owned, not listed, not cooling down | `true` | `null` |
| listed for sale | `false` | `LISTED_FOR_SALE` |
| reserved for transfer | `false` | `RESERVED_FOR_TRANSFER` |
| sold / not owned | `false` | `NOT_OWNED` |
| cooldown active | `false` | `COOLDOWN_ACTIVE` |
| same specimen chosen twice | `false` | `SELF_BREEDING_BLOCKED` |
| lineage rule violation (if enabled later) | `false` | `LINEAGE_BLOCKED` |

## Validation and error cases

The mock API should be opinionated enough to exercise real UI states.

| Case | Status | Error code | Expected UI use |
| --- | --- | --- | --- |
| Seller lists a specimen they do not own | `403` | `NOT_OWNER` | Disable seller CTA and show ownership error. |
| Seller lists a specimen already listed | `409` | `ALREADY_LISTED` | Prevent duplicate list-for-sale mutation. |
| Seller edits a sold listing | `409` | `LISTING_NOT_EDITABLE` | Show stale state and refresh listing. |
| Buyer purchases their own listing | `400` | `CANNOT_BUY_OWN_LISTING` | Disable self-purchase button. |
| Buyer purchases a delisted listing | `409` | `LISTING_UNAVAILABLE` | Show toast and refetch. |
| Buyer loses a race on a reserved/sold listing | `409` | `PURCHASE_CONFLICT` | Surface “already sold” state. |
| Breed check with one parent on cooldown | `409` | `COOLDOWN_ACTIVE` | Show cooldown countdown. |
| Breed check with a listed parent | `409` | `LISTED_FOR_SALE` | Push seller to delist before breeding. |
| Breed request with same specimen twice | `400` | `SELF_BREEDING_BLOCKED` | Inline validation before submit. |
| Provenance lookup for missing specimen | `404` | `SPECIMEN_NOT_FOUND` | Empty/error detail state. |

Recommended error envelope:

```json
{
  "error": {
    "code": "PURCHASE_CONFLICT",
    "message": "This listing was already sold or reserved by another buyer.",
    "details": {
      "listingId": "listing_meridian_001",
      "saleState": "sold"
    }
  }
}
```

## Mock data expectations

The mock dataset should demonstrate the full lifecycle, not just isolated cards.

### Minimum seeded users
- `user_sigrid` — seller/breeder
- `user_ranger` — buyer
- `user_curator` — second seller for browse realism

### Minimum seeded specimens
- 2 owned-and-breedable Claws for the current user
- 1 owned Claw already on cooldown
- 1 owned Claw already listed for sale
- 1 public listing owned by another user and available to buy
- 1 sold listing kept for history/provenance regression
- 1 bred child already present in inventory as a newborn example

### Minimum seeded histories
- at least one full chain: **publish → list → purchase → transfer**
- at least one breeding chain: **owned parents → breed → child created → child appears in My Claws**
- at least one seller management chain: **list → edit price → delist → relist**

### Determinism requirements
- The same seed should return the same listing order, IDs, and timestamps unless a mutation endpoint changes state.
- Mutations should be persisted for the life of the dev server process, not reset on every request.
- Resetting mock state should be an explicit dev action, not an incidental hot reload side effect.

## Suggested implementation order

1. **Shared read models first**
   - `GET /api/me`
   - `GET /api/my/claws`
   - extend `GET /api/marketplace/listings`

2. **Seller management next**
   - create listing
   - edit price
   - delist
   - relist

3. **Buy flow after seller state exists**
   - purchase endpoint
   - buyer/seller receipts
   - sale/reservation error paths

4. **Breeding contract after ownership exists**
   - single-parent eligibility
   - pair check
   - breed run with cooldown + child placement

5. **History and provenance last**
   - transaction feed
   - specimen provenance timeline
   - listing history detail

This order lets frontend build:
1. My Claws page
2. marketplace detail with owner/seller/price/breedability
3. seller management controls
4. buy flow states
5. post-birth child placement and relist CTA

## Non-goals for this mock phase

These should stay out of the mock unless a later milestone explicitly needs them:

- real payment processing
- wallet or on-chain ownership
- production auth/token hardening
- moderation workflows
- auction mechanics
- multi-currency pricing
- full migration strategy beyond mock persistence

## Recommended success criteria

The mock API is successful when the frontend can demo one clean path:

1. open **My Claws**
2. list a specimen for sale
3. buy a different specimen
4. see ownership transfer and receipts
5. breed two owned specimens
6. see the child appear in inventory
7. relist the child

That path matches the roadmap in `TODO(task).md` and gives both frontend and backend teams a shared contract before the production system is hardened.
