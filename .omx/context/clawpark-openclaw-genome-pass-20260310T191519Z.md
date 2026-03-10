# Context Snapshot — ClawPark OpenClaw Genome Pass

- **Task statement:** Rework ClawPark to breed actual OpenClaw-style dimensions (IDENTITY, SOUL, SKILL, TOOLS) and make the transformations legible in a Jurassic Park-style UX/UI.
- **Desired outcome:** Breed results should clearly show what each dimension is, which parent it came from, what changed/mutated, and how an OpenClaw agent evolves.
- **Known facts/evidence:** Official OpenClaw docs define workspace files including `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `TOOLS.md`; skills are folders containing `SKILL.md` with frontmatter and instructions. Current app is green and already has recursive lineage support.
- **Constraints:** No new dependencies unless necessary (prefer none), preserve working flow + tests, keep UI lower-text, maintain demo mode, use official OpenClaw docs as the model source.
- **Unknowns/open questions:** Whether to parse real markdown files live (assume not yet; emulate actual structure faithfully in local data first). Exact Jurassic Park visual intensity (assume themed direction, not full movie clone).
- **Likely codebase touchpoints:** `src/types/claw.ts`, `src/data/*`, `src/engine/*`, `src/store/useClawStore.ts`, `src/components/*`, tests, README/docs.
- **Official references:**
  - Agent workspace: https://docs.openclaw.ai/agent-workspace
  - SOUL: https://docs.openclaw.ai/reference/templates/SOUL
  - IDENTITY: https://docs.openclaw.ai/reference/templates/IDENTITY
  - TOOLS: https://docs.openclaw.ai/reference/templates/TOOLS
  - USER: https://docs.openclaw.ai/reference/templates/USER
  - Skills / SKILL.md: https://docs.openclaw.ai/skills
