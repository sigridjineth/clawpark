# ClawPark Breeding & Lab System

This document explains how the current ClawPark breeding system works so product and UI design can reason about the flow before implementation changes.

## Purpose
The breeding system is the core ClawPark interaction loop.

It lets a user:
- select two parent Claws,
- preview the likely child,
- steer the result with a preferred trait,
- give the lab an operator prompt,
- generate a parent-to-parent conversation,
- breed a child with lineage, doctrine, and transcript,
- inspect the result through Birth and Lineage views,
- save the child back into the gallery.

## High-level user flow
1. Open the Gallery.
2. Select two parent Claws.
3. Enter Breed Lab.
4. Review the prediction panel.
5. Optionally set a preferred trait bias.
6. Enter an operator prompt.
7. Click **Talk to Parents**.
8. Click the breed action button.
9. Watch the Birth sequence.
10. Inspect the child in Lineage view.
11. Save the child to the gallery.

## Main system layers

### 1. Domain model
File: `src/types/claw.ts`

Defines the core concepts:
- `Claw`
- `ClawIdentity`
- `SoulTrait`
- `SkillBadge`
- `ToolBadge`
- `ClawLineage`
- `InheritanceRecord`
- `ConversationTurn`
- `ChildDoctrine`
- `BreedRequest`
- `BreedResult`
- `BreedPrediction`
- `BirthPhase`
- `Screen`

The most important field for downstream UI is `child.lineage`, which stores:
- `parentA`
- `parentB`
- `inheritanceMap`
- `breedingConversation`
- `doctrine`

### 2. App flow state
File: `src/store/useClawStore.ts`

The Zustand store coordinates the whole loop.

It manages:
- selected parent ids,
- prediction,
- preferred trait id,
- operator prompt,
- breeding conversation,
- breed result,
- birth phase,
- current screen,
- demo mode,
- gallery persistence.

Important store actions:
- `selectClaw()`
- `computePrediction()`
- `setBreedPrompt()`
- `generateParentConversation()`
- `breedSelected()`
- `addChildToGallery()`
- `resetFlow()`

### 3. Screen routing
File: `src/App.tsx`

`App.tsx` renders one of five screens:
- `gallery`
- `breedLab`
- `birth`
- `lineage`
- `marketplace`

For the breeding loop, the routing is:
`gallery -> breedLab -> birth -> lineage -> gallery`

### 4. Prediction layer
File: `src/engine/predict.ts`

`predictBreed()` builds the Breed Lab forecast.

It:
- combines the parents' soul traits,
- boosts the preferred trait when present,
- calculates trait probabilities,
- computes mutation chance,
- predicts archetype,
- builds a dimension forecast for identity / soul / skills / tools.

This is a forecast only. It does not create the child.

### 5. Language / identity / doctrine layer
File: `src/engine/openclaw.ts`

This file provides the explanation layer for the breeding system.

It is responsible for:
- deriving/filling identity,
- deriving tools when missing,
- fusing parent identity into child identity,
- building dimension forecast text,
- generating parent talk profiles,
- generating the parent conversation,
- generating the child doctrine,
- generating short dossier summaries for UI surfaces.

### 6. Breed execution layer
File: `src/engine/breed.ts`

`breed()` is the actual child-generation engine.

It:
- resolves a deterministic seed,
- inherits soul traits,
- inherits skills,
- inherits tools,
- applies mutation when triggered,
- resolves archetype and intro,
- fuses identity,
- builds lineage,
- builds doctrine,
- returns the final `BreedResult`.

The child includes:
- id,
- name,
- archetype,
- generation,
- identity,
- soul,
- skills,
- tools,
- visual,
- intro,
- lineage.

### 7. Birth presentation layer
Files: `src/components/Birth/*`

The Birth sequence uses timed phases:
- `merge`
- `blend`
- `birth`
- `reveal_name`
- `reveal_archetype`
- `reveal_traits`
- `reveal_intro`
- `complete`

Primary file:
- `src/components/Birth/BirthScene.tsx`

Purpose:
- turn the breed result into a ceremonial/specimen-style reveal.

### 8. Lineage presentation layer
Files:
- `src/components/Lineage/LineageGraph.tsx`
- `src/components/Lineage/lineageLayout.ts`

This layer renders:
- ancestry graph,
- generation count,
- node/link count,
- dimension inheritance summaries,
- doctrine,
- breeding transcript.

Purpose:
- explain how the child was produced and what came from where.

## Detailed click trace

### Gallery selection
- User selects parent A and parent B.
- Store updates `selectedIds`.
- Store recomputes prediction through `computePrediction()`.

### Enter Breed Lab
- `App.tsx` resolves `selectedClaws` and `parentPair`.
- `BreedLab` renders the parent cards and prediction panel.

### Talk to Parents
- User updates `breedPrompt`.
- User clicks **Talk to Parents**.
- Store runs `generateParentConversation()`.
- This calls `buildBreedingConversation(...)`.
- Result is saved in `breedingConversation`.

### Breed
- User clicks the breed action button.
- Store runs `breedSelected()`.
- Store passes parent data + prompt + conversation + seed into `breed()`.
- `breed()` returns a `BreedResult`.
- Store writes `breedResult` and changes screen to `birth`.

### Birth
- `BirthScene` auto-advances through the phase sequence.
- Reveal panels show the child name, archetype, traits, intro, doctrine, and transcript context.

### Lineage
- User enters Lineage view.
- `LineageGraph` renders the family graph and dimension summaries.
- Transcript and doctrine are shown alongside ancestry.

### Save child
- `addChildToGallery()` prepends the new child into the local gallery collection.
- The gallery is persisted locally through existing claw I/O utilities.

## Important design implications

### 1. The lab is prediction-first, not instant-result-first
The user sees a forecast before committing to breeding.
That means the design should preserve:
- parent comparison,
- child forecast,
- mutation visibility,
- steering controls.

### 2. The operator prompt is part of the system identity
This is not just flavor copy.
The prompt feeds the parent conversation and indirectly affects how the result is framed.
Design should treat it as a first-class input.

### 3. Transcript and doctrine are core output artifacts
The child is not only a stat result.
The system also produces:
- a conversation transcript,
- a doctrine/creed,
- an ancestry explanation.

### 4. Birth and Lineage are separate experiences
- Birth = emotional/ceremonial reveal
- Lineage = explanatory/analytic breakdown

The design should keep those surfaces distinct.

### 5. Current breeding is still local-state driven
Right now the main breeding loop is driven by the frontend store and engine, not by the backend commerce system.
This matters because Gallery breeding and Marketplace mock-commerce breeding are not yet fully unified.

## Current limits
- Gallery/local breeding and mock commerce inventory are still separate systems bridged by UI actions.
- Breed Lab currently uses local selected Claws, not persistent owned specimen ids.
- The Marketplace mock breeding loop is additive and does not yet replace the main lab flow.
- The prediction/control copy still contains some trait-bias language that may need product/design refinement.

## Best files for designers to read together
- `README.md`
- `docs/clawpark-product-spec.md`
- `docs/clawpark-technical-spec.md`
- `.omx/plans/techspec-clawpark-openclaw-genome.md`
- `src/components/BreedLab/BreedLab.tsx`
- `src/components/Birth/BirthScene.tsx`
- `src/components/Lineage/LineageGraph.tsx`

## One-line summary
ClawPark's lab system is a deterministic, prompt-guided breeding flow where two parent Claws are compared, forecast, conversationally fused, and transformed into a child with lineage, doctrine, transcript, and reveal/inspection screens.
