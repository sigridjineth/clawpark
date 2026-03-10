# PRD — ClawPark OpenClaw Genome Pass

## Goal
Turn ClawPark into an OpenClaw-inspired agent genome lab where users can breed agents across real OpenClaw-style dimensions and understand the result through dialogue, lineage, and doctrine.

## Product concept
Each parent Claw represents an agent genome with four visible dimensions:
- `IDENTITY.md`
- `SOUL.md`
- `skills/*/SKILL.md`
- `TOOLS.md`

Breeding should not feel like random trait averaging. It should feel like two agents are brought into the same containment chamber, asked what kind of child should survive, and then fused into a new specimen.

## In scope
- OpenClaw-style genome model in the app
- Free-form operator prompt in Breed Lab
- Parent dialogue generation from that prompt
- Child doctrine artifact
- Breeding transcript persisted in lineage
- Recursive lineage display
- Deterministic demo mode
- Import/export and marketplace scaffolding
- Jurassic Park-style low-text lab UI

## Acceptance criteria
1. Every Claw visibly includes `Identity`, `Soul`, `Skills`, and `Tools`.
2. Users can enter a custom operator prompt before breeding.
3. Parents generate a visible dialogue from that prompt.
4. The resulting child stores:
   - inheritance map
   - breeding transcript
   - doctrine artifact
5. Reveal and lineage views surface the transcript and doctrine.
6. Recursive lineage still works for bred descendants.
7. Test, lint, build, and diagnostics all pass.

## Out of scope
- Live parsing of an external OpenClaw workspace
- Real backend persistence or auth
- Real-time RL training loops
- Secure webhook/backend delivery infrastructure
