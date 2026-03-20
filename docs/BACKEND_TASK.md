# Backend Task Tracker — ClawPark

**Snapshot:** March 19, 2026
**Source of truth:** current code in `server/`, `src/types/`, and `tests/server/`

This file is now a practical **DONE / TODO tracker** based on what the backend already ships today.

---

## Current backend snapshot

The backend currently exposes **three API surfaces**:
1. **`/api/v1/*`** — specimen import, home, lineage, breeding runs, proposals, and Discord/web breeding intents
2. **`/api/*` marketplace + auth** — Discord OAuth, verified drafts, unsigned ingest, listing bundle download, skill install, OpenAPI HTML docs
3. **`/api/*` mock-commerce** — portfolio, listing mutations, purchase, provenance, and mock breeding endpoints backed by an in-memory store

---

## DONE

### Core persistence and stores
- [x] SQLite bootstrap exists in `server/db.ts`.
- [x] SQLite-backed users / drafts / listings / listing_versions tables exist for marketplace flows.
- [x] SQLite-backed import/specimen/breeding/proposal/provenance tables exist for `/api/v1` flows.
- [x] `server/specimenStore.ts` implements import, claim, list, get, breeding runs, proposals, and lineage helpers.
- [x] `server/marketplaceStore.ts` implements verified draft + listing persistence.
- [x] `server/mockCommerceStore.ts` implements the current mock portfolio / sale / breed state machine.

### `/api/v1` product endpoints
- [x] `GET /api/v1/home`
- [x] `POST /api/v1/imports/openclaw`
- [x] `GET /api/v1/imports/:id`
- [x] `POST /api/v1/specimens/:id/claim`
- [x] `GET /api/v1/specimens`
- [x] `GET /api/v1/specimens/:id`
- [x] `GET /api/v1/lineages/:id`
- [x] `GET /api/v1/breeding/eligibility`
- [x] `POST /api/v1/breeding/runs`
- [x] `GET /api/v1/breeding/runs/:id`
- [x] `POST /api/v1/breeding/runs/:id/save`
- [x] `POST /api/v1/discord/intents`
- [x] `GET /api/v1/discord/intents/:id`
- [x] `POST /api/v1/breeding/proposals`
- [x] `POST /api/v1/breeding/proposals/:id/consent`

### Marketplace / auth endpoints
- [x] Discord OAuth session routes exist: `/api/auth/session`, `/api/auth/discord/start`, `/api/auth/discord/callback`, `/api/auth/logout`.
- [x] Verified marketplace draft flow exists: `POST /api/marketplace/drafts`, `PATCH /api/marketplace/drafts/:id`, `POST /api/marketplace/drafts/:id/publish`.
- [x] Unsigned public ingest exists for claws and skills.
- [x] Listing download exists through `/api/marketplace/listings/:slug/bundle`.
- [x] Skill install exists through `/api/marketplace/listings/:slug/install` with overwrite conflict handling.
- [x] OpenAPI JSON + HTML docs exist at `/api/openapi.json` and `/api/docs`.

### Mock-commerce endpoints
- [x] Portfolio summary routes exist: `/api/me`, `/api/me/summary`, `/api/my/claws`, `/api/my/claws/:specimenId`, `/api/my/claws/:specimenId/activity`, `/api/my/transactions`.
- [x] Public mock marketplace browse exists at `/api/marketplace/mock-listings`.
- [x] Seller mutation routes exist: create listing, patch price, delist, relist.
- [x] Purchase flow exists at `/api/marketplace/listings/:slug/purchase`.
- [x] Provenance route exists at `/api/claws/:clawId/provenance`.
- [x] Mock breeding routes exist at `/api/breeding/eligibility` and `/api/breeding/runs`.

### Parsing / Discord orchestration / verification
- [x] OpenClaw workspace ZIP parsing exists in `server/openclawParser.ts`.
- [x] OpenClaw skill ZIP parsing exists in `server/openclawParser.ts`.
- [x] Restricted-file skip/warning behavior exists in parser coverage.
- [x] Discord message intent parsing exists in `server/discordIntent.ts`.
- [x] Breeding orchestration lifecycle exists in `server/breedingOrchestrator.ts`.
- [x] Discord bot wiring exists in `server/discord-bot.ts`.
- [x] Server regression coverage exists in `tests/server/marketplace-api.spec.ts`, `tests/server/mock-commerce.spec.ts`, and `tests/server/openclaw-parser.spec.ts`.
- [x] End-to-end `/api/v1` breeding flow coverage exists in `tests/server/v1-breeding-flow.spec.ts`.

---

## TODO

### P0 — close contract and data-shape gaps
- [ ] Keep response schemas across stores and routes aligned so frontend types can stay authoritative without ad hoc normalization drift.

### P0 — harden mock-commerce beyond a demo layer
- [ ] Persist mock-commerce state instead of resetting on server restart.
- [ ] Add auth / actor enforcement for seller, buyer, and breeding mutations that are currently open demo endpoints.
- [ ] Add ownership validation that consistently ties listing mutations, purchases, and breeding rights to the acting user.

### P0 — unify breeding orchestration paths
- [ ] Connect `/api/v1` web breeding flows more tightly to the richer consent/orchestration lifecycle already used by the Discord bot.
- [ ] Decide whether `server/breedingOrchestrator.ts` becomes the shared backend engine for web + Discord, or remains Discord-only.
- [ ] Normalize consent timeout / proposal behavior between `server/specimenStore.ts` and `server/breedingConsent.ts`.

### P1 — persistence and schema hygiene
- [x] Replace ad hoc `ensureColumn(...)` schema evolution with explicit migrations.
- [x] Add backup / restore guidance for SQLite-backed data.
- [ ] Add better provenance persistence for imports, claims, transfers, and breed runs.
- [ ] Review whether breeding run rows should persist conversation / prediction JSON instead of leaving them null.

### P1 — safety and operational hardening
- [ ] Add rate limits for upload, publish, install, purchase, and breed mutation endpoints.
- [ ] Add more explicit upload quotas / file size / file type validation around ingest endpoints.
- [ ] Add audit logging for publish, install, list, delist, relist, purchase, and breed mutations.
- [ ] Harden unsigned ingest so public/demo behavior is clearly separated from production-safe behavior.

### P2 — future product work
- [ ] Decide whether marketplace inventory and specimen ownership should converge into one durable domain model.
- [ ] Decide when mock-commerce graduates into a real SQLite-backed commerce model.
- [ ] Evaluate whether artifact storage should move off local disk for multi-host deployment.

---

## Known backend drift worth tracking
- Mock-commerce is intentionally in-memory and currently behaves like a demo/integration harness, not a production persistence model.

---

## Suggested GitHub issues
- [x] #10 — Expand API docs / OpenAPI coverage to include `/api/v1` and mock-commerce routes
- [ ] #11 — Persist mock-commerce state and add actor/ownership enforcement
- [ ] #13 — Unify web breeding flows with the richer Discord orchestration lifecycle
- [x] #14 — Replace ad hoc SQLite schema evolution with explicit migrations and backup/restore guidance
- [ ] #18 — Harden upload/install/purchase/breed endpoints with limits, validation, and audit logging
- [x] #6 — Add end-to-end server tests for the `/api/v1` breeding flow
