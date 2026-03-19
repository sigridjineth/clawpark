# ClawPark Discord MVP — Task Breakdown

**Reference**: `docs/prd-clawpark-moltbook-style.md`

**Goal**: Build a Discord-integrated breeding orchestration MVP that allows users to import OpenClaw agents locally, breed them through conversational Discord messages, and save children with full lineage tracking.

**Priority Surface**: Coordinator Bot Mode (dedicated ClawPark bot)

**Future Surface**: Skill-installed Claw Mode (protocol-compatible, not implemented in MVP)

---

## 1. MVP Completion Definition

The MVP is complete when:

1. Users can import local OpenClaw agent ZIPs (1 or more)
2. Users can ask Discord bot to breed agents using natural language
3. System suggests candidates or explains compatibility
4. System handles consent (auto-approve for same-owner, pending for cross-owner)
5. Breed executes and child is saved
6. Discord returns lineage summary

---

## 2. Scope

### Included

- Local ZIP import
- Nursery/Home specimen state
- Discord OAuth identity
- Coordinator Bot conversation
- Breeding intent → proposal → consent → run lifecycle
- Discord response formatting

### Excluded

- Guild-wide production rollout
- Slash command UI (natural language only)
- Multi-agent autonomous negotiation
- Public marketplace economy

---

## 3. Work Streams

MVP is organized into 6 streams:

1. **Core domain / contracts**
2. **Import and specimen registry**
3. **Breeding orchestration backend**
4. **Discord surface**
5. **Frontend integration**
6. **Verification and hardening**

---

## 4. Phase 0 — Contract Foundation

**Goal**: Freeze core contracts before implementation.

### Task 0.1 — Intent and Command Contract

Define natural language patterns and intent structure.

**Examples**:
- "breed these two"
- "find me a partner"
- "are they compatible?"
- "go ahead"
- "cancel"

**Deliverable**: Intent parsing spec in `docs/discord.md`

**Acceptance**: Backend and Discord surface use identical vocabulary.

### Task 0.2 — Ownership / Consent Policy

Define auto-approve vs. pending-consent cases.

**Cases**:
- `same-owner` → auto-approve
- `same-linked-identity` → auto-approve
- `cross-owner` → pending consent (24h timeout)
- `unknown-owner` → pending consent

**Deliverable**: Consent logic in `server/breedingConsent.ts`

**Acceptance**: Eligibility API and proposal lifecycle use same rules.

---

## 5. Phase 1 — Import and Registry

**Goal**: Stable specimen registry for orchestration.

### Task 1.1 — Parser Robustness

Improve `server/openclawParser.ts` to reliably extract:
- `IDENTITY.md` → identity (creature, role, directive, vibe, emoji)
- `SOUL.md` → traits
- `TOOLS.md` → tools
- `skills/*/SKILL.md` → skill badges

**Completion Criteria**:
- Import preview shows identity/traits/skills/tools
- 2+ test fixtures parse stably
- Warnings are clear and actionable

### Task 1.2 — Specimen State Model

Refine specimen ownership and breed state:
- Fields: `id, name, identity, soul, skills, tools, visual, ownership_state, breed_state, provenance`
- States: imported → claimed → breedable → cooldown → archived
- Provenance: source hash, fingerprint, claimed_by Discord user

**Completion Criteria**:
- Imported specimens appear in Nursery with consistent states

### Task 1.3 — Home Payload

Create or extend `/api/v1/home` endpoint.

**Minimum fields**:
- `connected_identity` — Discord user or null
- `owned_claw_count` — Number of claimed agents
- `breedable_pairs` — Available pairs
- `pending_imports` — Awaiting claim
- `unsaved_children` — Recent children not yet saved
- `what_to_do_next` — Recommended action

**Completion Criteria**:
- Frontend and Discord both call same `/home`
- Agents can decide next action in 3 seconds

---

## 6. Phase 2 — Breeding Orchestration Backend

**Goal**: Shared orchestration logic for UI and Discord.

### Task 2.1 — BreedingIntent Model

Add types and store for breeding requests.

**Models**:
- `BreedingIntent` — user's desire to breed
- `BreedingConsent` — permission tracking
- Statuses: intent_created → candidate_suggested → consent_pending → eligibility_checked → run_started → result_ready → saved/cancelled

**Completion Criteria**:
- Intent CRUD works
- Statuses transition correctly
- Multi-turn context preserved (user last intent)

### Task 2.2 — Candidate Suggestion

Service that suggests compatible breeding pairs.

**Input**:
- No target (find any pair)
- One target (find partner for this agent)
- Two targets (check compatibility)

**Output**:
- Candidate list with names
- Compatibility summary
- Block reason (if any)

**Completion Criteria**:
- "Find me a partner" requests return 1+ candidates or clear block reason

### Task 2.3 — Eligibility and Proposal

Endpoints for breed validation and consent.

**Endpoints**:
- `GET /api/v1/breeding/eligibility?parentA=...&parentB=...`
- `POST /api/v1/breeding/proposals`
- `POST /api/v1/breeding/proposals/:id/consent`

**Completion Criteria**:
- Proposal creation triggers consent logic
- Consent pending is tracked
- Auto-approve works for same-owner

### Task 2.4 — Breed Execution

Connect orchestration to breed engine.

**Endpoints**:
- `POST /api/v1/breeding/runs`
- `POST /api/v1/breeding/runs/:id/save`

**Completion Criteria**:
- Breed actually runs after consent approved
- Child saved with lineage

---

## 7. Phase 3 — Discord Surface MVP

**Goal**: Conversational breeding in Discord.

### Task 3.1 — Bot Setup

Basic Discord bot entrypoint.

- Message handling
- Intent parsing delegation
- Orchestration service calls
- Response formatting

**Completion Criteria**:
- Bot receives message
- Bot responds with status

### Task 3.2 — Intent Parsing

Extract breeding intent from natural language.

**Extract**:
- Is this a breeding request?
- Which agents (by name)?
- Is it a "suggest", "check", or "execute" intent?

**Fallback**: If ambiguous, ask clarifying candidates instead of failing.

**Completion Criteria**:
- 5-10 representative phrases parse correctly

### Task 3.3 — Response Formatter

Format orchestration results for Discord.

**Return types**:
- Candidate suggestion (list, compatibility)
- Compatibility check result
- Consent pending notice
- Blocked reason
- Success lineage summary

Keep concise (1-2 Discord messages).

**Completion Criteria**:
- User understands status and next action from one response

### Task 3.4 — Multi-Turn Context

Handle "go ahead" and "cancel" in Discord.

Store user's last intent so "go ahead" can execute it.

**Completion Criteria**:
- Multi-turn conversation maintains context

---

## 8. Phase 4 — Frontend Integration

**Goal**: UI and Discord share same state model.

### Task 4.1 — Connect Area

Discord sign-in UI.

- "Sign in with Discord" button
- Connected identity display
- Explanation of local vs. linked mode

**Completion Criteria**:
- User can see connection status
- Disconnect works

### Task 4.2 — Home Screen

Display `/home` payload.

- Status summary
- Next action recommendation
- Breedable pairs
- Pending claims

**Completion Criteria**:
- User knows what to do next

### Task 4.3 — UI / Discord Alignment

Ensure both surfaces work with same breed model.

- UI creates breeding intent same way Discord does
- Both surface read same Home payload
- Results don't conflict

**Completion Criteria**:
- Breeding from UI and Discord produces identical results

---

## 9. Phase 5 — Verification and Hardening

**Goal**: "It actually works" proof.

### Task 5.1 — API Contract Tests

Test core orchestration flows.

- Intent creation
- Candidate suggestion
- Consent pending
- Breed run success
- Lineage save

**Completion Criteria**:
- All happy paths automated

### Task 5.2 — Parser Regression Tests

Ensure import stability.

- 2+ OpenClaw ZIP fixtures
- Skill badge extraction verification

**Completion Criteria**:
- Parser doesn't regress on known fixtures

### Task 5.3 — Discord Integration Test

End-to-end flow via Discord.

**Steps**:
1. Import agents
2. Ask Discord to breed
3. Get candidates
4. Confirm breeding
5. Get result lineage

**Completion Criteria**:
- Happy path reproducible

### Task 5.4 — Failure Path Tests

Verify error handling.

- Cooldown enforcement
- Unknown specimen rejection
- Ambiguous request handling
- Cross-owner consent pending

**Completion Criteria**:
- Failures are logged and user is informed

---

## 10. Implementation Order

### Sprint 1

- Phase 0 (all tasks)
- Task 1.1 (parser)
- Task 1.2 (specimen state)
- Task 1.3 (home)

### Sprint 2

- Task 2.1 (intent model)
- Task 2.2 (candidate suggestion)
- Task 2.3 (proposal/consent)
- Task 2.4 (breed execution)

### Sprint 3

- Task 3.1 (bot setup)
- Task 3.2 (intent parsing)
- Task 3.3 (response formatting)
- Task 3.4 (multi-turn)

### Sprint 4

- Task 4.1 (Connect UI)
- Task 4.2 (Home UI)
- Task 4.3 (UI/Discord alignment)
- Phase 5 (all tests and hardening)

---

## 11. Key Files to Create/Modify

### Backend

**Create/Modify**:
- `server/breedingOrchestrator.ts` — 7-stage lifecycle (✓ exists, review)
- `server/breedingConsent.ts` — Consent logic (✓ exists, review)
- `server/openclawParser.ts` — ZIP parsing (extend)
- `src/types/breedingIntent.ts` — Intent types (✓ exists, review)

**New endpoints**:
- `GET /api/v1/home`
- `POST /api/v1/discord/intents`
- `GET /api/v1/breeding/eligibility`
- `POST /api/v1/breeding/proposals`
- `POST /api/v1/breeding/runs`

### Frontend

**New components**:
- `src/components/Connect/` — Discord sign-in
- `src/components/Home/` — Status and next action
- `src/services/clawparkHomeApi.ts` — Home endpoint caller

**Existing to extend**:
- `src/components/Nursery/` — Align with new state model
- `src/components/Breed Lab/` — Align with orchestration API

### Discord Bot

**New**:
- `server/discord/bot.ts` — Bot entrypoint
- `server/discord/intentParser.ts` — Message → intent
- `server/discord/responseFormatter.ts` — Result → Discord message
- `server/discord/multiTurnContext.ts` — User → last intent

---

## 12. Key Decisions

**Decision 1 — MVP Surface**: Coordinator Bot Mode (not Skill-installed Claw)
- Simplest implementation
- Fastest path to "it works"

**Decision 2 — Consent Defaults**: same-owner/same-linked → auto, others → pending
- Safety: cross-owner requires approval
- Simplicity: no complex rules

**Decision 3 — Marketplace**: Post-MVP
- Core value is local breeding
- Publish is nice-to-have

**Decision 4 — Discord Requirement**: Optional
- Local import/breed always works
- Discord is conversational layer, not gate

---

## 13. Risks

1. **Parser fragility** — Real OpenClaw workspaces vary
2. **Intent parsing errors** — "Breed" means different things; easy to misunderstand
3. **Consent model scope creep** — Can become very complex
4. **UI/Discord divergence** — Both might build breed logic separately
5. **Marketplace interference** — Existing code has too many concerns

---

## 14. Launch Checklist

Before MVP goes live:

- [ ] Import 1+ agents successfully
- [ ] Nursery shows claimed specimens
- [ ] `/api/v1/home` works
- [ ] Discord OAuth sign-in works
- [ ] Discord bot responds to breed intent
- [ ] Candidate suggestions accurate
- [ ] Consent pending works (cross-owner)
- [ ] Breed execution succeeds
- [ ] Lineage summary returned in Discord
- [ ] Child saved with full lineage
- [ ] Happy path tests pass
- [ ] Failure path tests pass
- [ ] skill.md, heartbeat.md, breeding.md, rules.md published

---

## 15. Next Documents to Create

1. `docs/breeding-system-design.md` — Deep dive on how breeding works (for UI designers)
2. `docs/discord-api-contract.md` — Bot and intent details
3. `docs/consent-policy.md` — Ownership and approval rules
4. `docs/home-payload-spec.md` — Full `/home` schema
