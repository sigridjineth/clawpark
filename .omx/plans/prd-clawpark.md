# PRD — ClawPark

## Goal
Ship a hackathon-ready ClawPark demo implementing the four-screen flow from the provided product spec: Gallery, Breed Lab, Birth Sequence, and Lineage View.

## In Scope
- React/Vite static SPA with TypeScript
- 6+ pre-made Gen-0 claws
- Two-parent selection and Breed Lab prediction panel
- Breed engine with deterministic seeded randomness, inheritance, mutation, archetype, intro generation, and visuals
- Birth animation phases and reveal sequence
- Lineage view with parent-child graph and inherited trait labels
- Demo mode via `?demo=true` and keyboard shortcut

## Out of Scope
- Real AI API calls
- Multi-user, marketplace, blockchain, persistence beyond local session

## Acceptance Criteria
1. Gallery shows 6+ claws with trait, skill, and visual identity information.
2. Selecting two claws enables navigation to Breed Lab.
3. Prediction panel updates from current parents and preferred trait selection.
4. Breed action produces a child with lineage, archetype, intro, visuals, and mutation handling.
5. Birth sequence presents merge/blend/birth/reveal phases and then CTA buttons.
6. Lineage view renders parent-child relationships and mutation marker.
7. New child is added to gallery and can be re-bred.
8. Demo mode yields reproducible, presentation-friendly outcomes.
9. App typechecks and production build succeeds.

## Implementation Notes
- Favor SVG lineage rendering over extra graph dependency.
- Use template/generated intros instead of remote API.
- Keep data local and deterministic.

## Agent Roster / Staffing Guidance
- `executor`: implementation lanes (logic, UI, infra)
- `architect`: final review / risk check
- `verifier`: independent verification and evidence check

## Suggested team->ralph path
1. Team lanes: logic/data, UI/animation, build/verification.
2. Ralph handles persistence and final verification once implementation lands.
