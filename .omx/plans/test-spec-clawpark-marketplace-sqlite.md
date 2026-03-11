# Test Spec — ClawPark SQLite Marketplace Upload

## Automated verification
- `npm run test`
- `npm run lint`
- `npm run build`
- runtime smoke: `node --experimental-strip-types server/index.ts`

## Coverage targets
1. Valid workspace ZIP parses into normalized draft data.
2. Restricted files are rejected.
3. Authenticated user can create, update, and publish a draft.
4. Published listing is returned by browse API.
5. Bundle download returns normalized JSON.
6. Marketplace UI shows remote listings and the publish login gate.
7. Existing breed/lineage/gallery tests stay green.
