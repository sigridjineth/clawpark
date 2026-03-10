# ClawPark OpenClaw Genome Review

Date: March 10, 2026
Owner: worker-3
References:
- `.omx/plans/prd-clawpark-openclaw-genome.md`
- `.omx/plans/test-spec-clawpark-openclaw-genome.md`

## Baseline verification

- `npm run test` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS
- `npx tsc --noEmit --pretty false --project tsconfig.json` — PASS (0 errors, 0 warnings)

## Review summary

The current app already preserves the right product loop: gallery selection, Breed Lab prediction, animated birth, and recursive lineage. The main gap versus the OpenClaw genome brief is not flow stability but model meaning. The code and copy still describe a fictional trait/archetype breeder, while the target experience needs a concise genome lab built around four OpenClaw-style dimensions: identity, soul, skills, and tools.

## Blocking gaps versus the OpenClaw genome PRD

### 1. The domain model stops at soul + skills
- `src/types/claw.ts` models `soul` and `skills`, but there is no first-class `identity` or `tools` section.
- `InheritanceRecord` only allows `type: 'soul' | 'skill'`, which means lineage cannot cleanly explain identity/tool inheritance without widening the model.
- `src/data/claws.ts` seeds every starter Claw with soul traits, skill badges, an archetype label, and an intro, so the fixture layer reinforces the older fiction instead of the target genome framing.

### 2. Breed Lab still teaches "trait bias," not genome recombination
- `src/components/BreedLab/BreedLab.tsx` exposes a single "Trait bias" control, which is useful interactionally but mismatched with the new dimension-based explanation.
- `src/engine/predict.ts` only predicts soul-trait probabilities plus a derived archetype, so the preview layer cannot yet explain what gets inherited, fused, or mutated across all genome dimensions.
- `src/components/BreedLab/PredictionPanel.tsx` surfaces expected inheritance, mutation chance, and predicted archetype, but not dimension-by-dimension outcomes.

### 3. Birth and lineage reveal ancestry, but not genome semantics
- `src/components/Birth/RevealPhase.tsx` currently reveals the child name, archetype, and soul traits with source labels. That is a strong interaction surface, but it needs four genome sections and clearer mutation/fusion language.
- `src/components/Lineage/LineageGraph.tsx` groups ancestry by origin labels rather than by genome dimensions, so recursive lineage remains intact but does not yet explain identity/soul/skills/tools ancestry context.

### 4. Top-level documentation is still anchored to the previous pass
- `README.md` still describes a "CryptoKitties-style" catalogue surface, references the prior UI-overhaul PRD/test spec, and tells users to "Tune trait bias in Breed Lab."
- Because the implementation work is still in flight, the safest documentation update right now is this review note plus a planned README rewrite after the product copy and UI land together.

## Code-quality notes to preserve during the rework

- `src/store/useClawStore.ts` remains the correct boundary for selection, prediction, breeding, demo mode, and screen flow. Avoid spreading that state into presentation components.
- `src/utils/demoMode.ts` and the breed seed flow already protect the deterministic showcase path; keep that intact while renaming the surrounding UX.
- `src/components/Lineage/lineageLayout.ts` is already covered by tests and should stay a layout concern; dimension-level ancestry should be added through data passed into the graph, not by rewriting the layout algorithm.
- Prefer replacing the current archetype-only framing with a single `genome` object on `Claw` instead of adding one-off fields to multiple components. That will keep UI mapping cleaner once identity and tools are introduced.
- Keep a single lineage ledger. Expanding `InheritanceRecord` (or replacing it with a richer genome-dimension record) is lower risk than creating separate ad hoc ancestry paths per dimension.

## Documentation handoff for implementers

### Recommended lane boundaries
1. **Data model + engine**
   - `src/types/claw.ts`
   - `src/data/claws.ts`
   - `src/engine/breed.ts`
   - `src/engine/predict.ts`
   - related inheritance/mutation helpers
2. **UI/UX overhaul + visual explanation**
   - `src/App.tsx`
   - `src/components/BreedLab/*`
   - `src/components/Birth/*`
   - `src/components/Lineage/*`
3. **Tests + verification**
   - `src/engine/*.test.ts`
   - `src/store/*.test.ts`
   - `src/components/Lineage/lineageLayout.test.ts`
   - `tests/*`

### Copy and UX guardrails
- Replace "trait bias" language with genome-language that teaches **identity**, **soul**, **skills**, and **tools** without becoming essay-heavy.
- Preserve the current gallery → breed → birth → lineage loop and demo mode determinism.
- Keep the Jurassic Park lab tone concise: specimen-style labels, lab instrumentation cues, and inheritance readouts should do more work than long paragraphs.
- Show whether each dimension was inherited, fused, or mutated directly in the UI instead of burying that meaning in prose.

## Regression checklist

- Selecting two gallery cards still enables Breed Lab entry.
- Demo mode still auto-loads the showcase pair and preserves deterministic output.
- Breeding still advances to birth and produces a child with recursive lineage.
- Lineage still renders multi-generation ancestry without layout breakage.
- The new genome framing explains identity, soul, skills, and tools on screen without removing mutation visibility.

## Review recommendation

**REQUEST CHANGES** until the product copy, data model, and lineage vocabulary all move from trait/archetype fiction to the OpenClaw-style genome model.
