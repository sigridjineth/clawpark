# Test Spec — ClawPark

## Verification Targets
- `npm run build` succeeds
- `npm run test` succeeds for engine/store smoke tests
- `npm run lint` succeeds

## Minimum Automated Coverage
1. `breed()` returns child with generation increment and inheritance map.
2. Duplicate parental traits/skills are strongly inherited and recorded.
3. Mutation logic obeys deterministic seed/demo mode guarantee.
4. Prediction output returns probabilities and archetype guess.
5. Store flow adds child back to gallery after breeding.

## Manual QA
- Gallery selection and deselection behavior
- Preferred trait changes prediction panel values
- Birth sequence completes through reveal and CTAs
- Lineage view shows both parents, child, inherited labels, and mutation marker when present
- `?demo=true` highlights demo behavior and deterministic first breed

## Risks to Check
- Tailwind + animation setup in fresh scaffold
- Timer cleanup across birth phases
- Seeded RNG consistency
- Responsive layout for all screens
