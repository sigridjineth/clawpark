# ClawPark TODO — What remains to reach a CryptoKitties-like loop

This file tracks the remaining work to make ClawPark behave more like a real CryptoKitties-style product where users can publish their own Claws, sell them, buy them, and breed owned specimens over time.

## Current baseline

### Already implemented
- [x] Claw gallery and breeding flow
- [x] Child reveal, doctrine, transcript, and lineage
- [x] SQLite-backed marketplace server
- [x] Verified Claw publishing via Discord-authenticated draft flow
- [x] Unverified local-skill publishing for Claws and Skills
- [x] Claim/import flow for Claw listings
- [x] Local example bundles for one Claw and two Skills
- [x] Seed marketplace data wired to checked-in examples

### Not yet implemented
- [ ] Real ownership model
- [ ] Listing inventory and sale state
- [ ] Purchase flow and transfer of ownership
- [ ] Breeding permissions based on ownership
- [ ] Price model / auction / sale mechanics
- [ ] Persistent per-user portfolio across sessions
- [ ] Live seller dashboard
- [ ] Marketplace search, filters, and sorting
- [ ] Anti-spam / moderation / fraud controls
- [ ] Production-grade deploy and ops

---

## Phase 1 — Real ownership and inventory
- [ ] Add a first-class `owners` / `inventory` model in SQLite
- [ ] Distinguish between:
  - [ ] published listing
  - [ ] owned specimen
  - [ ] claimed local copy
- [ ] Decide whether ownership is app-native only or wallet/on-chain backed
- [ ] Add listing states:
  - [ ] draft
  - [ ] published
  - [ ] reserved
  - [ ] sold
  - [ ] delisted
- [ ] Track who currently owns each Claw
- [ ] Track whether a listed Claw is still eligible for breeding

## Phase 2 — Selling and buying
- [ ] Add seller-side listing creation for owned Claws
- [ ] Add price fields and sale metadata
- [ ] Support fixed-price sales first
- [ ] Add buyer-side purchase flow
- [ ] Transfer ownership after successful purchase
- [ ] Prevent duplicate purchase / stale inventory races
- [ ] Show listing history: created, price changed, sold, transferred
- [ ] Add seller receipts and buyer receipts

## Phase 3 — CryptoKitties-style breeding rules
- [ ] Restrict breeding to Claws the user owns or is explicitly allowed to use
- [ ] Add breeding eligibility state per Claw
- [ ] Add cooldown / recovery model after breeding
- [ ] Add parent usage counters and breeding history
- [ ] Prevent invalid pairings:
  - [ ] self-breeding
  - [ ] unavailable / sold / delisted parent
  - [ ] blocked lineage combinations if needed
- [ ] Persist child ownership at birth
- [ ] Let newborn Claws enter inventory automatically
- [ ] Allow the owner to list newborn Claws for sale

## Phase 4 — Marketplace UX that feels like a product, not a demo
- [ ] Add Claw detail pages with:
  - [ ] seller
  - [ ] owner
  - [ ] status
  - [ ] price
  - [ ] lineage
  - [ ] breeding availability
- [ ] Add seller profile / stable page
- [ ] Add portfolio page for "My Claws"
- [ ] Add listing management actions:
  - [ ] publish
  - [ ] edit price
  - [ ] delist
  - [ ] relist
- [ ] Add browse controls:
  - [ ] sort by newest
  - [ ] sort by price
  - [ ] sort by generation
  - [ ] filter by archetype / soul / skill
- [ ] Add transaction feedback and empty states
- [ ] Add mobile treatment for Claw detail, listing, and purchase flow

## Phase 5 — Trust, security, and moderation
- [ ] Remove or heavily restrict unsigned public publish in shared production mode
- [ ] Add authenticated publisher tokens for local skill publishing
- [ ] Add rate limiting for publish / purchase endpoints
- [ ] Add file scanning / stricter validation for uploaded bundles
- [ ] Add audit logs for publish, delist, purchase, and breed actions
- [ ] Add admin moderation controls for abusive or fake listings
- [ ] Add soft-delete / quarantine for suspicious uploads

## Phase 6 — Economics and advanced marketplace behavior
- [ ] Decide economic model:
  - [ ] fixed price only
  - [ ] offer / bid system
  - [ ] timed auctions
- [ ] Add marketplace fees / revenue split rules if needed
- [ ] Add rarity / provenance signals
- [ ] Add generation-based pricing hints
- [ ] Add demand signals (watchlist, favorites, recent sales)
- [ ] Add sale analytics for sellers

## Phase 7 — Production infrastructure
- [ ] Move bundle storage from local disk to durable object storage if needed
- [ ] Add real session / auth hardening
- [ ] Add background jobs for previews, cleanup, and reprocessing
- [ ] Add DB migrations instead of ad hoc schema evolution
- [ ] Add observability:
  - [ ] request logs
  - [ ] error monitoring
  - [ ] metrics
- [ ] Add backup / restore strategy for SQLite or move to Postgres when needed

## Phase 8 — QA and release readiness
- [ ] Add end-to-end tests for:
  - [ ] publish
  - [ ] list for sale
  - [ ] buy
  - [ ] breed owned Claws
  - [ ] relist child Claw
- [ ] Add regression tests for inventory transfer and race conditions
- [ ] Add visual QA for marketplace detail pages
- [ ] Add manual test checklist for seller and buyer flows
- [ ] Run a full demo script from publish → sale → breed → relist

---

## Recommended build order

### Best next 5 tasks
1. [ ] Add SQLite ownership + inventory tables
2. [ ] Add fixed-price listing + purchase flow
3. [ ] Tie breeding eligibility to owned inventory
4. [ ] Create a "My Claws" seller dashboard
5. [ ] Replace unsigned public publish with authenticated publisher-token flow

### After that
6. [ ] Add cooldowns and parent availability rules
7. [ ] Add listing detail page with price + lineage + owner info
8. [ ] Add search/filter/sort for marketplace browse
9. [ ] Add receipts / sale history / provenance
10. [ ] Add end-to-end tests for the full market loop

---

## Product definition of done for the "CryptoKitties-like" milestone
- [ ] A user can publish their own Claw
- [ ] Another user can buy that Claw
- [ ] Ownership transfers correctly
- [ ] Owned Claws can be bred under valid rules
- [ ] The child is minted into the owner inventory
- [ ] The child can be listed for sale again
- [ ] All state survives refresh / restart
- [ ] The marketplace is safe enough for public use
