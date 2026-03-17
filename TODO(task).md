# ClawPark TODO — Team-split roadmap for a CryptoKitties-like product

This document rewrites the remaining work as a team-split task list.
The goal is to make ClawPark behave more like a real CryptoKitties-style product where users can:
- publish their own Claws,
- browse and evaluate listings,
- buy and own specimens,
- breed owned specimens,
- list offspring back into the marketplace.

---

## Today's action item

### Goal for today
- Build shared understanding of the product gap between the current prototype and the real market loop.
- Split the work clearly between **Frontend** and **Backend** so the team can execute in parallel.
- Keep the current prototype stable while defining the next production milestone.

### What is already true today
- Claw gallery, breeding, reveal, doctrine, and lineage exist.
- The marketplace exists with SQLite-backed listings.
- Verified Claw publish exists through Discord-authenticated web flow.
- Unverified local-skill publish exists for Claws and Skills.
- Local example bundles exist and seed marketplace data is wired to them.
- Claw detail inspection from the gallery now exists.

### What is not true yet
- Users do not really own or transfer Claws in a persistent commerce model.
- Listings are not yet a real for-sale inventory system.
- Buying, selling, delisting, and transfer are not implemented.
- Breeding is not yet tied to ownership and breeding availability rules.

---

## Status update — mock commerce milestone snapshot

This section records what has now been implemented in the repository as a **mock / integration layer**.
It is intentionally separate from the production roadmap below.

### Completed in the current mock milestone

#### Backend / server
- [x] Added a stateful in-memory mock commerce layer.
- [x] Added mock inventory / portfolio endpoints:
  - [x] `GET /api/me`
  - [x] `GET /api/me/summary`
  - [x] `GET /api/my/claws`
  - [x] `GET /api/my/claws/:specimenId`
  - [x] `GET /api/my/claws/:specimenId/activity`
  - [x] `GET /api/my/transactions`
  - [x] `GET /api/claws/:clawId/provenance`
- [x] Added mock seller mutation endpoints:
  - [x] `POST /api/marketplace/listings`
  - [x] `PATCH /api/marketplace/listings/:slug`
  - [x] `POST /api/marketplace/listings/:slug/delist`
  - [x] `POST /api/marketplace/listings/:slug/relist`
  - [x] `POST /api/marketplace/listings/:slug/purchase`
- [x] Added mock breeding endpoints:
  - [x] `GET /api/breeding/eligibility`
  - [x] `POST /api/breeding/runs`
- [x] Added `GET /api/marketplace/mock-listings` for mock public commerce browse.
- [x] Added shared mock commerce types in `src/types/mockCommerce.ts`.
- [x] Added focused server regression coverage in `tests/server/mock-commerce.spec.ts`.

#### Frontend / integration
- [x] Extended `src/services/marketplaceApi.ts` with client helpers for the mock commerce endpoints.
- [x] Extended `src/components/Marketplace/Marketplace.tsx` to include:
  - [x] `My Claws` / portfolio tab
  - [x] seller actions
  - [x] buy flow
  - [x] transaction feed
  - [x] specimen inspection / provenance surface
  - [x] mock breeding panel
- [x] Kept the existing browse / publish flows working while adding mock commerce UI.
- [x] Updated `tests/marketplace.contract.spec.ts` to cover the integrated browse + portfolio + seller + buy + breed + publish path.

#### Documentation / planning
- [x] Added `docs/clawpark-mock-api-scenarios.md`.
- [x] Captured the current implementation snapshot and next work in `.omx/plans/plan-clawpark-mock-commerce-integration.md`.

### Important limits of the current milestone
- [ ] Ownership, inventory, and commerce state are still **mock / in-memory**, not durable SQLite production state.
- [ ] Frontend still combines remote mock inventory and local gallery sync instead of using one fully unified persistent source of truth.
- [ ] Real auth hardening, race handling, migrations, and production trust controls are still pending.

### Files added / changed for this mock milestone
- `docs/clawpark-mock-api-scenarios.md`
- `server/index.ts`
- `server/mockCommerceStore.ts`
- `src/types/mockCommerce.ts`
- `src/services/marketplaceApi.ts`
- `src/components/Marketplace/Marketplace.tsx`
- `tests/server/mock-commerce.spec.ts`
- `tests/marketplace.contract.spec.ts`

---

## Team split

# Backend Team TODO

## 1. Ownership and inventory
- [ ] Add a first-class ownership model in SQLite.
- [ ] Add inventory records for each user.
- [ ] Distinguish clearly between:
  - [ ] published listing
  - [ ] owned specimen
  - [ ] local claimed/imported copy
- [ ] Add Claw ownership transfer logic.
- [ ] Persist child ownership at birth.

## 2. Marketplace sale model
- [ ] Add listing sale states:
  - [ ] draft
  - [ ] published
  - [ ] reserved
  - [ ] sold
  - [ ] delisted
- [ ] Add fixed-price listing fields first.
- [ ] Add purchase transaction endpoint.
- [ ] Transfer ownership on successful purchase.
- [ ] Prevent double-purchase and stale sale races.
- [ ] Record sale history and provenance.

## 3. Breeding rules tied to ownership
- [ ] Restrict breeding to owned or explicitly permitted Claws.
- [ ] Add breeding eligibility state per Claw.
- [ ] Add cooldown / recovery rules after breeding.
- [ ] Track breeding count and parent usage history.
- [ ] Reject invalid pairings:
  - [ ] self-breeding
  - [ ] unavailable parent
  - [ ] sold parent
  - [ ] delisted parent
  - [ ] blocked lineage combinations if needed
- [ ] Automatically place newborn Claws into owner inventory.

## 4. Publish trust and security
- [ ] Replace public unsigned publishing with authenticated publisher-token flow for production.
- [ ] Keep unsigned publishing only for local/dev/demo if needed.
- [ ] Add rate limiting for publish and purchase endpoints.
- [ ] Harden bundle validation and file scanning.
- [ ] Add audit logs for publish, delist, buy, transfer, and breed actions.
- [ ] Add moderation/quarantine hooks for suspicious listings.

## 5. Persistence and ops
- [ ] Replace ad hoc SQLite schema changes with real migrations.
- [ ] Add durable backup/restore strategy.
- [ ] Decide when to move from SQLite to Postgres.
- [ ] Move artifact storage from local disk if multi-host deployment is needed.
- [ ] Add monitoring, metrics, and request logging.

---

# Frontend Team TODO

## 1. Marketplace browsing and listing detail
- [ ] Add full Claw detail pages for marketplace listings.
- [ ] Show:
  - [ ] owner
  - [ ] seller
  - [ ] listing status
  - [ ] price
  - [ ] generation
  - [ ] lineage
  - [ ] breeding availability
- [ ] Add dedicated skill detail pages.
- [ ] Make listing detail pages feel like collectible specimen pages, not raw admin cards.

## 2. Seller and buyer UX
- [ ] Add a **My Claws** / portfolio page.
- [ ] Add seller listing management UI:
  - [ ] list for sale
  - [ ] edit price
  - [ ] delist
  - [ ] relist
- [ ] Add buyer purchase flow UI.
- [ ] Add purchase confirmation, loading, and failure states.
- [ ] Add seller receipt and buyer receipt views.

## 3. Browse controls and discovery
- [ ] Add sorting:
  - [ ] newest
  - [ ] price
  - [ ] generation
  - [ ] rarity if supported later
- [ ] Add filters:
  - [ ] archetype
  - [ ] soul traits
  - [ ] skills
  - [ ] generation
  - [ ] listing status
- [ ] Add search by name / slug.
- [ ] Add favorites / watchlist if time allows.

## 4. Breeding UX for owned specimens
- [ ] Make owned vs unowned status visible in the gallery and marketplace.
- [ ] Show whether a Claw is breedable right now.
- [ ] Add cooldown indicators in UI.
- [ ] Add clear feedback when breeding is blocked.
- [ ] Add newborn inventory placement and next-step CTAs.
- [ ] Add “list this child for sale” action after birth/save flow.

## 5. Product polish
- [ ] Unify gallery detail dossier and marketplace detail experience.
- [ ] Improve mobile behavior for listing detail, purchase, and breed flows.
- [ ] Add empty states for no listings / no owned Claws / no eligible parents.
- [ ] Add clearer transaction and ownership feedback across the app.

---

# Shared / Integration TODO

## 1. Contract alignment
- [ ] Lock backend listing/ownership schema before building full seller UI.
- [ ] Define one shared source of truth for:
  - [ ] ownership
  - [ ] sale status
  - [ ] breeding eligibility
  - [ ] transaction history
- [ ] Add explicit frontend/backend contracts for listing detail and purchase APIs.

## 2. Test coverage
- [ ] Add end-to-end tests for:
  - [ ] publish a Claw
  - [ ] list a Claw for sale
  - [ ] buy a Claw
  - [ ] transfer ownership
  - [ ] breed owned Claws
  - [ ] list child Claw for sale
- [ ] Add race-condition regression tests for purchase and inventory transfer.
- [ ] Add visual QA checks for listing detail and seller flows.

## 3. Demo readiness
- [ ] Build one clean demo path:
  - [ ] publish
  - [ ] browse
  - [ ] buy
  - [ ] breed
  - [ ] relist child
- [ ] Prepare a seeded demo dataset that shows parent → sale → child → resale lifecycle.

---

## Suggested next milestone

### Best next backend tasks
1. [ ] Add ownership + inventory tables
2. [ ] Add fixed-price listing + purchase endpoints
3. [ ] Tie breeding eligibility to owned inventory
4. [ ] Add transaction history / provenance records
5. [ ] Replace unsigned public publishing with publisher-token auth

### Best next frontend tasks
1. [ ] Build My Claws / seller portfolio page
2. [ ] Build marketplace Claw detail page with price + owner + lineage
3. [ ] Add buy flow UI and receipts
4. [ ] Show breeding eligibility/cooldown in the gallery
5. [ ] Add post-birth “list this child” seller flow

---

## Definition of done for the CryptoKitties-like milestone
- [ ] A user can publish their own Claw
- [ ] Another user can buy that Claw
- [ ] Ownership transfers correctly and persists
- [ ] Owned Claws can breed under valid rules
- [ ] The child is added to the owner inventory
- [ ] The child can be listed again for sale
- [ ] Listing, ownership, and breeding state survives refresh/restart
- [ ] The marketplace is safe enough to expose to real users
