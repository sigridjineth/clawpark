# Context Snapshot — ClawPark CryptoKitties-style UI Overhaul

- **Task statement:** Overhaul all ClawPark UX/UI to feel more like CryptoKitties' simple catalogue/browse-first experience, while keeping text minimal and preserving the working breeding + lineage flow.
- **Desired outcome:** Cleaner, simpler, more visual product with a catalogue-like layout, lighter chrome, reduced copy, and stronger visual hierarchy closer to CryptoKitties' feel.
- **Known facts/evidence:** User explicitly wants similarity to https://www.cryptokitties.co and specifically “keep simple, no many texts.” Current repo is functionally green and already has recursive lineage support. Previous architect review said UI is improved but not yet close enough to a CryptoKitties-like catalogue feel.
- **Constraints:** Follow AGENTS.md, no new dependencies unless necessary (prefer none), preserve demo mode + breeding/lineage logic, keep verification green.
- **Unknowns/open questions:** Exact visual match tolerance; assume directional similarity (catalogue-first, airy cards, simpler controls, lighter info density) rather than pixel clone.
- **Likely touchpoints:** `src/App.tsx`, `src/index.css`, `src/components/Gallery/*`, `src/components/BreedLab/*`, `src/components/Birth/*`, `src/components/Lineage/*`, shared visual components.
