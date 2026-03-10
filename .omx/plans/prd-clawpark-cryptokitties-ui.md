# PRD — ClawPark CryptoKitties-style UI Overhaul

## Goal
Reshape ClawPark's UX/UI to feel much closer to a simple CryptoKitties-style product surface: catalogue-first, playful, highly visual, low-text, and easy to scan.

## Scope
- Overhaul the visual system, layouts, spacing, and card style
- Reduce non-essential copy across all screens
- Make gallery/catalogue the dominant experience
- Simplify Breed Lab / Birth / Lineage UI to visual-first layouts
- Preserve existing working breeding, demo mode, and recursive lineage functionality

## Acceptance Criteria
1. Main UI reads as browse-first and catalogue-like rather than a guided dashboard.
2. Text is minimal; primary actions are obvious without explanatory paragraphs.
3. Cards and layouts feel lighter, friendlier, and more collectible/product-oriented.
4. Breed, birth, and lineage flows still work with existing logic.
5. Tests, lint, build, and diagnostics all pass.

## Out of Scope
- Pixel-perfect CryptoKitties clone
- Backend persistence
- New product features beyond UX/UI and existing lineage preservation
