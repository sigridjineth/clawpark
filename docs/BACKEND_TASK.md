# Backend Task Breakdown — ClawPark

**Document Version:** v1.0
**Last Updated:** March 19, 2026
**Target:** Development team task assignment and tracking

---

## Overview

Backend tasks implement the ClawPark server API, data persistence, breeding orchestration, and Discord integration. Stack: Node.js/TypeScript, SQLite (or equivalent), OpenRouter LLM integration.

**Current Status:** Core routes exist. Specimen store, breeding orchestration, Discord bot partially implemented.

---

## Task Structure

Each task includes:
- **Task ID** — BE-001, BE-002, etc.
- **Title** — What to build
- **Priority** — P0 (critical path), P1 (required for MVP), P2 (nice-to-have)
- **Status** — Not Started / In Progress / Done
- **Description** — Detailed requirements
- **Files to Create/Modify** — Exact paths
- **Acceptance Criteria** — Testable conditions
- **Dependencies** — Which tasks must complete first
- **Complexity** — S (small), M (medium), L (large)

---

## Phase 1: Data Layer & Schema

### BE-001: SQLite Schema & Migrations

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Define SQLite schema with tables for specimens, imports, breeding runs, intents, proposals, sessions. Include indexes for fast queries.

**Files:**
- `server/db.ts` — Create database connection and migration runner
- `server/migrations/` — Create migration files (e.g., `001-init.sql`)

**Schema Tables:**

```sql
CREATE TABLE IF NOT EXISTS specimens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  claw_json TEXT NOT NULL,
  ownership_state TEXT NOT NULL DEFAULT 'imported',
  breed_state TEXT NOT NULL DEFAULT 'ready',
  discord_user_id TEXT,
  import_record_id TEXT,
  parent_a_id TEXT,
  parent_b_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_records (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  included_files TEXT NOT NULL,
  ignored_files TEXT NOT NULL,
  warnings TEXT NOT NULL,
  fingerprint TEXT NOT NULL UNIQUE,
  parsed_specimen_id TEXT,
  discord_user_id TEXT
);

CREATE TABLE IF NOT EXISTS breeding_runs (
  id TEXT PRIMARY KEY,
  parent_a_id TEXT NOT NULL,
  parent_b_id TEXT NOT NULL,
  prompt TEXT,
  conversation_json TEXT,
  prediction_json TEXT,
  result_child_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  saved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS breeding_intents (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT,
  source_surface TEXT NOT NULL,
  source_message TEXT NOT NULL,
  target_specimen_ids TEXT,
  status TEXT NOT NULL DEFAULT 'intent_created',
  suggested_candidates TEXT,
  block_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS breeding_proposals (
  id TEXT PRIMARY KEY,
  parent_a_id TEXT NOT NULL,
  parent_b_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  intent_id TEXT,
  consent_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  discord_handle TEXT,
  avatar_url TEXT,
  verified_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_specimens_discord ON specimens(discord_user_id);
CREATE INDEX idx_specimens_import ON specimens(import_record_id);
CREATE INDEX idx_specimens_parents ON specimens(parent_a_id, parent_b_id);
CREATE INDEX idx_imports_user ON import_records(discord_user_id);
CREATE INDEX idx_breeding_runs_parents ON breeding_runs(parent_a_id, parent_b_id);
CREATE INDEX idx_breeding_intents_user ON breeding_intents(discord_user_id);
CREATE INDEX idx_proposals_parents ON breeding_proposals(parent_a_id, parent_b_id);
```

**Requirements:**
- Support migration-up and migration-down
- Initialize on first run
- Handle concurrent writes safely (WAL mode)
- All timestamps ISO 8601 UTC

**Acceptance Criteria:**
- Schema initializes on startup
- All tables created
- Indexes created
- No SQL errors
- Schema matches code expectations

**Dependencies:** None

---

### BE-002: Specimen Store CRUD Operations

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Implement SpecimenStore with full CRUD:
- `importSpecimen(claw, manifest, fingerprint, discordUserId)` — Insert new specimen
- `getSpecimen(id)` — Fetch by ID
- `listSpecimens(filters)` — List with optional filters (ownership_state, discord_user_id)
- `claimSpecimen(id, discordUserId)` — Update ownership state
- `updateBreedState(id, state)` — Set to cooldown/ready/ineligible

**Files:**
- `server/specimenStore.ts` — Already exists; extend with all CRUD operations

**Methods:**

```typescript
interface Specimen {
  id: string;
  name: string;
  claw: Claw;
  ownershipState: OwnershipState;
  breedState: BreedState;
  discordUserId?: string;
  provenance: SpecimenProvenance;
  createdAt: string;
  updatedAt: string;
}

importSpecimen(claw, manifest, fingerprint, discordUserId?) → { importId, specimenId, specimen, importRecord }
getSpecimen(id) → Specimen | null
listSpecimens(filters?) → Specimen[]
claimSpecimen(id, discordUserId) → Specimen | { error: string }
updateBreedState(id, state) → Specimen | null
getImportRecord(id) → ImportRecord | null
```

**Requirements:**
- All queries return hydrated Specimen objects (not rows)
- Concurrent access safe (no race conditions)
- IDs are UUIDs (short 8-char versions for URLs)
- Timestamps auto-updated on write

**Acceptance Criteria:**
- All CRUD operations work
- Filters work correctly
- No N+1 queries
- Specimen objects fully hydrated
- Tests pass for all operations

**Dependencies:** BE-001

---

### BE-003: Import Record Store

**Priority:** P1
**Status:** Not Started
**Complexity:** S

**Description:**
Store and retrieve import records (metadata about uploaded ZIPs).

**Files:**
- `server/specimenStore.ts` — Add import methods

**Methods:**

```typescript
createImportRecord(manifest, fingerprint, discordUserId) → ImportRecord
getImportRecord(id) → ImportRecord | null
listImportRecords(discordUserId?) → ImportRecord[]
updateImportRecord(id, updates) → ImportRecord | null
```

**Requirements:**
- Track source kind (openclaw_zip), uploaded_at, included/ignored files, warnings
- Unique fingerprint per upload (prevents duplicates)
- Tracks parsed_specimen_id once claimed

**Acceptance Criteria:**
- Import records created and retrieved
- Fingerprint uniqueness enforced
- Can query by user

**Dependencies:** BE-001

---

## Phase 2: Specimen Import & Parsing

### BE-004: OpenClaw ZIP Parser (Robustness)

**Priority:** P0
**Status:** In Progress
**Complexity:** L

**Description:**
Harden `server/openclawParser.ts` to reliably parse diverse OpenClaw workspaces. Extract:
- `IDENTITY.md` → identity (creature, role, directive, vibe, emoji)
- `SOUL.md` → traits with weights
- `TOOLS.md` → tool badges with potency
- `skills/*/SKILL.md` → skill badges with dominance

**Files:**
- `server/openclawParser.ts` — Already exists; extend robustness

**Parser Must Handle:**
- Missing IDENTITY.md (error)
- Malformed SOUL.md JSON (error with context)
- Missing SOUL.md (use defaults)
- Missing TOOLS.md (optional, use empty array)
- Skills folder missing (optional)
- Deeply nested or unusual ZIP structures (best-effort parsing)

**Manifest Output:**

```typescript
{
  includedFiles: string[],
  ignoredFiles: string[],
  warnings: string[],
}
```

**Warnings Examples:**
- "IDENTITY.md missing required field: creature"
- "SOUL.md contains malformed JSON"
- "Tool badge missing potency; using default 0.5"

**Requirements:**
- Robust error messages
- Warnings don't block import (only errors block)
- Fingerprint generated from ZIP content
- Parsed in temp directory, cleaned up

**Acceptance Criteria:**
- Parse 2+ diverse OpenClaw ZIPs without errors
- Warnings clear and actionable
- No temp file leaks
- Fingerprints unique and reproducible
- Performance < 1 second per ZIP

**Dependencies:** BE-001

---

### BE-005: POST /api/v1/imports/openclaw Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Multipart form handler for ZIP upload. Validates, parses, stores import record, returns preview.

**Files:**
- `server/v1Routes.ts` — Already implemented; verify completeness

**Handler Logic:**
1. Read multipart form (file + optional discord_user_id)
2. Validate file is ZIP
3. Parse ZIP with openclawParser
4. Generate fingerprint
5. Check fingerprint uniqueness (prevent re-imports)
6. Create ImportRecord and Specimen
7. Return ImportPreview (not yet claimed)

**Request:**
```
POST /api/v1/imports/openclaw
Content-Type: multipart/form-data
file: <ZIP bytes>
discord_user_id: <optional>
```

**Response (201):**
```json
{
  "importId": "imp-abc123",
  "specimenId": "spec-def456",
  "specimen": { ... },
  "importRecord": { ... }
}
```

**Error Cases (400/409):**
- Not a ZIP file
- ZIP missing IDENTITY.md
- Fingerprint already imported
- File too large

**Requirements:**
- Max upload size: 10MB (configurable)
- Discord user ID optional (from session or form)
- Temp directory cleanup on error
- Fingerprint prevents duplicate imports

**Acceptance Criteria:**
- Upload succeeds with valid ZIP
- Preview shows all parsed fields
- Duplicate rejection works
- Error messages clear

**Dependencies:** BE-002, BE-003, BE-004

---

### BE-006: POST /api/v1/specimens/:id/claim Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Claim imported specimen, marking as owned. Updates ownership_state to "claimed".

**Files:**
- `server/v1Routes.ts` — Already implemented; verify

**Handler Logic:**
1. Get specimen by ID
2. Check not already claimed
3. Update ownership_state = "claimed"
4. Set discord_user_id if provided
5. Return updated Specimen

**Request:**
```
POST /api/v1/specimens/:id/claim
Content-Type: application/json
{
  "discord_user_id": "optional"
}
```

**Response (200):**
```json
{
  "id": "spec-abc123",
  "name": "Sage",
  "claw": { ... },
  "ownershipState": "claimed",
  "breedState": "ready",
  "provenance": { ... }
}
```

**Error Cases:**
- Specimen not found (404)
- Already claimed (400)

**Requirements:**
- Discord user ID from body or session
- Can claim without Discord (local-only)

**Acceptance Criteria:**
- Claim succeeds
- Ownership state updated
- Discord ID optional
- Errors handled

**Dependencies:** BE-002

---

## Phase 3: Breeding Orchestration Backend

### BE-007: BreedingIntent Model & Store

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Intent model tracks user's desire to breed from first expression through final result. 7-stage lifecycle:

```
intent_created → candidate_suggested → consent_pending →
eligibility_checked → run_started → result_ready → saved/cancelled
```

**Files:**
- `src/types/breedingIntent.ts` — Already exists; verify complete
- `server/breedingOrchestrator.ts` — Already exists; extend store

**BreedingIntent:**

```typescript
interface BreedingIntent {
  intentId: string;
  sourceSurface: 'discord' | 'web_ui';
  sourceMessage: string;
  requesterIdentity: { discordUserId?: string; handle?: string };
  targetSpecimenIds: string[];
  status: 'intent_created' | 'candidate_suggested' | 'consent_pending' | 'eligibility_checked' | 'run_started' | 'result_ready' | 'saved' | 'cancelled';
  suggestedCandidates: CandidateSuggestion[];
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidateSuggestion {
  specimenId: string;
  name: string;
  compatibilitySummary: string;
  ownerRelationship: 'same-owner' | 'same-linked-identity' | 'cross-owner' | 'unknown-owner';
  eligibleForAutoApprove: boolean;
}
```

**Store Methods:**
- `createIntent(params)` → BreedingIntent
- `getIntentById(id)` → BreedingIntent | null
- `updateIntentStatus(id, status)` → BreedingIntent
- `addCandidates(id, candidates)` → BreedingIntent
- `getUserLastIntent(discordUserId)` → BreedingIntent | null (for multi-turn)

**Requirements:**
- Store in-memory or DB (in-memory acceptable for MVP)
- Status transitions validated
- Timestamps auto-set
- Multi-turn context: map userId → last intentId

**Acceptance Criteria:**
- Intent CRUD works
- Status transitions correct
- Multi-turn context preserved
- No race conditions

**Dependencies:** BE-001

---

### BE-008: Candidate Suggestion Service

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Service that suggests breeding candidates based on breedability and compatibility.

**Files:**
- `server/breedingOrchestrator.ts` — Add suggestCandidates function

**Logic:**

```typescript
suggestCandidates(intent: BreedingIntent, deps: OrchestratorDeps): CandidateSuggestion[]
```

**Cases:**
- **No target:** Suggest top 3 breedable specimens
- **One target:** Find compatible partners (by trait overlap, different strengths)
- **Two targets:** Check compatibility (not used in suggest, used in eligibility)

**Compatibility Heuristic:**
- Different primary traits = good
- Similar breed state (both ready) = required
- Different dominance distribution = good
- Tool overlap < 50% = good

**Requirements:**
- Breedable = breed_state = 'ready' and not on cooldown
- Compatible = eligibility check passes
- Rank by compatibility score
- Return max 5 candidates

**Acceptance Criteria:**
- Suggestions are breedable
- No ineligible candidates suggested
- Ranking makes sense
- Performance acceptable (< 100ms)

**Dependencies:** BE-002, BE-007

---

### BE-009: GET /api/v1/breeding/eligibility Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
Check if two specimens can breed together. Returns eligibility and reason if blocked.

**Files:**
- `server/v1Routes.ts` — Already implemented; verify
- `server/breedingOrchestrator.ts` — eligibility logic

**Handler Logic:**
1. Fetch both specimens
2. Check breed states (must be 'ready' or not 'ineligible')
3. Return eligibility result with details

**Request:**
```
GET /api/v1/breeding/eligibility?parentA=spec-123&parentB=spec-456
```

**Response (200):**
```json
{
  "eligible": true,
  "parentA": { "id": "spec-123", "breedState": "ready", "eligible": true },
  "parentB": { "id": "spec-456", "breedState": "ready", "eligible": true }
}
```

**Block Reasons:**
- "parentA on cooldown (ends 2026-03-20)"
- "parentB ineligible (damaged)"
- "Specimens not found"

**Requirements:**
- Check both parents breedable
- Check not same specimen
- Check not recently bred together (cooldown rules)

**Acceptance Criteria:**
- Eligible specimens pass
- Ineligible blocked with reason
- Cooldown enforced
- Error cases handled

**Dependencies:** BE-002, BE-008

---

### BE-010: POST /api/v1/breeding/runs Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Execute breeding run. Validates eligibility, checks consent (if needed), calls breed engine, returns child.

**Files:**
- `server/v1Routes.ts` — Already implemented; verify
- `server/breedingOrchestrator.ts` — breed execution logic

**Handler Logic:**
1. Parse request (parentA, parentB, prompt)
2. Check eligibility
3. Check consent (if cross-owner)
4. Call breed engine
5. Create child Specimen
6. Apply cooldown to parents
7. Return BreedingRun result with child

**Request:**
```
POST /api/v1/breeding/runs
Content-Type: application/json
{
  "parentA": "spec-123",
  "parentB": "spec-456",
  "prompt": "optional breeding prompt"
}
```

**Response (201):**
```json
{
  "runId": "run-abc123",
  "status": "complete",
  "child": { ... },
  "inheritanceMap": [ ... ],
  "mutationOccurred": true
}
```

**Error Cases (400/401/403):**
- Either parent not found
- Not eligible (on cooldown, etc.)
- Consent pending (return 403 with proposal ID)
- Breed engine error

**Requirements:**
- Consent check before breed (multi-owner scenario)
- Breed executed in-process (fast)
- Child saved to DB immediately
- Parent cooldown applied
- Discord user ID tracked

**Acceptance Criteria:**
- Eligible pairs breed successfully
- Child saved with lineage
- Cooldown applied
- Consent blocking works
- Error cases handled

**Dependencies:** BE-002, BE-007, BE-009, BE-011

---

### BE-011: Breeding Consent & Proposal Model

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Track consent for cross-owner breeding. Different rules:
- Same owner → auto-approve
- Same Discord account → auto-approve
- Cross-owner → pending (24h timeout)
- Unknown owner → pending (24h timeout)

**Files:**
- `server/breedingConsent.ts` — Already exists; extend
- `src/types/breedingIntent.ts` — Proposal types

**BreedingProposal:**

```typescript
interface BreedingProposal {
  id: string;
  parentAId: string;
  parentBId: string;
  requesterId: string;
  consentStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}
```

**Store Methods:**
- `createProposal(parentAId, parentBId, requesterId)` → BreedingProposal
- `getProposal(id)` → BreedingProposal | null
- `updateConsent(id, status)` → BreedingProposal
- `checkAutoApprove(parentAId, parentBId, requesterId)` → boolean

**Auto-Approve Rules:**

```typescript
function isAutoApprove(parentA: Specimen, parentB: Specimen, requesterId: string): boolean {
  // Same owner
  if (parentA.discordUserId === parentB.discordUserId && parentA.discordUserId) {
    return true;
  }
  // Both owned by requester
  if (parentA.discordUserId === requesterId && parentB.discordUserId === requesterId) {
    return true;
  }
  return false;
}
```

**Requirements:**
- Proposal expires after 24 hours if not approved
- Approval requires owner Discord session
- Auto-approve checked before creating proposal
- Rejected proposals don't retry

**Acceptance Criteria:**
- Auto-approve works correctly
- Pending proposals require approval
- Expiration enforced
- Status transitions correct

**Dependencies:** BE-002, BE-007

---

## Phase 4: API Endpoints

### BE-012: GET /api/v1/home Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** M

**Description:**
Central status endpoint that agents/UI call to determine next action. Returns full HomePayload.

**Files:**
- `server/v1Routes.ts` — Already implemented; verify
- `server/homePayload.ts` — Already exists; extend

**Response (200):**
```json
{
  "connected_identity": {
    "discordUserId": "123456789",
    "discordHandle": "username",
    "avatarUrl": "...",
    "verifiedAt": "2026-03-19T12:00:00Z"
  },
  "owned_claw_count": 5,
  "breedable_pairs": 3,
  "pending_claims": 1,
  "unsaved_children": 0,
  "what_to_do_next": "Claim your imported agent to start breeding",
  "suggested_actions": [
    {
      "id": "claim_pending_import",
      "label": "Claim Imported Agent",
      "description": "You have 1 agent waiting to be claimed",
      "cta": "Claim Now",
      "screen": "import",
      "priority": 1
    }
  ]
}
```

**Logic:**
- Fetch all specimens owned by user (from Discord session)
- Count breedable pairs (both ready)
- Count pending claims (imported but not claimed)
- Find unsaved children (bred but not saved)
- Determine what_to_do_next based on state
- Generate suggested_actions in priority order

**Priorities:**
1. Pending imports (claim them first)
2. Breedable pairs (breed them)
3. Unsaved children (save them)
4. Explore marketplace (lowest)

**Requirements:**
- Discord session optional (no user → general recommendations)
- Response < 500ms
- All data fresh (no stale cache)

**Acceptance Criteria:**
- All fields present and correct
- Suggested actions ordered
- Discord identity included if logged in
- Counts accurate

**Dependencies:** BE-002, BE-003

---

### BE-013: GET /api/v1/specimens Endpoint

**Priority:** P0
**Status:** In Progress
**Complexity:** S

**Description:**
List all claimed specimens (optionally filtered).

**Files:**
- `server/v1Routes.ts` — Already implemented; verify

**Request:**
```
GET /api/v1/specimens?ownership_state=claimed&discord_user_id=123456789
```

**Response (200):**
```json
{
  "specimens": [ ... ],
  "total": 5
}
```

**Filters:**
- `ownership_state` — imported | claimed | archived | published
- `discord_user_id` — Filter by owner

**Requirements:**
- All filters work together
- Returns full Specimen objects
- No N+1 queries

**Acceptance Criteria:**
- Filters work
- Specimens fully hydrated
- Response < 200ms for 100 specimens

**Dependencies:** BE-002

---

### BE-014: GET /api/v1/specimens/:id & GET /api/v1/lineages/:id Endpoints

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Fetch individual specimen and fetch lineage tree.

**Files:**
- `server/v1Routes.ts` — Already implemented

**GET /api/v1/specimens/:id Response:**
```json
{
  "id": "spec-abc123",
  "name": "Sage",
  "claw": { ... },
  "ownershipState": "claimed",
  "breedState": "ready",
  "provenance": { ... }
}
```

**GET /api/v1/lineages/:id Response:**
```json
{
  "root": {
    "specimen": { ... },
    "parentA": { "specimen": { ... }, "parentA": null, "parentB": null },
    "parentB": { "specimen": { ... }, "parentA": null, "parentB": null }
  },
  "depth": 2
}
```

**Requirements:**
- Specimens include full Claw object
- Lineage is recursive tree structure
- Depth tracks generation count

**Acceptance Criteria:**
- Specimen fetched correctly
- Lineage tree complete
- No missing parents

**Dependencies:** BE-002

---

## Phase 5: Discord Integration

### BE-015: POST /api/v1/discord/intents Endpoint

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Create a breeding intent from Discord message. Parses natural language and initiates orchestration.

**Files:**
- `server/v1Routes.ts` — Already implemented
- `server/breedingOrchestrator.ts` — Already has orchestration

**Request:**
```
POST /api/v1/discord/intents
Content-Type: application/json
{
  "source_message": "breed these two",
  "source_surface": "discord",
  "requester_identity": { "discordUserId": "123456789", "handle": "username" },
  "target_specimen_ids": ["spec-123", "spec-456"]
}
```

**Response (201):**
```json
{
  "intentId": "intent-abc123",
  "status": "intent_created",
  "suggestedCandidates": [ ... ],
  "blockReason": null,
  "createdAt": "2026-03-19T12:00:00Z"
}
```

**Logic:**
1. Create BreedingIntent
2. If targets provided, check eligibility
3. If eligible, auto-approve (same owner)
4. If cross-owner, create proposal (consent pending)
5. Return intent with next action

**Requirements:**
- Discord user ID from session or body
- Support 0/1/2 target specimens
- Block if unknown species
- Return clear next action

**Acceptance Criteria:**
- Intent created
- Candidates suggested if needed
- Consent blocking works
- Clear next steps in response

**Dependencies:** BE-007, BE-008, BE-009

---

### BE-016: Discord Bot — Message Handler & Intent Parsing

**Priority:** P1
**Status:** In Progress
**Complexity:** L

**Description:**
Discord bot that listens for messages and parses breeding intents.

**Files:**
- `server/discord-bot.ts` — Already exists; extend

**Message Patterns to Recognize:**
- "breed these two" → intent_type: execute with 2 targets
- "breed [agent1] and [agent2]" → extract names
- "find me a partner for [agent]" → intent_type: find_match
- "is this pair compatible?" → intent_type: compare
- "go ahead" or "do it" → intent_type: execute (from last intent)
- "cancel" → intent_type: cancel

**Parser Output:**

```typescript
interface ParsedMessage {
  intentType: 'execute' | 'find_match' | 'compare' | 'cancel';
  specimenNames: string[];
  confidence: number; // 0-1
  ambiguity?: string; // If unclear
}
```

**Bot Flow:**
1. Receive message
2. Parse intent
3. Call `/api/v1/discord/intents`
4. Get response (suggestions / block reason / next action)
5. Format response for Discord
6. Post reply

**Requirements:**
- Case-insensitive parsing
- Handle typos (fuzzy matching?)
- Multi-turn: remember last intent per user
- Confidence scoring (prompt Claude if < 0.7)

**Acceptance Criteria:**
- 5+ test phrases parse correctly
- Bot responds to messages
- Multi-turn context works
- Ambiguous requests ask for clarification

**Dependencies:** BE-007, BE-015

---

### BE-017: Discord Bot — Response Formatter

**Priority:** P1
**Status:** In Progress
**Complexity:** M

**Description:**
Format orchestration results for Discord readability. Concise, clear, actionable.

**Files:**
- `server/discord/responseFormatter.ts` — Create

**Response Types:**

```typescript
function formatSuggestion(candidates: CandidateSuggestion[]): string
function formatCompatibility(eligibility: EligibilityResult): string
function formatConsentPending(proposal: BreedingProposal): string
function formatSuccess(result: BreedResult): string
function formatError(error: string): string
```

**Examples:**

Suggestion:
```
I found 3 breedable agents:
1. Bolt (speedster, 5 traits)
2. Prism (glass-breaker, 6 traits)
3. Echo (amplifier, 4 traits)

Which would you like to breed with Sage?
```

Compatibility:
```
Sage + Bolt are compatible!
- Sage: Creator, 5 traits, 3 skills
- Bolt: Speedster, 5 traits, 2 skills
- Predicted archetype: Hybrid Creator
- Mutation chance: 15%

Ready to breed?
```

Success:
```
Congrats! A new agent born:
Name: Nova (Gen 2)
Archetype: Luminous Creator
Traits: Creator (from Sage), Speed (from Bolt), Resilience (mutation)
Skills: Creation, Swift Thinking, Adaptation

Saved to your nursery!
```

**Requirements:**
- Keep under 2000 characters (fits in Discord message)
- Use Discord formatting (bold, code blocks)
- Include agent emojis if available
- Link to lineage if needed

**Acceptance Criteria:**
- All response types formatted
- Messages readable
- No formatting errors
- Mobile readable (no huge tables)

**Dependencies:** BE-008, BE-015

---

### BE-018: Discord Bot — Multi-Turn Context

**Priority:** P1
**Status:** In Progress
**Complexity:** S

**Description:**
Remember user's last intent to handle "go ahead" / "cancel" / "use a different partner" follow-ups.

**Files:**
- `server/breedingOrchestrator.ts` — Add userLastIntent map

**Flow:**
1. User: "breed this pair"
2. Bot: Shows candidates with compatibility
3. User: "go ahead" or "the second one"
4. Bot: Uses last intent + new selection

**Methods:**
- `setUserLastIntent(discordUserId, intentId)` — Store after intent created
- `getUserLastIntent(discordUserId)` → BreedingIntent | null
- Clean up old intents after 24 hours

**Requirements:**
- One intent per user at a time
- Intents expire after 24 hours
- Context preserved across messages

**Acceptance Criteria:**
- "Go ahead" works
- "Cancel" clears intent
- Old intents cleaned up
- No context collision across users

**Dependencies:** BE-007, BE-016

---

## Phase 6: Contract Documents

### BE-019: Create Agent-Readable Contract Files

**Priority:** P0
**Status:** Not Started
**Complexity:** M

**Description:**
Generate skill.md, heartbeat.md, breeding.md, rules.md, discord.md, onboarding.md. These are served at `/skill.md`, `/heartbeat.md`, etc.

**Files to Create:**
- `public/skill.md`
- `public/heartbeat.md`
- `public/breeding.md`
- `public/rules.md`
- `public/discord.md`
- `public/onboarding.md`

**skill.md Contents:**
- What ClawPark is
- Base API URL
- Key endpoints and actions
- Example curl requests
- Link to heartbeat.md

**heartbeat.md Contents:**
- Recommended check frequency (1/day or on-demand)
- How to call `/home`
- Priority actions in order
- Example response

**breeding.md Contents:**
- Eligibility check
- Creating intent
- Consent rules
- Breed run execution
- Lineage reading

**rules.md Contents:**
- Privacy (local-first)
- Provenance (lineage immutable)
- File safety (deny list)
- Ownership rules
- Import restrictions

**discord.md Contents:**
- Command patterns
- Coordinator Bot Mode
- Multi-turn flow
- Response contract

**Requirements:**
- All in Markdown, clear English
- Include code examples
- Link to API documentation
- Tested by reading agents

**Acceptance Criteria:**
- All files created and deployed
- Agent can read `/skill.md` and understand API
- Examples are accurate
- No dead links

**Dependencies:** BE-012

---

## Phase 7: Testing

### BE-020: Unit Tests — Specimen Store & CRUD

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Test all specimen store operations: import, claim, list, filter, breed state updates.

**Files:**
- `server/__tests__/specimenStore.test.ts`

**Test Cases:**
- Import specimen, verify stored
- Claim specimen, verify ownership updated
- List all, list with filter, verify accuracy
- Duplicate fingerprint rejected
- Breed state transitions
- Concurrent writes (no race)

**Requirements:**
- Use Jest or Vitest
- Test fixtures with real OpenClaw data
- Mocked DB or SQLite :memory:

**Acceptance Criteria:**
- All CRUD operations tested
- Edge cases covered
- Tests pass
- Coverage > 80%

**Dependencies:** BE-002, BE-003

---

### BE-021: Integration Tests — API Endpoints

**Priority:** P1
**Status:** Not Started
**Complexity:** L

**Description:**
End-to-end tests for key API flows using real HTTP requests.

**Files:**
- `server/__tests__/api.integration.test.ts`

**Test Scenarios:**
1. Import → Claim → List workflow
2. Breed eligibility check → Breed execution
3. Home endpoint returns correct payload
4. Error cases (bad input, not found, etc.)
5. Consent pending blocks breed until approved

**Requirements:**
- Spin up test server
- Use supertest or similar
- Test fixtures (sample ZIPs)
- Cleanup after tests

**Acceptance Criteria:**
- Happy path flows work
- Error cases handled
- Tests pass
- Coverage > 70%

**Dependencies:** BE-005, BE-009, BE-012

---

### BE-022: Parser Regression Tests

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Test OpenClaw parser on real and edge-case ZIPs. Prevent regressions.

**Files:**
- `server/__tests__/openclawParser.test.ts`
- `server/__tests__/fixtures/` — Sample agent ZIPs

**Test Cases:**
- Parse Sage agent ZIP
- Parse agent with missing TOOLS.md
- Parse agent with malformed SOUL.md
- Extract traits, skills, tools correctly

**Requirements:**
- 2-3 diverse test fixtures
- Verify all fields extracted
- Warnings generated correctly

**Acceptance Criteria:**
- Parser doesn't regress
- All fixtures pass
- Warnings accurate

**Dependencies:** BE-004

---

### BE-023: Discord Intent Parsing Tests

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
Test intent parser on diverse messages to ensure accuracy.

**Files:**
- `server/__tests__/discord-intentParser.test.ts`

**Test Phrases:**
- "breed Sage and Bolt"
- "find a partner for Echo"
- "are these two compatible?"
- "go ahead"
- "cancel"
- Variations (capitalization, punctuation, etc.)

**Requirements:**
- Fuzzy matching for agent names
- Confidence scoring

**Acceptance Criteria:**
- 5+ test phrases parse correctly
- Ambiguous requests identified
- Confidence scores make sense

**Dependencies:** BE-016

---

## Phase 8: Auth & Sessions

### BE-024: Discord OAuth Flow

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Implement Discord OAuth endpoints for sign-in / sign-out.

**Files:**
- `server/auth.ts` — Create OAuth handlers
- `server/sessions.ts` — Already exists; extend

**Endpoints:**
- `GET /api/auth/discord` — Redirect to Discord
- `GET /api/auth/discord/callback` — OAuth callback
- `POST /api/auth/logout` — Clear session

**Flow:**
1. Frontend clicks "Sign in with Discord"
2. Redirects to `/api/auth/discord`
3. Bot redirects to Discord OAuth
4. User approves
5. Discord redirects to `/api/auth/discord/callback?code=...`
6. Backend exchanges code for token
7. Creates session cookie
8. Redirects to frontend home

**Requirements:**
- Secure session tokens (signed JWTs or opaque)
- Session expires after 30 days
- HttpOnly, Secure cookies
- CSRF protection

**Acceptance Criteria:**
- OAuth flow works end-to-end
- Session created on callback
- Cookie set correctly
- Logout clears session

**Dependencies:** BE-001

---

### BE-025: Session Management & Validation

**Priority:** P1
**Status:** Not Started
**Complexity:** S

**Description:**
Read/validate sessions from cookies. Extract Discord user ID for API requests.

**Files:**
- `server/sessions.ts` — Already exists; add read/validate

**Methods:**
- `readSessionUserId(cookies, secret)` → string | null
- `createSession(discordUserId, discordHandle, avatarUrl)` → sessionToken
- `validateSession(token)` → { discordUserId, verified } | null

**Requirements:**
- Signatures verified with secret
- Expiry checked
- Optional (APIs work without session)

**Acceptance Criteria:**
- Sessions created and validated
- Expired sessions rejected
- User ID extracted correctly

**Dependencies:** BE-024

---

## Phase 9: Hardening & Deployment

### BE-026: Error Handling & Logging

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Comprehensive error handling and structured logging for debugging.

**Files:**
- All route handlers with try/catch
- `server/logger.ts` — Create logging utility

**Requirements:**
- All errors logged with context
- User-facing error messages (no internals exposed)
- HTTP status codes correct (400/401/403/404/500)
- Errors don't crash server
- Request/response logging optional (toggle)

**Acceptance Criteria:**
- No unhandled promise rejections
- Error messages clear
- Logs helpful for debugging
- All endpoints have error handlers

**Dependencies:** All API tasks

---

### BE-027: Input Validation & Sanitization

**Priority:** P1
**Status:** Not Started
**Complexity:** M

**Description:**
Validate all inputs (query params, JSON bodies) before processing.

**Files:**
- `server/validation.ts` — Create validator utilities
- All endpoints with validation

**Validations:**
- String/number/boolean types
- Length limits (IDs < 100 chars, names < 256 chars)
- Enum values (breed_state must be one of: ready/cooldown/ineligible)
- No code injection
- JSON well-formed

**Requirements:**
- Reject invalid input with 400 + reason
- Sanitize user input (strip HTML, etc.)
- Type check all IDs and UUIDs

**Acceptance Criteria:**
- Invalid inputs rejected
- Error messages helpful
- No injection attacks possible
- All data validated before use

**Dependencies:** All API tasks

---

### BE-028: Performance & Load Testing

**Priority:** P2
**Status:** Not Started
**Complexity:** M

**Description:**
Ensure API performs well under load. Benchmark critical paths.

**Files:**
- `server/__tests__/load.test.ts` — Load tests
- `server/performance.ts` — Metrics/monitoring

**Benchmarks:**
- Home endpoint < 200ms for 100 specimens
- List specimens < 100ms for 50 specimens
- Breeding < 1 second (in-process)
- Import ZIP parse < 1 second

**Requirements:**
- Simulate 10+ concurrent requests
- Identify bottlenecks
- Add indexes if needed
- Profile with Node.js profiler

**Acceptance Criteria:**
- All endpoints meet SLA
- No memory leaks
- Stable under load

**Dependencies:** All API tasks

---

### BE-029: Database Backups & Recovery

**Priority:** P2
**Status:** Not Started
**Complexity:** S

**Description:**
SQLite backup strategy. Daily backups, recovery process.

**Files:**
- `server/backup.ts` — Create backup utility
- Deployment scripts

**Requirements:**
- Daily automated backup to disk or cloud
- Backup rotation (keep last 7 days)
- Recovery procedure documented
- Test recovery monthly

**Acceptance Criteria:**
- Backup runs daily
- Old backups deleted
- Recovery process documented

**Dependencies:** BE-001

---

## Summary Table

| ID | Title | Priority | Complexity | Status |
|---|---|---|---|---|
| BE-001 | SQLite Schema | P0 | M | In Progress |
| BE-002 | Specimen CRUD | P0 | M | In Progress |
| BE-003 | Import Record Store | P1 | S | Not Started |
| BE-004 | ZIP Parser | P0 | L | In Progress |
| BE-005 | Import Endpoint | P0 | M | In Progress |
| BE-006 | Claim Endpoint | P0 | S | In Progress |
| BE-007 | Intent Model | P0 | M | In Progress |
| BE-008 | Candidate Suggestion | P0 | M | In Progress |
| BE-009 | Eligibility Endpoint | P0 | S | In Progress |
| BE-010 | Breeding Runs Endpoint | P0 | M | In Progress |
| BE-011 | Consent & Proposals | P1 | M | In Progress |
| BE-012 | Home Endpoint | P0 | M | In Progress |
| BE-013 | List Specimens | P0 | S | In Progress |
| BE-014 | Get Specimen/Lineage | P1 | S | In Progress |
| BE-015 | Discord Intents Endpoint | P1 | M | In Progress |
| BE-016 | Discord Bot Handler | P1 | L | In Progress |
| BE-017 | Response Formatter | P1 | M | In Progress |
| BE-018 | Multi-Turn Context | P1 | S | In Progress |
| BE-019 | Contract Files | P0 | M | Not Started |
| BE-020 | Specimen Store Tests | P1 | M | Not Started |
| BE-021 | API Integration Tests | P1 | L | Not Started |
| BE-022 | Parser Regression Tests | P1 | M | Not Started |
| BE-023 | Intent Parser Tests | P2 | M | Not Started |
| BE-024 | Discord OAuth | P1 | M | Not Started |
| BE-025 | Session Management | P1 | S | Not Started |
| BE-026 | Error Handling | P1 | M | Not Started |
| BE-027 | Input Validation | P1 | M | Not Started |
| BE-028 | Load Testing | P2 | M | Not Started |
| BE-029 | Backups & Recovery | P2 | S | Not Started |

---

## Critical Path (MVP)

Complete in order for fastest MVP:
1. BE-001, BE-002, BE-003 (Data layer)
2. BE-004, BE-005, BE-006 (Import)
3. BE-007, BE-008, BE-009, BE-010, BE-011 (Breeding orchestration)
4. BE-012, BE-013, BE-014 (Core APIs)
5. BE-015, BE-016, BE-017, BE-018 (Discord)
6. BE-019 (Contract docs)
7. BE-020, BE-021, BE-022 (Testing)
8. BE-024, BE-025 (Auth)
9. BE-026, BE-027 (Hardening)

**Estimated Timeline:** 8-10 weeks with 2 BE developers
