# Plan — ClawPark Mock Commerce Integration Snapshot

## Objective
Record the repository state after the mock commerce backend and frontend integration work so future implementation can continue from a clear checkpoint.

## What is implemented now

### Backend / API
- Added an in-memory mock commerce store in `server/mockCommerceStore.ts`.
- Added mock portfolio, listing-mutation, purchase, breeding, transaction, and provenance endpoints in `server/index.ts`.
- Added mock commerce payload types in `src/types/mockCommerce.ts`.
- Added focused server coverage in `tests/server/mock-commerce.spec.ts`.

### Frontend / UI
- Added mock commerce API client helpers in `src/services/marketplaceApi.ts`.
- Extended `src/components/Marketplace/Marketplace.tsx` with:
  - `My Claws` / portfolio tab
  - seller listing actions
  - buy flow
  - transaction feed
  - specimen inspection / provenance views
  - mock breeding controls
- Updated `tests/marketplace.contract.spec.ts` to exercise the integrated UI path.

### Documentation
- Added `docs/clawpark-mock-api-scenarios.md`.
- Updated `TODO(task).md` with a mock-commerce milestone snapshot.

## Verified commands
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Current product meaning of the mock layer
This is an integration milestone, not the final production commerce system.

The repo now supports a usable **mock** loop for:
1. viewing owned inventory,
2. listing owned specimens for sale,
3. buying mock public listings,
4. running a mock breed flow,
5. seeing newborn and transaction/provenance feedback.

## Known limits
- State is in-memory and resets with server restart.
- SQLite ownership/inventory tables are not implemented yet.
- Gallery and remote mock inventory are still bridged, not fully unified.
- Real auth, moderation, rate limits, and race-proof purchase semantics remain future work.

## Recommended next production steps
1. Replace in-memory ownership and listing state with SQLite tables and migrations.
2. Introduce a single durable ownership/inventory source of truth.
3. Convert purchase flow from mock transitions to persisted transaction records.
4. Tie breeding eligibility and cooldowns to persisted ownership state.
5. Move the Marketplace mega-component into smaller portfolio / listing / receipt / breed subcomponents.
6. Add post-birth "list this child" UX in Birth / Lineage flows.
7. Add stronger end-to-end tests around purchase, transfer, and relist-child scenarios.

## Recommended frontend follow-up
- Extract `My Claws` / portfolio UI into dedicated subcomponents or a dedicated screen.
- Add richer receipt / provenance detail panels.
- Add filters and sorting for the portfolio and public listing views.
- Reduce duplication between registry browse cards and mock commerce cards.

## Recommended backend follow-up
- Define `ownership`, `inventory`, `transactions`, and `listing_sale_state` persistence contracts.
- Introduce resettable seeded dev fixtures backed by SQLite instead of process memory.
- Separate mock-only routes from production-grade routes where appropriate.
