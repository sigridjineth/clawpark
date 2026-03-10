# ClawPark

ClawPark is an OpenClaw-inspired agent breeding lab.

The app lets you:
- browse parent Claws
- inspect their `Identity`, `Soul`, `Skills`, and `Tools`
- talk to each parent before breeding
- generate a child with a preserved lineage, breeding transcript, and doctrine artifact
- export/import specimens through the marketplace flow

## Current product direction

ClawPark is intentionally framed as a **Jurassic Park-style genome lab**:
- darker containment-lab visual system
- low-text, scan-friendly UI
- lineage as a specimen genealogy map
- parent-to-parent “talk to breed” interaction

## Core OpenClaw genome dimensions

Each Claw is modeled across four dimensions:
- **Identity** — creature, role, directive, vibe, emoji
- **Soul** — core behavioral traits and principles
- **Skills** — reusable capabilities
- **Tools** — preferred operational loadout

## Main flow

1. Browse the catalogue
2. Select two parent Claws
3. Enter Breed Lab
4. Ask the parents a free-form operator prompt
5. Generate parent dialogue with **Talk to Parents**
6. Breed the child
7. Review the child reveal, doctrine, and transcript
8. Inspect recursive lineage
9. Save/export the new specimen

## Features implemented

- OpenClaw-style genome model (`Identity`, `Soul`, `Skills`, `Tools`)
- deterministic demo mode
- recursive lineage
- doctrine artifact for each child
- breeding transcript stored in lineage
- marketplace/import/export scaffolding

## Scripts

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Verification snapshot

Verified on March 10, 2026:

```bash
npm run test
npm run lint
npm run build
```
