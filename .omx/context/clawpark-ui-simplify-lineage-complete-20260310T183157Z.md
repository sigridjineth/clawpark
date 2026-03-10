# Context Snapshot — ClawPark UI Simplification + Full Lineage

- **Task statement:** Apply user feedback to simplify the ClawPark UI and fully implement the previously partial lineage functionality.
- **Desired outcome:** Cleaner, lower-text, more intuitive demo UI plus recursive/multi-generation lineage rendering that works for bred descendants, with verification.
- **Known facts/evidence:** Existing app builds/tests/lints green. Current UI has multiple helper/presenter panels and dense text. Current lineage view only shows immediate parents + child. User explicitly requested `omx team ralph`.
- **Constraints:** Root AGENTS.md applies. Keep diffs reviewable, prefer deletion over addition, no new dependencies, preserve demo mode and core hackathon flow.
- **Unknowns/open questions:** Whether to keep any presenter overlays at all (assume minimize them substantially). How many generations to render at once (assume recursive lineage tree for all available ancestors in memory, with compact nodes).
- **Likely codebase touchpoints:** `src/App.tsx`, `src/components/Gallery/*`, `src/components/BreedLab/*`, `src/components/Birth/*`, `src/components/Lineage/*`, `src/store/useClawStore.ts`, tests.
