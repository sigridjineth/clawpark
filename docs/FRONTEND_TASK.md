# Frontend Task Tracker — ClawPark

**Snapshot:** March 19, 2026
**Source of truth:** current code in `src/`, `tests/`, and `README.md`

This file is now a practical **DONE / TODO tracker** instead of a greenfield spec. It reflects what is already shipped in the repo and what still needs product work or contract cleanup.

---

## Current frontend snapshot

The app shell currently renders these screens in `src/App.tsx`:
- Home
- Import
- Nursery
- Marketplace
- Breed Lab
- Birth
- Lineage
- Connect

---

## DONE

### Core shell and breeding flow
- [x] Absolute header + animated glass navbar exist in `src/App.tsx`.
- [x] Home screen renders server-driven status cards and suggested actions in `src/components/Home/Home.tsx`.
- [x] Import screen supports drag/drop ZIP upload, preview, warnings, and claim in `src/components/Import/Import.tsx`.
- [x] Nursery screen supports specimen browsing, ownership filters, breed-state filters, and pair selection in `src/components/Nursery/Nursery.tsx`.
- [x] Breed Lab supports parent slots, prediction, trait bias, operator prompt, and parent conversation in `src/components/BreedLab/BreedLab.tsx`.
- [x] Birth scene + phased reveal flow exist across `src/components/Birth/*`.
- [x] Lineage graph, doctrine panel, and breeding transcript UI exist in `src/components/Lineage/LineageGraph.tsx`.
- [x] Connect screen supports linked/unlinked Discord states in `src/components/Connect/Connect.tsx`.
- [x] Zustand store wires local selection, prediction, breeding, import preview, claim flow, and home/specimen fetches in `src/store/useClawStore.ts`.

### Marketplace / mock-commerce UI that already exists
- [x] Marketplace is mounted in the main app shell and nav in `src/App.tsx`.
- [x] Marketplace browse for registry claw listings and skill listings exists in `src/components/Marketplace/Marketplace.tsx`.
- [x] Marketplace browse now includes search, sorting, sale-state filtering, and generation filtering.
- [x] Marketplace browse supports in-context inspection for claw and skill listings.
- [x] Publish flow exists for verified draft creation, draft editing, and publish.
- [x] Unsigned/local publish support exists through the same marketplace surface.
- [x] Skill download, install, overwrite handling, and “copy install steps” UX exist.
- [x] Portfolio / **My Claws** tab exists with counts for owned / listed / cooldown / newborn.
- [x] Seller actions exist: list, edit price, delist, relist.
- [x] Buyer flow exists for mock listings.
- [x] Marketplace actions now surface persistent receipt/state panels instead of only transient status text.
- [x] Mock breeding panel exists for owned specimens.
- [x] Specimen detail + provenance inspection exists.
- [x] Transaction feed exists.
- [x] Client helpers for registry + mock-commerce APIs exist in `src/services/marketplaceApi.ts`.

### Existing test coverage
- [x] UI shell / breeding loop tests exist in `tests/ui-shell.contract.spec.ts` and `tests/openclaw-genome.contract.spec.ts`.
- [x] Marketplace integration contract coverage exists in `tests/marketplace.contract.spec.ts`.
- [x] Store contract tests exist in `tests/store.contract.spec.ts`.
- [x] Current repo verification is green: `npm run lint`, `npm run typecheck`, and `npm run test`.
- [ ] Frontend upload/import and breeding flows have **not** yet been manually browser-tested end-to-end with real ZIP uploads and real UI interaction.

---

## TODO

### P0 — remaining structural cleanup
- [ ] Decide whether `src/components/Gallery/Gallery.tsx` is legacy or the future shell, then remove or reintegrate it intentionally.
- [ ] Replace heuristic Home action routing for unsupported backend actions with dedicated UI destinations where needed.

### P1 — marketplace UX depth
- [ ] Decide whether browse-side detail states are sufficient or whether Marketplace still needs dedicated route/page-level detail views.

### P1 — unify data sources
- [ ] Decide on one source of truth between local `useClawStore` claw state and remote mock portfolio state.
- [ ] Make ownership / listed / newborn / cooldown state consistent across Nursery and Marketplace.
- [ ] Add an explicit “list this child” CTA after save / birth / lineage where appropriate.

### P2 — polish
- [ ] Mobile pass for Marketplace, Nursery, and Lineage.
- [ ] Empty-state pass for no listings, no owned claws, no eligible parents.
- [ ] Error-state pass for offline backend / partial API availability.
- [ ] Accessibility pass on navigation, action cards, and modal/detail states.

### P2 — end-to-end validation
- [ ] Run a manual frontend E2E pass for upload/import with real OpenClaw ZIPs.
- [ ] Run a manual frontend E2E pass for the full breeding flow: Nursery → Lab → Breed → Lineage → Save.
- [ ] Add automated E2E coverage for the upload/breed happy path where practical.

---

## Known frontend drift worth tracking
- `src/components/Gallery/Gallery.tsx` remains outside the mounted shell and needs an explicit future/cleanup decision.
- Home suggested-action navigation still uses best-effort routing for some backend actions that do not yet have dedicated UI surfaces.
- Frontend upload/import and breeding have not yet been manually validated end-to-end in the real browser flow.

---

## Suggested GitHub issues
- [x] #8 — Wire Exchange / Marketplace into the app shell and navigation
- [x] #9 — Align frontend `/api/v1` client + types with the actual server contract
- [x] #12 — Restore lint and test baseline after shell and parser drift
- [x] #15 — Expand Marketplace UX with detail pages, discovery controls, and stronger receipts
- [ ] #16 — Unify local gallery and remote portfolio into one ownership/source-of-truth model
- [ ] #17 — Run a frontend polish pass for mobile, empty/offline states, and accessibility
- [ ] #20 — Validate frontend upload and breeding flows end-to-end (manual + automated)
