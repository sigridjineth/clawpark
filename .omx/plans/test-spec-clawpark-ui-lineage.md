# Test Spec — ClawPark UI Simplification + Full Lineage

## Automated Verification
- `npm run test` passes
- `npm run lint` passes
- `npm run build` passes

## Coverage Targets
1. Add lineage helper tests proving multi-generation ancestor extraction/layout data works.
2. Preserve existing breed/store contract tests.

## Manual QA Targets
- Gallery feels visually lighter and primary CTA remains obvious
- Breed Lab shows prediction clearly without excess instructional copy
- Birth screen remains readable with reduced chrome
- If a child is bred from a prior child, lineage view shows grandparent ancestry
