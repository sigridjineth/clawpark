# ClawPark Mock Commerce API

**Snapshot:** March 19, 2026
**Source of truth:** `server/mockCommerceStore.ts`, `src/types/mockCommerce.ts`, `src/services/marketplaceApi.ts`

This document is the accurate reference for the current **mock / demo commerce API**. It replaces the earlier `/api/v1` placeholder spec.

---

## Important behavior

- **Base path:** `/api`
- **Persistence:** in-memory only — resets on server restart
- **Auth:** current mock-commerce endpoints are effectively open demo endpoints
- **Best use:** frontend integration, UI prototyping, and contract tests

The seeded mock world currently includes example specimens such as:
- `spec_ridgeback_002`
- `spec_orchid_003`
- `spec_solstice_201`
- `listing_solstice_201`

---

## Data model reference

Canonical TypeScript contracts live in:
- `src/types/mockCommerce.ts`

Key concepts:
- `MockInventorySpecimen`
- `MockListingSnapshot`
- `MockBreedingStatus`
- `MockPurchaseResponse`
- `MockBreedRunResponse`
- `MockTransactionEvent`

---

## Endpoint map

### Session + portfolio

#### `GET /api/me`
Returns the current demo identity, portfolio summary, and feature flags.

#### `GET /api/me/summary`
Returns only the portfolio summary.

#### `GET /api/my/claws`
Returns inventory items plus aggregate counts.

Supported query params:
- `inventoryState`
- `breedable=true|false`
- `sourceKind`

Example:
```bash
curl "http://localhost:8787/api/my/claws?inventoryState=owned&breedable=true"
```

#### `GET /api/my/claws/:specimenId`
Returns specimen detail, its active listing (if any), and recent events.

#### `GET /api/my/claws/:specimenId/activity`
Returns activity events for that specimen only.

#### `GET /api/my/transactions`
Returns the transaction/event feed.

---

### Public mock marketplace

#### `GET /api/marketplace/mock-listings`
Returns the current public mock listings used by the browse UI.

---

### Seller mutations

#### `POST /api/marketplace/listings`
Create a listing for an owned specimen.

Request body:
```json
{
  "specimenId": "spec_ridgeback_002",
  "price": { "amount": 185, "currency": "USD" }
}
```

#### `PATCH /api/marketplace/listings/:slug`
Update a listing price.

Request body:
```json
{
  "price": { "amount": 210, "currency": "USD" }
}
```

#### `POST /api/marketplace/listings/:slug/delist`
Marks the listing as delisted.

#### `POST /api/marketplace/listings/:slug/relist`
Re-publishes a delisted listing.

---

### Buyer mutation

#### `POST /api/marketplace/listings/:slug/purchase`
Completes a mock purchase, transfers ownership, updates sale state, and emits buyer/seller receipts.

Example:
```bash
curl -X POST http://localhost:8787/api/marketplace/listings/listing_solstice_201/purchase
```

---

### Mock breeding

#### `GET /api/breeding/eligibility?specimenId=...`
Returns breeding eligibility for one owned specimen in the mock portfolio domain.

Example:
```bash
curl "http://localhost:8787/api/breeding/eligibility?specimenId=spec_ridgeback_002"
```

#### `POST /api/breeding/runs`
Runs a mock breeding flow between two owned mock specimens.

Request body:
```json
{
  "parentASpecimenId": "spec_ridgeback_002",
  "parentBSpecimenId": "spec_orchid_003",
  "preferredTraitId": "trait-caution",
  "breedPrompt": "Raise a resilient child who can survive the park."
}
```

Response highlights:
- `breedRunId`
- `child`
- `parentCooldowns`
- `nextActions`
- `transactionEventIds`

---

### Provenance

#### `GET /api/claws/:clawId/provenance`
Returns provenance / transaction events for a claw.

Example:
```bash
curl http://localhost:8787/api/claws/claw-ridgeback-002/provenance
```

---

## Example scenarios

### 1. Load the portfolio shell
```bash
curl http://localhost:8787/api/me
curl http://localhost:8787/api/my/claws
curl http://localhost:8787/api/my/transactions
```

### 2. List one owned specimen for sale
```bash
curl -X POST http://localhost:8787/api/marketplace/listings \
  -H 'Content-Type: application/json' \
  -d '{"specimenId":"spec_ridgeback_002","price":{"amount":185}}'
```

### 3. Buy a specimen from another seller
```bash
curl -X POST http://localhost:8787/api/marketplace/listings/listing_solstice_201/purchase
```

### 4. Breed two owned specimens
```bash
curl -X POST http://localhost:8787/api/breeding/runs \
  -H 'Content-Type: application/json' \
  -d '{"parentASpecimenId":"spec_ridgeback_002","parentBSpecimenId":"spec_orchid_003","breedPrompt":"Northglass"}'
```

---

## Known limitations

- State is not durable.
- The current actor is a seeded demo user from `server/mockCommerceStore.ts`.
- Seller, buyer, and breeder mutations are not yet auth-gated.
- This API intentionally overlaps with real marketplace concepts, but it is still a mock integration surface.
