# ClawPark OpenClaw UI Gap Audit

Date: March 10, 2026
Owner: worker-3
Scope: latest repo state after the active OpenClaw genome pass landed in the data model / engine.

## Current mapping status

### Fully represented already
- `src/components/Gallery/ClawCard.tsx:17-18,49-73` surfaces **Identity / Soul / Skills / Tools** in gallery cards.
- `src/components/BreedLab/ParentSlot.tsx:12-13,23-59` surfaces **Identity / Soul / Skills / Tools** in parent comparison cards.
- `src/components/Lineage/LineageGraph.tsx:67-119` now adds dimension-grouped lineage summaries for **identity / soul / skills / tools**.
- `src/types/claw.ts:67-75,83-99,131-140`, `src/engine/predict.ts:50-78`, and `src/engine/openclaw.ts:193-224` all support four-dimension inheritance data.

## Exact remaining gaps

### 1. Breed prediction forecast still hides SOUL + SKILLS even though the engine provides them
- **Data exists:**
  - `src/types/claw.ts:135-140` exposes `dimensionForecast.identity`, `soul`, `skills`, and `tools`.
  - `src/engine/openclaw.ts:219-223` builds all four strings.
  - `src/engine/predict.ts:66-77` passes the full forecast into `BreedPrediction`.
- **UI gap:**
  - `src/components/BreedLab/PredictionPanel.tsx:37-47` renders only **Identity** and **Tools** forecast cards.
  - No rendering path exists there for `prediction.dimensionForecast.soul` or `.skills`.
- **Best bounded target:**
  - `src/components/BreedLab/PredictionPanel.tsx`

### 2. Breed Lab control copy is still framed as soul-only "Trait bias"
- **Current implementation:**
  - `src/components/BreedLab/BreedLab.tsx:17-19` builds the selectable pool entirely from soul traits.
  - `src/components/BreedLab/BreedLab.tsx:40-72` labels the control module **Trait bias**.
- **Gap:**
  - The surrounding experience now teaches four-dimension genomes, but this control still implies the system is primarily trait-only.
- **Best bounded target:**
  - `src/components/BreedLab/BreedLab.tsx`

### 3. Birth reveal now shows Identity + Soul + Tools, but still omits SKILLS and inheritance semantics
- **Current implementation:**
  - `src/components/Birth/RevealPhase.tsx:29-30` loads identity and tools for the child.
  - `src/components/Birth/RevealPhase.tsx:80-97` renders **Identity**, **Tools**, and **Soul** reveal cards.
- **Gap:**
  - There is still no **Skills** section in the reveal.
  - The reveal continues to ignore `InheritanceRecord.kind` and `detail` from `src/types/claw.ts:67-75`, so the user still cannot see which pieces were **inherited**, **dominant**, **fused**, or **mutated** in a dimension-level ledger.
- **Best bounded target:**
  - `src/components/Birth/RevealPhase.tsx`

## Highest-value next fix

If the implementation lane wants the single smallest UI follow-up with immediate product value, do this first:
1. `src/components/BreedLab/PredictionPanel.tsx` — render **Soul** and **Skills** forecast cards next to the existing Identity/Tools forecast.

That is the cleanest bounded patch because the forecast data is already wired end-to-end; only the final render step is missing.
