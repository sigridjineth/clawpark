# Context Snapshot — ClawPark Implementation

- **Task statement:** Implement the ClawPark hackathon demo as a static React/Vite SPA in this repo.
- **Desired outcome:** Working app covering gallery, breed lab prediction, birth sequence, reveal, lineage view, and demo mode from the provided spec/tech spec.
- **Known facts/evidence:** Product spec and tech spec are in `files (1)/clawpark-spec-v2.md` and `files (1)/clawpark-techspec-v2.md`. Repo currently has no app scaffold. User explicitly requested `omx team ralph`.
- **Constraints:** Follow root AGENTS.md; ralph requires plan artifacts before implementation; no backend; static SPA; TypeScript + React 18 + Vite + Tailwind + Framer Motion + Zustand; concise reporting.
- **Unknowns/open questions:** Whether to use React Flow or SVG for lineage (choose SVG to avoid extra dependency churn); whether to use live Claude API (exclude from MVP, use templates).
- **Likely codebase touchpoints:** `package.json`, `src/**/*`, config files (`vite.config.ts`, `tailwind.config.*`, `tsconfig*.json`, `postcss.config.*`), `.omx/plans/*`.
