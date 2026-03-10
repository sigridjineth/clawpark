# ClawPark

Interactive collectible-claw breeding demo with a CryptoKitties-style, catalogue-first product surface.

## Experience goals

- Gallery is the default hero experience.
- Cards feel playful, rounded, pastel, and collectible.
- Copy stays minimal; actions stay obvious.
- Existing breeding, demo mode, and recursive lineage logic remain intact.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Scripts

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## Demo mode

Use either:

- `http://localhost:5173/?demo=true`
- `Ctrl+Shift+D` / `Cmd+Shift+D`

Demo mode:

- auto-selects the showcase pair
- uses deterministic seeded breeding
- guarantees the presentation-friendly mutation path

## Product flow

1. Browse the gallery catalogue
2. Select two Claws
3. Tune trait bias in Breed Lab
4. Watch the birth sequence
5. Inspect recursive lineage

## UI overhaul references

- PRD: `.omx/plans/prd-clawpark-cryptokitties-ui.md`
- Test spec: `.omx/plans/test-spec-clawpark-cryptokitties-ui.md`
- Review notes: `docs/cryptokitties-ui-review.md`

## Manual QA focus

- Gallery reads as a collectible catalogue before anything else.
- Cards stay highly scannable with very little copy.
- Breed Lab keeps compact controls and clear prediction feedback.
- Birth stays high-impact without obscuring the child reveal.
- Lineage remains readable after UI restyling.
- Demo mode still drives the showcase gallery → breed → gallery loop.

## Verification snapshot

Verified on March 10, 2026:

```bash
npm run test
npm run lint
npm run build
```
