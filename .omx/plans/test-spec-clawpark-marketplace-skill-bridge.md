# Test Spec — ClawPark Marketplace Skill Bridge

## Automated verification
- `npm run test`
- `npm run lint`
- `npm run build`
- `node --experimental-strip-types server/index.ts`

## Coverage targets
1. Skill ZIP parser extracts metadata and produces an installable ZIP bundle.
2. Unsigned claw ingest creates a public unverified claw listing.
3. Unsigned skill ingest creates a public unverified skill listing.
4. Marketplace UI shows Claw/Skill browse tabs and local-skill publish instructions.
5. Verified claw draft/publish flow remains green.
