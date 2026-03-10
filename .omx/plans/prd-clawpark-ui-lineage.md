# PRD — ClawPark UI Simplification + Full Lineage

## Goal
Respond to user feedback by making the interface simpler and more intuitive while completing the partially implemented lineage experience.

## Scope
- Reduce UI clutter and helper text across Gallery, Breed Lab, Birth, and Lineage screens
- Preserve the 4-screen flow and demo mode
- Remove or minimize non-essential presenter overlays/chrome
- Implement recursive lineage rendering for all available ancestors in memory, not just immediate parents
- Keep new descendants breedable and lineage-explainable

## Acceptance Criteria
1. Main screens show less text and fewer simultaneous panels than before.
2. Primary actions remain visually obvious without reading long copy.
3. The lineage view renders multi-generation ancestry for bred descendants when ancestor data exists.
4. Mutation and inheritance origins remain understandable in the lineage view.
5. Existing build/lint/test verification stays green.

## Out of Scope
- Backend persistence
- Multi-user
- Real API generation
- End-to-end browser automation
