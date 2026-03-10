# PRD — ClawPark OpenClaw Genome Pass

## Goal
Turn ClawPark from a fictional trait breeder into an OpenClaw-inspired agent genome lab. Breeding should operate on actual OpenClaw-style dimensions: IDENTITY, SOUL, SKILLS, and TOOLS. The UI should present this like a Jurassic Park-style species lab while staying concise and demoable.

## Scope
- Replace or augment fictional trait framing with OpenClaw dimensions:
  - `IDENTITY.md`
  - `SOUL.md`
  - `TOOLS.md`
  - `skills/*/SKILL.md`
- Show inheritance and transformation across those dimensions during breeding
- Preserve gallery, lab, birth, lineage flow
- Preserve recursive lineage and demo mode
- Make changes legible: what is inherited, fused, dominant, or mutated

## Acceptance Criteria
1. Each Claw visibly includes OpenClaw-style sections: identity, soul, skills, tools.
2. Breed Lab and Birth clearly show what each dimension is and how it changes.
3. Lineage remains recursive and displays dimension-level ancestry context.
4. Demo flow remains usable and visually strong.
5. Tests/lint/build/diagnostics all pass.

## Out of Scope
- Live parsing of external markdown from a real OpenClaw workspace
- Backend persistence
- Marketplace/multi-user
