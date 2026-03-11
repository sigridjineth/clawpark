# Tech Spec — ClawPark SQLite Marketplace Upload

## Runtime
- Frontend: React + Vite
- Backend: Node HTTP server using `node --experimental-strip-types`
- Persistence: `node:sqlite`
- Artifact storage: JSON bundles on disk under `marketplace-data/`

## Server contracts
- `GET /api/auth/session`
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`
- `POST /api/marketplace/drafts`
- `GET /api/marketplace/drafts/:id`
- `PATCH /api/marketplace/drafts/:id`
- `POST /api/marketplace/drafts/:id/publish`
- `GET /api/marketplace/listings`
- `GET /api/marketplace/listings/:slug`
- `GET /api/marketplace/listings/:slug/bundle`

## SQLite tables
- `users`
- `drafts`
- `listings`
- `listing_versions`

## Bundle model
- Upload input: OpenClaw workspace ZIP.
- Published output: normalized JSON bundle with:
  - `manifest`
  - `claw`

## Frontend integration
- Marketplace browse loads from API, with seed fallback when API is offline.
- Publish tab handles Discord login state, ZIP upload, draft review, and publish.
- Download action saves the normalized bundle locally.
- Claim action imports the normalized `Claw` into gallery state.

## Parser rules
- Require `IDENTITY.md` and `SOUL.md`.
- Map workspace text heuristically into existing ClawPark `Identity / Soul / Skills / Tools` dimensions.
- Infer tools from skills when `TOOLS.md` is missing.
