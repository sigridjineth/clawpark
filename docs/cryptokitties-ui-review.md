# ClawPark CryptoKitties-style UI Review

Date: March 10, 2026
Owner: worker-3
References:
- `.omx/plans/prd-clawpark-cryptokitties-ui.md`
- `.omx/plans/test-spec-clawpark-cryptokitties-ui.md`

## Baseline verification

- `npm run test` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS

## Review summary

The current app already has the right feature surface: gallery selection, Breed Lab prediction, animated birth, and recursive lineage. The main gap versus the target direction is presentation, not logic.

## Directional gaps to preserve while redesigning

### 1. Global shell
- Current shell is dark, neon, and stepper-heavy.
- Target shell should feel lighter, softer, and more browse-first.
- Keep top-level flow readable, but reduce chrome that competes with the gallery.

### 2. Gallery + cards
- Gallery is already the strongest catalogue-style surface.
- Preserve card-first browsing and selection behavior.
- Shift emphasis toward lighter/pastel surfaces, rounded controls, and less metadata weight.

### 3. Breed Lab
- Parent comparison and prediction are logically separated well.
- Trait bias should remain chip-driven and fast to scan.
- Avoid adding explanation-heavy copy; keep controls compact.

### 4. Birth sequence
- Phase sequencing is intact and should not be rewritten.
- Presentation can become cleaner by lowering the visual weight of the phase tracker and keeping the reveal dominant.

### 5. Lineage
- Recursive lineage layout is already isolated behind tested layout logic.
- Visual polish should stay in the rendering layer and avoid changing lineage graph calculations.

## Code-quality notes

- Keep store and breeding engine logic untouched unless a regression demands it.
- Prefer visual-only changes in `src/App.tsx`, `src/index.css`, and UI component files.
- `src/store/useClawStore.ts` cleanly centralizes selection, prediction, breed, demo mode, and reset flow; preserve that boundary.
- Existing regression coverage already protects store, engine, demo mode, and lineage layout behavior.

## Regression checklist for implementers

- Selecting two gallery cards still enables Breed Lab entry.
- Preferred trait changes still recompute prediction.
- Breeding still advances to birth and produces a child.
- Saving a child still returns to gallery and prepends once.
- Demo mode still auto-loads the showcase pair.
- Lineage still renders multi-generation ancestry without layout breakage.

## Suggested low-risk implementation order

1. Restyle global shell and spacing tokens.
2. Restyle gallery cards and grid hierarchy.
3. Simplify Breed Lab, Birth, and Lineage chrome without touching engine/store logic.
4. Re-run lint, test, build, and manual QA checklist.
