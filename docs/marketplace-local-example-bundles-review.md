# Marketplace local example bundles review

Reviewed on March 11, 2026.

## Target bundle set

The current marketplace bridge work naturally clusters around three local OpenClaw-style examples:

1. **Meridian** — a workspace-style Claw bundle used to verify the managed draft → publish flow.
2. **Park Audit** — a standalone skill bundle used to verify unsigned local-skill publish and install hints.
3. **Containment Launch** — a second standalone skill bundle that exercises script + asset metadata in seed listings.

## What the code currently supports

- `server/openclawParser.ts` accepts a single wrapped top-level directory in uploaded ZIPs, so public example archives can be imported without repacking first.
- Claw uploads are normalized into public JSON bundles (`kind: "claw"`).
- Skill uploads are sanitized and re-zipped into installable artifacts (`kind: "skill"`).
- `src/types/marketplace.ts` and `src/components/Marketplace/Marketplace.tsx` now distinguish:
  - listing `kind`
  - listing `trust`
  - publisher mode
  - claimable Claw bundles vs installable skill bundles

## Seed + test mapping

- `tests/server/marketplace-api.spec.ts` covers:
  - verified Claw draft/publish/download
  - unsigned Claw ingest
  - unsigned skill ingest
- `tests/server/openclaw-parser.spec.ts` covers:
  - workspace bundle normalization
  - skill bundle normalization
  - restricted file rejection
- `tests/marketplace.contract.spec.ts` covers:
  - Browse Claws / Browse Skills tabs
  - unverified badges
  - local-skill install instructions

## Review finding

The marketplace model and tests now reflect the three-example direction, but the repository still synthesizes the example metadata inline in `src/services/marketplaceSeed.ts`. There are not yet checked-in example bundle fixtures under a dedicated repo path such as `examples/` or `integrations/examples/`.

That means the feature contract is mostly in code/tests today, not in reusable sample assets yet.

## Recommended follow-up

If the team wants the repo to literally contain the three local example bundles, the next safe step is:

1. add checked-in example bundle source folders for Meridian / Park Audit / Containment Launch
2. derive seed metadata from those fixtures instead of duplicating strings inline
3. keep the current parser/tests as the compatibility guardrail

## Verification snapshot

- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/server/openclaw-parser.spec.ts tests/server/marketplace-api.spec.ts tests/marketplace.contract.spec.ts`
