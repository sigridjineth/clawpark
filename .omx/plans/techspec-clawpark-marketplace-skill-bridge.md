# Tech Spec — ClawPark Marketplace Skill Bridge

## Data model
- `MarketplaceListing` becomes a discriminated union:
  - `MarketplaceClawListing`
  - `MarketplaceSkillListing`
- Listing metadata now includes:
  - `kind`
  - `trust`
  - `publisherMode`
- Skill artifact model includes:
  - `name`
  - `slug`
  - `description`
  - `summary`
  - `entrypoint`
  - `scriptFiles`
  - `assetFiles`
  - `referenceFiles`

## Server routes
- Existing verified claw draft flow remains.
- Add:
  - `POST /api/marketplace/ingest/claw`
  - `POST /api/marketplace/ingest/skill`
- Bundle download remains:
  - `GET /api/marketplace/listings/:slug/bundle`

## Parser rules
- Claw ZIP:
  - `IDENTITY.md`
  - `SOUL.md`
  - optional `TOOLS.md`
  - optional `skills/*/SKILL.md`
- Skill ZIP:
  - required `SKILL.md`
  - optional `README.md`, `scripts/**`, `assets/**`, `references/**`
- Restricted files remain denied in both flows.

## Local integration artifact
- Ship an installable OpenClaw skill under `integrations/openclaw-marketplace-publisher/`.
- The skill uses a local Python publisher script to package and upload bundles to the marketplace server.
