# Frontend Task Breakdown — ClawPark

**Document Version:** v1.0
**Last Updated:** March 19, 2026
**Target:** Development team task assignment and tracking

---

## Overview

Frontend tasks implement the ClawPark UI across 7 main screens (Home, Import, Nursery, Breed Lab, Birth, Lineage, Connect) with full integration to `/api/v1/` endpoints. All tasks use TypeScript, React, Tailwind CSS, and Framer Motion as established in the codebase.

**Current Status:** UI skeleton exists. Core components exist (Home, Import, Nursery, Connect, BreedLab). Birth animation and Lineage graph in progress.

---

## Task Structure

Each task includes:
- **Task ID** — FE-001, FE-002, etc.
- **Title** — What to build
- **Priority** — P0 (critical path), P1 (required for MVP), P2 (nice-to-have)
- **Status** — Not Started / In Progress / Done
- **Description** — Detailed requirements
- **Files to Create/Modify** — Exact paths
- **Acceptance Criteria** — Testable conditions
- **Dependencies** — Which tasks must complete first
- **Complexity** — S (small), M (medium), L (large)

---

## Phase 1: Core Navigation & Layout

### FE-001: Glass Pill Navigation Bar

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Implement the centered glass navigation pill with animated indicator that smoothly follows hover and active states. The navbar shows: Home, Nursery, Lab, Import, Connect.

**Files:**
- `src/App.tsx` — Already implements GlassNavbar; verify and test
- `src/styles/globals.css` — Ensure glass effect variables are defined

**Requirements:**
- 5 nav items with spring animation (stiffness 400, damping 35)
- Indicator follows on hover and click
- Respects `prefers-reduced-motion`
- Positioned absolutely in header at top-center

**Acceptance Criteria:**
- Clicking each nav item changes screen
- Hover indicator appears before click
- Animation smooth at 60fps
- Mobile responsive (pill shrinks on smaller screens)
- Keyboard navigation works (arrow keys)

**Dependencies:** None

---

### FE-002: Header Layout (Logo + Navbar + Specimen Count)

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Implement absolute header with three sections: logo (top-left), navbar (top-center), specimen count (top-right). Must remain on screen while content scrolls below.

**Files:**
- `src/App.tsx` — Already implemented; verify positioning
- `src/styles/globals.css` — Ensure z-index stacking correct

**Requirements:**
- Logo "ClawPark" clickable (goes to Home)
- Specimen count badge updates when claws added
- Height 16 units (sm: 20 units)
- Padding and spacing match design

**Acceptance Criteria:**
- Header stays fixed while scrolling content
- All three sections aligned correctly
- Specimen count reflects state
- Works on mobile without cutoff

**Dependencies:** FE-001

---

### FE-003: Screen Transition Animations

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Wrap each screen in AnimatePresence with consistent fade-and-slide transitions. Use mode="wait" to prevent overlap.

**Files:**
- `src/App.tsx` — Already uses AnimatePresence; verify all screens

**Requirements:**
- Initial: `opacity: 0, y: 8`
- Animate: `opacity: 1, y: 0`
- Exit: `opacity: 0, y: -8`
- Duration: 0.2s
- All screens wrapped

**Acceptance Criteria:**
- No screen shows until previous exits
- Transitions are smooth
- No visual glitches on fast navigation

**Dependencies:** FE-001, FE-002

---

## Phase 2: Home Screen

### FE-004: Home Screen Layout & Status Display

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Implement home dashboard showing status summary and next action recommendation. Fetches `/api/v1/home` on mount and displays:
- Connected identity (if Discord linked)
- Owned claw count
- Breedable pairs count
- Pending claims count
- Unsaved children count
- Recommended next action with CTA

**Files:**
- `src/components/Home/Home.tsx` — Already exists; extend with full payload display
- `src/types/home.ts` — Already defines HomePayload

**Requirements:**
- Display HomePayload from props
- Show loading state while fetching
- Show empty state if no data
- Each stat in card/badge format
- Priority action highlighted prominently

**Acceptance Criteria:**
- All fields from HomePayload visible
- Loading spinner shows during fetch
- Error state handled gracefully
- CTAs navigate to correct screens
- Responsive layout (stack on mobile)

**Dependencies:** FE-001, FE-002

---

### FE-005: Home Suggested Actions List

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Render suggested_actions array from HomePayload as actionable buttons. Each action shows label, description, CTA text, and navigates to target screen.

**Files:**
- `src/components/Home/Home.tsx` — Add action list component
- `src/types/home.ts` — SuggestedAction already defined

**Requirements:**
- List displays in priority order (lower number = higher priority)
- Each action card clickable
- Click navigates to suggested screen
- Show endpoint and method as hint for advanced users

**Acceptance Criteria:**
- All actions render
- Click on action navigates correctly
- Layout responsive
- Actions prioritized by order

**Dependencies:** FE-004

---

### FE-006: Home Loading & Error States

**Priority:** P1
**Status:** Not Started
**Complexity:** S

**Description:**
Handle loading and error states for `/api/v1/home` fetch. Show spinner while loading, error message if fetch fails, graceful empty state if no data.

**Files:**
- `src/components/Home/Home.tsx` — Add state handlers
- `src/store/useClawStore.ts` — fetchHome() already exists

**Requirements:**
- Spinner centered on screen during load
- Error message human-readable with "Retry" button
- Empty state explains what to do next
- Timeouts after 5 seconds

**Acceptance Criteria:**
- Loading state visible for 1+ second
- Error message clear and actionable
- Retry fetches again
- Empty state doesn't crash

**Dependencies:** FE-004

---

## Phase 3: Import Screen

### FE-007: Import ZIP Upload UI (Drag-and-Drop)

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Implement drag-and-drop zone for uploading OpenClaw workspace ZIPs. Must support both click-to-browse and drag-drop.

**Files:**
- `src/components/Import/Import.tsx` — Exists; verify drag-drop implementation
- `src/services/clawparkApi.ts` — importOpenClaw() exists

**Requirements:**
- Large drop zone with clear affordance
- Accepts .zip files only
- Shows selected file name and size
- Drag over highlights zone
- Click opens file picker
- Shows loading state during upload

**Acceptance Criteria:**
- Can drag ZIP onto zone
- Can click and select ZIP from disk
- File name and size display
- Upload starts immediately
- Loading spinner during request

**Dependencies:** FE-001, FE-002

---

### FE-008: Import Preview Display (Identity, Traits, Skills, Tools, Warnings)

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
After upload completes, show ImportPreview modal with parsed agent details before user confirms claim.

**Files:**
- `src/components/Import/Import.tsx` — Exists; extend preview display
- `src/types/specimen.ts` — ImportPreview defined

**Preview Must Show:**
- Agent identity (creature, role, directive, vibe, emoji)
- Soul traits (name, weight, visual symbol)
- Skill badges (name, dominance, icon)
- Tool badges (name, potency, description, icon)
- Warnings (if any)
- Fingerprint/provenance hash

**Requirements:**
- Each section collapsible/expandable
- Traits sorted by weight (highest first)
- Skills sorted by dominance
- Tools sorted by potency
- Warnings highlighted prominently
- Visual consistency with claw display

**Acceptance Criteria:**
- All parsed fields visible
- Warnings are clear and actionable
- Mobile scrollable if content long
- Each section clearly labeled

**Dependencies:** FE-007

---

### FE-009: Import Claim Confirmation & Discord Link

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Final step: confirm import and optionally link to Discord account. Button calls `/api/v1/specimens/:id/claim` with optional discordUserId.

**Files:**
- `src/components/Import/Import.tsx` — Add confirm section
- `src/store/useClawStore.ts` — claimClaw() exists

**Requirements:**
- "Confirm Import" button on preview
- Shows Discord connection status
- If connected, auto-includes Discord ID
- If not connected, can still claim (local-only)
- Claim success navigates to Nursery

**Acceptance Criteria:**
- Button disabled until preview shown
- Claim call includes correct discordUserId (or undefined)
- Success message shows
- Navigates to Nursery on success
- Error message if claim fails

**Dependencies:** FE-008

---

### FE-010: Import Error Handling (Parser Warnings, File Validation)

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Handle all error cases during import: invalid ZIP, missing required files, parse errors, network errors.

**Files:**
- `src/components/Import/Import.tsx` — Add error handlers

**Error Cases to Handle:**
- File is not ZIP (show: "Must be .zip file")
- ZIP missing IDENTITY.md (show: "Invalid OpenClaw workspace")
- Unparseable JSON in SOUL.md (show: "Corrupt agent data")
- Network error (show: "Upload failed, try again")
- File too large (show: "File exceeds size limit")

**Requirements:**
- Each error has clear user message
- Retry button always available
- Users not blocked by warnings (warnings ≠ errors)
- Timeout after 30 seconds

**Acceptance Criteria:**
- All error cases tested
- Messages are clear and actionable
- Retry works
- User can try different file
- Warnings don't prevent import

**Dependencies:** FE-007, FE-008

---

## Phase 4: Nursery Screen

### FE-011: Nursery Specimen Cards Grid

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Display all claimed specimens in a responsive grid. Each card shows:
- Avatar/visual (generated from ClawVisual)
- Name
- Identity (creature, role, emoji)
- Trait count, skill count, tool count (abbreviated)
- Breed state badge (ready/cooldown/ineligible)
- Provenance badge (genesis/bred/imported/claimed)

**Files:**
- `src/components/Nursery/Nursery.tsx` — Exists; verify card layout
- May need: `src/components/SpecimenCard.tsx` — Extract reusable card component

**Requirements:**
- Grid responsive: 1 col (mobile), 2 col (tablet), 3+ col (desktop)
- Cards have hover/active state
- Click to select for breeding
- Visual consistency with design system

**Acceptance Criteria:**
- All specimens render
- Cards responsive
- Hover/active states visible
- Clicking selects card
- Provenance badge correct

**Dependencies:** FE-004

---

### FE-012: Specimen Selection for Breeding (Multi-Select, State Display)

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Allow user to select exactly 2 specimens for breeding. Selection state manages:
- Can't select ineligible specimens (show disabled state)
- Selecting 3rd deselects 1st
- Selected state visual (border highlight, checkmark)
- Continue button appears when 2 selected

**Files:**
- `src/components/Nursery/Nursery.tsx` — Already uses selectedIds state

**Requirements:**
- Selection updates useClawStore.selectedIds
- 3rd click replaces 1st (ring buffer of 2)
- Disabled specimens show grayed out
- Selected show border and checkmark
- "Continue to Breed Lab" button (disabled until 2 selected)

**Acceptance Criteria:**
- Can select/deselect
- Max 2 selected
- Continue button enables at 2 selections
- Click navigates to breedLab screen

**Dependencies:** FE-011

---

### FE-013: Nursery Filtering & Sorting

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
Add filters and sort options: by breed state (ready/cooldown), by provenance (bred/imported/claimed), search by name.

**Files:**
- `src/components/Nursery/Nursery.tsx` — Add filter UI

**Requirements:**
- Dropdown to filter by breed state
- Dropdown to filter by provenance
- Search box (filters by name, case-insensitive)
- Multiple filters work together
- "Clear filters" button

**Acceptance Criteria:**
- Filters work individually and together
- Search is immediate (no delay)
- Mobile-friendly filter UI
- Clear shows all again

**Dependencies:** FE-011

---

## Phase 5: Breed Lab Screen

### FE-014: Breed Lab Parent Display (Side-by-Side)

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Show selected parent pair side-by-side with full identity, traits, skills, tools. Each parent card shows:
- Avatar/visual
- Name and identity
- Traits (sorted by weight)
- Skills (sorted by dominance)
- Tools (sorted by potency)
- Breed state (ready/cooldown)

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — Exists; verify parent display
- Reuse: `src/components/SpecimenCard.tsx` — May use similar structure

**Requirements:**
- Parents side-by-side on desktop
- Stacked on mobile
- Trait/skill/tool sections collapsible
- Visual consistency with Nursery cards
- Spacing between parents clear

**Acceptance Criteria:**
- Both parents visible and complete
- Responsive layout
- Content not cut off
- Visual hierarchy clear

**Dependencies:** FE-012

---

### FE-015: Breed Lab Compatibility Prediction Display

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Display breed prediction from `/api/v1/breeding/eligibility` + local predictBreed() engine:
- Predicted archetype
- Top 5 trait predictions (by probability)
- Mutation chance (%)
- Dimension forecast (identity/soul/skills/tools summary)

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — Show prediction prop
- `src/store/useClawStore.ts` — computePrediction() generates this

**Requirements:**
- Center card between parents
- Show archetype name prominently
- Trait predictions as badges (with probability %)
- Mutation chance as % bar
- Dimension forecast as 4-stat summary

**Acceptance Criteria:**
- Prediction visible on load
- All fields present
- Probability bars/percentages correct
- Updates when selection changes

**Dependencies:** FE-014

---

### FE-016: Breed Lab Prompt Input & Parent Conversation

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Text input for breeding prompt. User types prompt (e.g., "create a child that balances both parents' strengths") and clicks "Talk to parents" to generate conversation.

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — Exists
- `src/store/useClawStore.ts` — setBreedPrompt(), generateParentConversation()

**Requirements:**
- Text area for prompt input
- Default prompt: "Tell me what kind of child should survive this hatch."
- "Talk to Parents" button (disabled until 2 parents selected)
- Click generates breedingConversation in store
- Show loading spinner during generation
- Conversation displays as expandable section

**Acceptance Criteria:**
- Input accepts text
- Button generates conversation
- Conversation renders below input
- Each turn shows speaker name and content
- Works without conversation (optional)

**Dependencies:** FE-014, FE-015

---

### FE-017: Parent Conversation Display (Turn-by-Turn)

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Show conversation between user, parentA, parentB, and fusion as expandable section. Each turn shows speaker and content.

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — Add conversation display
- `src/types/claw.ts` — ConversationTurn defined

**Requirements:**
- Expandable section header "Parent Conversation"
- Each turn on own line
- Speaker name colored (blue=parentA, green=parentB, gray=fusion)
- Content wrapped and readable
- Optional (can skip conversation)

**Acceptance Criteria:**
- Conversation renders in order
- Speakers are labeled
- Content readable
- Mobile scrollable
- Collapsible to save space

**Dependencies:** FE-016

---

### FE-018: Breed Execution Button & Loading State

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
"Breed" button that calls breed flow in store. Shows loading state during execution, then navigates to birth screen.

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — Add breed button
- `src/store/useClawStore.ts` — breedSelected() exists

**Requirements:**
- Button disabled until 2 parents selected
- Button disabled if either parent ineligible (cooldown, etc.)
- Click calls breedSelected()
- Shows spinner while breeding (should be instant locally)
- On success, navigates to 'birth' screen
- On error, shows error toast

**Acceptance Criteria:**
- Button enables/disables correctly
- Click triggers breed
- Loading spinner visible briefly
- Transitions to birth screen
- Error handled gracefully

**Dependencies:** FE-014, FE-015

---

### FE-019: Breed Lab Back & Navigation

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Back button returns to Nursery with selection cleared. Header shows current step in flow.

**Files:**
- `src/components/BreedLab/BreedLab.tsx` — onBack prop exists

**Requirements:**
- Back button calls onBack (returns to Nursery)
- Clears selectedIds in store
- Header shows "Breed Lab" title
- Step indicator (optional)

**Acceptance Criteria:**
- Back button visible and clickable
- Returns to Nursery
- Selection cleared
- Consistent with other screens

**Dependencies:** FE-014

---

## Phase 6: Birth Animation & Lineage

### FE-020: Birth Scene — 8-Phase Reveal Animation

**Priority:** P0
**Status:** In Progress
**Complexity:** L

**Description:**
Elaborate birth animation sequence with 8 phases. Child visualizes through progressive reveals. Phases:
1. **idle** — Show parents, waiting
2. **merge** — Parents fade, child avatar begins to form
3. **blend** — Avatar blends colors (parents → child)
4. **birth** — Avatar fully forms with glow
5. **reveal_name** — Name appears
6. **reveal_archetype** — Archetype appears
7. **reveal_traits** — Traits list appears
8. **reveal_intro** — Intro text appears

**Files:**
- `src/components/Birth/BirthScene.tsx` — Exists; extend phases
- `src/store/useClawStore.ts` — birthPhase state exists

**Requirements:**
- Each phase 1-2 seconds duration
- Phase transitions on user click (auto-advance option)
- Framer Motion for all animations
- Respects prefers-reduced-motion (skip to final)
- Sound effects optional (via AudioContext if desired)

**Phases Detail:**
- **Merge** — Parents fade out, child avatar scales up
- **Blend** — Child colors shift from parent colors to final colors
- **Birth** — Glow effect, particle-like effect optional
- **Reveals** — Text fades in line by line

**Acceptance Criteria:**
- All 8 phases execute in order
- Smooth transitions
- Clicking advances phase
- Auto-advance after delay
- No visual glitches
- Mobile responsive

**Dependencies:** FE-018

---

### FE-021: Birth Scene Buttons (View Lineage, Breed Again, Back to Nursery)

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Three buttons at end of birth sequence:
- "View Lineage" (navigates to lineage screen)
- "Breed Again" (saves child, returns to Nursery)
- "Back to Nursery" (saves child, returns to Nursery)

**Files:**
- `src/components/Birth/BirthScene.tsx` — Add button section

**Requirements:**
- Buttons appear only after reveal_intro phase
- "View Lineage" → navigates to 'lineage' screen
- "Breed Again" → calls addChildToGallery(), stays in flow
- "Back to Nursery" → calls addChildToGallery(), navigates to 'nursery'
- Buttons disabled during animation phases

**Acceptance Criteria:**
- Buttons appear at correct time
- Click handlers work
- Navigation correct
- Child saved to gallery

**Dependencies:** FE-020

---

### FE-022: Lineage Graph Display (Inheritance Map, Doctrine, Conversation)

**Priority:** P0
**Status:** In Progress
**Complexity:** L

**Description:**
Multi-part lineage view showing:
- **Inheritance map** — Child's traits listed with origin (parentA/parentB/both/mutation)
- **Doctrine** — Child's philosophy/creed summary
- **Conversation** — Recording of parent conversation (if recorded)
- **Provenance** — Trail showing import/breed history

**Files:**
- `src/components/Lineage/LineageGraph.tsx` — Exists; extend completeness
- `src/components/Lineage/InheritanceMap.tsx` — May need to create
- `src/types/claw.ts` — ClawLineage defined

**Requirements:**
- **Inheritance:** Traits grouped by type (soul/skill/tool), origin shown
- **Doctrine:** Title, creed, summary in readable format
- **Conversation:** Collapsible section showing turn-by-turn
- **Provenance:** Path from grandparents → child

**Acceptance Criteria:**
- All inheritance records visible
- Doctrine readable
- Conversation toggleable
- Provenance chain traceable
- Responsive layout
- No missing data

**Dependencies:** FE-020

---

### FE-023: Lineage Navigation & Export (Save to File, Share)

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
Options to export lineage for sharing or archiving:
- Download as JSON
- Download as PDF (optional)
- Copy share link (future)

**Files:**
- `src/components/Lineage/LineageGraph.tsx` — Add export section

**Requirements:**
- Download JSON button (saves `child-id-lineage.json`)
- Download PDF button (optional, lower priority)
- Copy link button (requires backend endpoint)

**Acceptance Criteria:**
- JSON export works
- File has correct name
- JSON is valid and complete
- Mobile-friendly button layout

**Dependencies:** FE-022

---

## Phase 7: Connect & Auth

### FE-024: Connect Screen — Discord Sign-In UI

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Discord OAuth sign-in screen. Shows:
- Current connection status (connected/not connected)
- "Sign in with Discord" button (if not connected)
- Connected identity display (username, avatar, verified badge)
- "Disconnect" button (if connected)
- Explanation: local import/breed works without Discord

**Files:**
- `src/components/Connect/Connect.tsx` — Exists; extend implementation
- Backend: OAuth endpoints at `/api/auth/*` (not frontend responsibility)

**Requirements:**
- Button styled with Discord purple
- Redirect to Discord OAuth on click
- Display user info after redirect
- Logout clears session
- Explanation text clear and helpful

**Acceptance Criteria:**
- Button visible
- Click redirects (or navigates in test)
- Connection status displayed
- Disconnect works (clears session)
- Mobile responsive

**Dependencies:** FE-001

---

### FE-025: Connect Screen — Connected Identity Display

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Show connected Discord identity: username, avatar, verified badge, connection time.

**Files:**
- `src/components/Connect/Connect.tsx` — Add identity card
- `src/types/home.ts` — ConnectedIdentity defined

**Requirements:**
- Avatar image with border
- Username heading
- Verified badge (checkmark icon)
- "Connected since" timestamp
- Disconnect button

**Acceptance Criteria:**
- All fields visible
- Avatar loads
- Timestamp human-readable
- Disconnect button works

**Dependencies:** FE-024

---

### FE-026: Connect Screen — Explanation & Optional Mode

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Clear explanation that Discord is optional. All core features work locally. Discord provides verified identity and conversational breeding (future).

**Files:**
- `src/components/Connect/Connect.tsx` — Add explanation section

**Requirements:**
- Heading: "Discord Connection (Optional)"
- Bullet points explaining benefits
- Assurance: "Import and breed work without Discord"
- Link to `/skill.md` and `/discord.md` docs

**Acceptance Criteria:**
- Explanation clear
- No user confusion
- Links work
- Mobile readable

**Dependencies:** None

---

## Phase 8: Integration & Polish

### FE-027: API Integration — All `/api/v1/` Endpoints Connected

**Priority:** P0
**Status:** In Progress
**Complexity:** L

**Description:**
Verify all API calls wired correctly:
- GET /api/v1/home → Home screen
- POST /api/v1/imports/openclaw → Import upload
- POST /api/v1/specimens/:id/claim → Import claim
- GET /api/v1/specimens → Nursery list
- GET /api/v1/breeding/eligibility → Breed Lab prediction
- POST /api/v1/breeding/runs → Breed execution
- GET /api/v1/lineages/:id → Lineage view

**Files:**
- `src/services/clawparkApi.ts` — All endpoints defined
- Each component calling correct endpoints

**Requirements:**
- All calls use correct HTTP methods
- Query params correct
- Request bodies correct
- Response bodies matched to types
- Error handling consistent

**Acceptance Criteria:**
- Each endpoint called correctly
- Responses match expected types
- Error cases handled
- Loading states show
- No 404/500 errors in happy path

**Dependencies:** All screen tasks

---

### FE-028: Type Safety — All Components Use Correct Types

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Ensure strict TypeScript throughout. All props typed, no `any`, all API responses match types.

**Files:**
- All component files with `children`, `props` typed
- `src/types/` — All types imported and used
- `tsconfig.json` — Ensure `strict: true`

**Requirements:**
- No `any` types
- All props interfaces
- API responses validated against types
- No type errors on build

**Acceptance Criteria:**
- `tsc --noEmit` passes
- No eslint type errors
- All components fully typed

**Dependencies:** All tasks

---

### FE-029: Error Handling — Network Errors, Validation, Loading States

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Comprehensive error handling:
- Network failures (timeout, 500, connection lost)
- Validation errors (malformed data)
- User errors (invalid input)
- Loading states for all async operations

**Files:**
- Each component with error boundaries
- API error response handlers

**Requirements:**
- Toast/modal for errors (human-readable)
- Retry button for network errors
- Validation errors highlight field
- Loading spinners on all fetches
- Timeout after 30 seconds

**Acceptance Criteria:**
- All error cases tested
- Error messages clear
- Retry works
- No silent failures
- User knows what happened

**Dependencies:** All screen tasks

---

### FE-030: Responsive Design — Mobile, Tablet, Desktop

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Ensure all screens responsive across breakpoints (mobile 320px, tablet 768px, desktop 1440px).

**Files:**
- All components using Tailwind responsive prefixes
- `tailwind.config.js` — Verify breakpoints

**Requirements:**
- Mobile-first approach
- Touch-friendly buttons (48px min height)
- Typography scales with breakpoints
- Grid layouts collapse on mobile
- No horizontal scrolling

**Acceptance Criteria:**
- Tested on actual devices (or DevTools)
- No broken layouts
- Text readable on small screens
- Touch targets adequate
- Landscape and portrait work

**Dependencies:** All screen tasks

---

### FE-031: Accessibility — Keyboard Navigation, ARIA Labels, Color Contrast

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
WCAG 2.1 AA compliance:
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels on buttons and landmarks
- Color contrast ≥ 4.5:1
- Focus visible on all interactive elements
- Semantic HTML (buttons, links, headings)

**Files:**
- All interactive components with `aria-*` attributes
- CSS focus styles

**Requirements:**
- Tab order logical
- Screen reader announcements
- Focus indicator visible
- Color contrast tested
- No keyboard traps

**Acceptance Criteria:**
- Keyboard-only navigation works
- Screen reader reads all content
- Color contrast passes WCAG
- Focus visible always
- axe DevTools scan passes

**Dependencies:** All screen tasks

---

### FE-032: Performance — Asset Loading, Code Splitting, Caching

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
Optimize bundle size and load performance:
- Lazy load screens with React.lazy
- Code-split BreedLab, Birth, Lineage
- Cache API responses where appropriate
- Optimize images/SVGs

**Files:**
- `src/App.tsx` — Use React.lazy for screens
- `src/services/clawparkApi.ts` — Add caching layer
- Build config

**Requirements:**
- First Contentful Paint < 2s
- Time to Interactive < 3s
- Bundle size < 200KB (gzipped)
- Lazy load non-critical screens

**Acceptance Criteria:**
- Lighthouse score ≥ 90
- Bundle analyzed and optimized
- Screens load on demand
- No cumulative layout shift

**Dependencies:** All screen tasks

---

## Summary Table

| ID | Title | Priority | Complexity | Status |
|---|---|---|---|---|
| FE-001 | Glass Pill Navigation | P0 | S | In Progress |
| FE-002 | Header Layout | P0 | S | In Progress |
| FE-003 | Screen Transitions | P1 | S | In Progress |
| FE-004 | Home Status Display | P0 | M | In Progress |
| FE-005 | Home Suggested Actions | P1 | M | Not Started |
| FE-006 | Home Loading/Error States | P1 | S | Not Started |
| FE-007 | Import ZIP Upload | P0 | M | In Progress |
| FE-008 | Import Preview | P0 | M | In Progress |
| FE-009 | Import Claim & Discord | P1 | S | In Progress |
| FE-010 | Import Error Handling | P1 | M | In Progress |
| FE-011 | Nursery Grid | P0 | M | In Progress |
| FE-012 | Specimen Selection | P0 | S | In Progress |
| FE-013 | Nursery Filters | P2 | M | Not Started |
| FE-014 | Breed Lab Parents | P0 | M | In Progress |
| FE-015 | Compatibility Prediction | P0 | M | In Progress |
| FE-016 | Prompt Input & Conversation | P1 | M | In Progress |
| FE-017 | Conversation Display | P1 | S | In Progress |
| FE-018 | Breed Button & Loading | P0 | S | In Progress |
| FE-019 | Breed Lab Navigation | P1 | S | In Progress |
| FE-020 | Birth Animation (8-Phase) | P0 | L | In Progress |
| FE-021 | Birth Buttons | P0 | S | In Progress |
| FE-022 | Lineage Graph Display | P0 | L | In Progress |
| FE-023 | Lineage Export | P2 | M | Not Started |
| FE-024 | Connect Sign-In | P1 | M | In Progress |
| FE-025 | Connected Identity | P1 | S | In Progress |
| FE-026 | Connect Explanation | P1 | S | In Progress |
| FE-027 | API Integration | P0 | L | In Progress |
| FE-028 | Type Safety | P1 | M | In Progress |
| FE-029 | Error Handling | P1 | M | In Progress |
| FE-030 | Responsive Design | P1 | M | In Progress |
| FE-031 | Accessibility | P2 | M | Not Started |
| FE-032 | Performance | P2 | M | Not Started |

---

## Critical Path (MVP)

Complete in order for fastest MVP:
1. FE-001, FE-002, FE-003 (Navigation)
2. FE-004, FE-005, FE-006 (Home)
3. FE-007, FE-008, FE-009, FE-010 (Import)
4. FE-011, FE-012 (Nursery)
5. FE-014, FE-015, FE-016, FE-017, FE-018 (Breed Lab)
6. FE-020, FE-021 (Birth)
7. FE-022 (Lineage)
8. FE-024, FE-025, FE-026 (Connect)
9. FE-027, FE-028, FE-029, FE-030 (Integration & Polish)

**Estimated Timeline:** 6-8 weeks with 2 FE developers
