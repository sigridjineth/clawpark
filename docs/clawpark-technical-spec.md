# ClawPark — Technical Specification

## Stack
- **Language**: TypeScript
- **Frontend**: React 18
- **Build**: Vite 5
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Backend**: Node HTTP server with `node --experimental-strip-types`
- **Persistence**: SQLite via `node:sqlite`
- **Tests**: Vitest + Testing Library

The product currently runs as:
- a React SPA frontend,
- a lightweight Node/SQLite marketplace server,
- optional local publisher tooling for OpenClaw users.

---

## High-level architecture

### Frontend responsibilities
- render gallery, breed lab, birth, lineage, and marketplace views,
- manage breeding flow state,
- render Claw dossier detail panels,
- talk to the marketplace API,
- import/export bundle artifacts.

### Backend responsibilities
- manage verified and unverified marketplace publish flows,
- parse uploaded OpenClaw bundles,
- store marketplace metadata in SQLite,
- store listing artifacts on disk,
- serve listing browse/detail/download endpoints,
- handle Discord OAuth for verified Claw publishing.

### Local integration responsibilities
- package a workspace or skill folder on the OpenClaw side,
- upload it to the marketplace ingest API,
- provide a Moltbot-style publish surface.

---

## Frontend module map

### Core app
- `src/App.tsx`
  - top-level screen router
  - gallery / breedLab / birth / lineage / marketplace

### State
- `src/store/useClawStore.ts`
  - gallery selection
  - breed prompt and parent conversation
  - prediction and breed result
  - birth phase and navigation state
  - local gallery persistence

### Genome engine
- `src/engine/breed.ts`
- `src/engine/inherit.ts`
- `src/engine/mutate.ts`
- `src/engine/predict.ts`
- `src/engine/openclaw.ts`
- `src/engine/visual.ts`

These modules cover:
- trait inheritance,
- skill inheritance,
- tool derivation,
- mutation,
- doctrine generation,
- talk-profile generation,
- prediction panel data,
- visual identity synthesis.

### Gallery + dossiers
- `src/components/Gallery/Gallery.tsx`
- `src/components/Gallery/ClawCard.tsx`
- `src/components/Gallery/ClawDossier.tsx`

Current behavior:
- clicking a card opens a detailed inline dossier,
- selecting a Claw for breeding is a separate explicit action,
- dossiers expose Identity / Soul / Skills / Tools in detail.

### Marketplace
- `src/components/Marketplace/Marketplace.tsx`
- `src/services/marketplaceApi.ts`
- `src/services/marketplaceSeed.ts`
- `src/utils/clawIO.ts`

Current behavior:
- browse claws and skills,
- verified publish flow for Claws,
- local-skill publish instructions,
- download and claim behavior by listing type,
- offline seed fallback based on checked-in examples.

---

## Core domain model

### Claw
Defined in `src/types/claw.ts`.

A `Claw` includes:
- `id`
- `name`
- `archetype`
- `generation`
- `identity`
- `soul.traits`
- `skills.badges`
- optional `tools.loadout`
- `visual`
- `intro`
- `lineage`

### Breeding metadata
- `InheritanceRecord`
- `ConversationTurn`
- `ChildDoctrine`
- `ClawLineage`

These power:
- trait provenance,
- parent dialogue,
- child doctrine,
- recursive lineage visualization.

### Marketplace model
Defined in `src/types/marketplace.ts`.

The marketplace uses a discriminated union:
- `MarketplaceClawListing`
- `MarketplaceSkillListing`

Important metadata:
- `kind: 'claw' | 'skill'`
- `trust: 'verified' | 'unsigned'`
- `publisherMode: 'discord-session' | 'local-skill'`

Artifacts:
- `ClawBundle`
- `SkillBundle`
- `ClawBundleManifest`
- `SkillBundleManifest`

---

## Marketplace server

### Server entrypoints
- `server/index.ts`
- `server/db.ts`
- `server/marketplaceStore.ts`
- `server/openclawParser.ts`
- `server/discord.ts`
- `server/sessions.ts`
- `server/http.ts`
- `server/config.ts`

### Verified publish flow
Managed publish remains **Claw-only** and uses Discord-authenticated web upload.

Endpoints:
- `GET /api/auth/session`
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`
- `POST /api/marketplace/drafts`
- `GET /api/marketplace/drafts/:id`
- `PATCH /api/marketplace/drafts/:id`
- `POST /api/marketplace/drafts/:id/publish`

### Unverified local-skill ingest flow
Endpoints:
- `POST /api/marketplace/ingest/claw`
- `POST /api/marketplace/ingest/skill`

Rules:
- public,
- unsigned,
- create-only,
- no overwrite/update of existing listings,
- always marked `Unverified` in the UI.

### Browse and download
- `GET /api/marketplace/listings`
- `GET /api/marketplace/listings/:slug`
- `GET /api/marketplace/listings/:slug/bundle`
- `POST /api/marketplace/listings/:slug/install`

Bundle behavior:
- Claw listing → JSON bundle
- Skill listing → ZIP bundle

Install behavior:
- Skill listing install target defaults to `./skills/<slug>` in the active OpenClaw workspace
- `MARKETPLACE_SKILL_INSTALL_DIR="$HOME/.openclaw/skills"` switches the install root to the shared OpenClaw skills directory
- install is safe by default and returns a conflict until overwrite is explicitly requested

---

## Parser behavior

### Workspace ZIP parser
`parseOpenClawWorkspaceZip()` accepts:
- `IDENTITY.md`
- `SOUL.md`
- optional `TOOLS.md`
- optional `skills/*/SKILL.md`

It rejects restricted content like:
- `AGENTS.md`
- `USER.md`
- `.env*`
- memory/log artifacts
- path traversal entries

It produces:
- a normalized public `Claw`
- a `ClawBundleManifest`

### Skill ZIP parser
`parseOpenClawSkillZip()` requires:
- `SKILL.md`

Optional allowlist:
- `README.md`
- `scripts/**`
- `assets/**`
- `references/**`

It produces:
- a `PublishedSkill`
- a `SkillBundleManifest`
- a sanitized ZIP artifact for download/install

---

## Checked-in local example bundles
The repo now contains checked-in local examples under:
- `integrations/openclaw-marketplace-examples/meridian-claw`
- `integrations/openclaw-marketplace-examples/park-audit-skill`
- `integrations/openclaw-marketplace-examples/containment-launch-skill`

These are used for:
- local seed marketplace data,
- parser regression coverage,
- realistic examples for local publishing,
- marketplace fixture documentation.

---

## Seed marketplace strategy
`src/services/marketplaceSeed.ts` is no longer generic placeholder content.

It now:
- exports `MARKETPLACE_SEED_FIXTURE_ROOT`
- exports `MARKETPLACE_SEED_FIXTURES`
- maps seed marketplace content directly to checked-in example fixtures
- keeps the offline demo registry consistent with parser/test fixtures

This reduces drift between:
- docs,
- demo mode,
- parser tests,
- marketplace fallback UI.

---

## Local OpenClaw integration
The repo includes an installable local publisher skill:
- `integrations/openclaw-marketplace-publisher/SKILL.md`
- `integrations/openclaw-marketplace-publisher/publish_marketplace.py`

Supported commands:
- publish current workspace as a Claw listing
- publish a standalone skill folder as a Skill listing

Required environment:
- `CLAWPARK_MARKETPLACE_URL`

This integration is intentionally lightweight and uses Python standard library packaging rather than adding a JS zip dependency.

---

## Testing and verification
Current automated coverage includes:
- gallery and breeding shell contracts,
- OpenClaw genome contracts,
- lineage contracts,
- marketplace API contracts,
- parser contracts,
- local example bundle regression tests.

Key tests:
- `tests/marketplace.contract.spec.ts`
- `tests/server/marketplace-api.spec.ts`
- `tests/server/openclaw-parser.spec.ts`
- `tests/server/openclaw-example-bundles.spec.ts`
- `tests/openclaw-genome.contract.spec.ts`
- `tests/ui-shell.contract.spec.ts`

Standard verification commands:
```bash
npm run test
npm run lint
npm run build
node --experimental-strip-types server/index.ts
```

---

## Known technical limits
- unsigned public publish is intentionally weak from a trust perspective,
- `node:sqlite` is still experimental in Node 25,
- artifact storage is local disk-based,
- the parser is heuristic, not a full OpenClaw runtime interpreter,
- the marketplace is not yet a true sell/buy/ownership system.

Those future steps are tracked in `TODO(task).md`.
