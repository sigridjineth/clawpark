# Product Requirements Document — ClawPark

## Moltbook-style Local OpenClaw Breeding System

- **Document Version:** v1.0
- **Last Updated:** March 19, 2026
- **Status:** Active
- **Purpose:** Define ClawPark as an agent-native, import-first breeding hatchery for OpenClaw agents.

---

## 1. Product Overview

### 1.1 One-Line Definition

ClawPark is a local agent breeding lab where users import OpenClaw agents, claim ownership, breed new agents with tracked lineage, and optionally publish to a marketplace. The system is designed first for human users and agents operating locally, with marketplace sharing as an optional secondary feature.

### 1.2 Core Design Principles

ClawPark is intentionally designed as a **Jurassic Park-style genome hatchery**:

- **Import-first**: Users bring their own local OpenClaw agents via ZIP.
- **Home-first**: The system shows the user what they need to do next in one glance.
- **Claim before publish**: Breeding and lineage tracking happen locally by default. Publishing to the marketplace is optional.
- **Local/private by default**: All data stays local unless explicitly published.
- **Marketplace is optional**: The core value loop (import → breed → lineage) works without it.
- **Agent-readable contracts**: Product behavior is documented in skill.md, heartbeat.md, and breeding.md files that agents can read.
- **Conversation-driven breeding**: Before breeding two agents together, users can talk to both parents to shape their child.

---

## 2. Problem Statement

Currently, ClawPark has these issues:

1. **Real user value is unclear**: Users want to "bring two local agents, breed them, and see the child lineage" — but that core flow is not the focus.

2. **Marketplace dominates**: The current structure emphasizes publish/browse/claim as primary, when the real value is import/breed/lineage.

3. **No agent-friendly documentation**: Unlike Moltbook, there's no skill.md, heartbeat.md, or rules.md that agents can read to understand how to use ClawPark.

4. **No single entry point for state**: Users don't know if they need to import, breed, claim, or review lineage. There's no `/home` endpoint that summarizes the next action.

5. **Discord integration is undefined**: Discord OAuth is in the code, but its purpose is unclear: Is it for publishing? Onboarding? Optional?

6. **No Discord breeding orchestration**: Users can't ask "breed this pair" in Discord and have a conversation-driven workflow.

---

## 3. Vision

### 3.1 Product Vision

ClawPark is an **OpenClaw breeding hatchery**. Users can:

- Import local OpenClaw agent ZIPs
- Read their identity, traits, skills, and tools
- Talk to both parents before breeding
- Create a child with tracked lineage and doctrine
- Save the child to their local collection
- Optionally publish to marketplace for sharing or discovery

All of this works without Discord, but Discord provides a conversational interface for orchestrating the entire flow.

### 3.2 Design Principles

1. **Import-first** — Start with your local agents.
2. **Home-first** — One screen shows what to do next.
3. **Claim before publish** — Local ownership before marketplace visibility.
4. **Local/private by default** — No data leaves unless you choose to publish.
5. **Marketplace is optional** — Core breeding works without it.
6. **Agent-readable product contract** — skill.md, heartbeat.md, breeding.md, rules.md.
7. **Heartbeat-driven participation** — Agents check in regularly and decide what to do next.
8. **Discord-linked identity, local-first behavior** — Identity can be verified, but local breeding always works.
9. **Conversation-driven breeding orchestration** — Both UI and Discord support talking to parents before breeding.

---

## 4. Goals and Non-Goals

### 4.1 Goals

The MVP must achieve:

1. Users can import local OpenClaw agent ZIPs (one or more).
2. Imported agents appear in a Nursery/Gallery with their identity, traits, skills, and tools visible.
3. Two agents can be selected and bred together in a Breed Lab.
4. The child is created with full lineage (inheritance map, conversation, doctrine).
5. The child can be saved to the local collection.
6. The system provides agent-readable contracts:
   - `skill.md` — How to use ClawPark
   - `heartbeat.md` — When and what to check
   - `breeding.md` — How to breed
   - `rules.md` — Safety and privacy rules
   - `skill.json` — Machine-readable metadata
7. Users can optionally connect a Discord account for verified identity.
8. Discord connection is **optional** — local import/breed works without it.
9. Users can ask Discord to breed agents using natural language.
10. The system supports two Discord modes:
    - **Coordinator Bot** — dedicated ClawPark bot (MVP priority)
    - **Skill-installed Claw** — a Claw with ClawPark skill installed (future)

### 4.2 Non-Goals

The MVP does **not**:

- Implement a complete commercial marketplace or economy
- Support payment or ownership trading
- Run actual OpenClaw runtime
- Make marketplace a core part of the flow
- Build multi-user social networking features

---

## 5. Users and Core Scenarios

### 5.1 Primary Users

**Local OpenClaw Users**: Have one or more OpenClaw agents locally, want to breed them and track lineage.

**Agents/Automators**: Want to read ClawPark's contracts and automate import/breed/save via CLI or script.

**Discord Users**: Want to breed agents through conversational Discord messages.

### 5.2 Core Jobs to Be Done

- "I have two local agents in ZIPs. I want to breed them, see the child, and save the lineage."
- "I want ClawPark to tell me what to do next with one `/home` call."
- "I want to optionally link my Discord account so my specimens show who published them."
- "I want to ask my Discord bot to breed two specific agents."

---

## 6. Core User Flows

### 6.1 Primary Flow: Import → Breed → Save (Local)

1. User opens ClawPark
2. Sees **Home** with status summary
3. Clicks **Import** and uploads agent ZIP files
4. Reviews preview (identity, traits, skills, tools, warnings)
5. Confirms import as local claimed specimens
6. Selects two specimens in **Nursery**
7. Enters **Breed Lab**
8. Sees compatibility/prediction
9. Optionally talks to parents with a prompt
10. Clicks **Breed**
11. Sees child born with lineage
12. Saves child

### 6.2 Secondary Flow: Connect Discord Identity

1. User goes to **Connect**
2. Clicks **Sign in with Discord**
3. Approves access (read username, avatar, email)
4. Returns to Home with connected identity visible
5. Optional: Published specimens show verified attribution

### 6.3 Discord Flow: Conversational Breeding

1. User messages ClawPark bot in Discord
2. Says "breed this pair" or "find me a mate for this one"
3. Bot suggests candidates and shows compatibility
4. User says "do it"
5. Bot confirms consent status
6. Breed runs and child is saved
7. Bot posts lineage summary to Discord

---

## 7. Product Information Architecture

### 7.1 Main Navigation

- **Connect** — Discord identity linking (optional)
- **Home** — Status summary and next action
- **Import** — Upload OpenClaw ZIPs
- **Nursery** — Local collection of owned agents
- **Breed Lab** — Select parents and breed
- **Lineage** — View child result, inheritance, doctrine
- **Exchange** — Marketplace (secondary feature)

### 7.2 Area Responsibilities

**Connect**: Discord sign-in, verified identity display, explanation of local vs. linked mode.

**Home**: Current summary (owned agents, breedable pairs, pending claims, unsaved children, warnings), next action recommendation.

**Import**: ZIP upload, parser preview (identity/traits/skills/tools/warnings), import confirmation.

**Nursery**: List of claimed local specimens, breedability state, selection for Breed Lab.

**Breed Lab**: Parent selection, compatibility/prediction display, parent conversation, breed execution.

**Lineage**: Child result, inheritance map, doctrine, provenance, save/export.

**Exchange**: Publish/download/install (non-core, secondary feature).

---

## 8. Moltbook-Style Contract Documents

ClawPark provides the following documents for agents and automation tools:

### 8.1 `skill.md`

Human- and agent-readable introduction:
- What ClawPark is
- Base API URL
- How to import agents
- How to check `/home` status
- How to breed
- How to view lineage
- Default behavior: local/private by default

### 8.2 `heartbeat.md`

Tells agents when and how to check in:
- Recommended check frequency
- How to call `/home`
- Priority actions:
  1. Pending imports
  2. Claims needed
  3. Breedable pairs available
  4. Unsaved newborns
  5. Lineage review needed
  6. Optional marketplace publish

### 8.3 `breeding.md`

Technical breeding guide:
- How to check eligibility
- How to create a breed intent
- How to handle consent
- How to save child
- Lineage reading rules
- Cooldown/failure semantics

### 8.4 `rules.md`

Safety and operation guidelines:
- Privacy: all data is local by default
- Provenance integrity: lineage cannot be altered
- Unsafe file rejection: denylist of risky files
- Overwrite policy: import never overwrites without consent
- Import restrictions: ZIP structure requirements
- Publish rules: what can be published
- Local-first policy: marketplace is optional

### 8.5 `skill.json`

Machine-readable metadata:
- API base URL
- Supported endpoints
- Required tools/binaries
- Documentation file references

### 8.6 `discord.md`

Discord interaction guide:
- Two modes: Coordinator Bot and Skill-installed Claw
- Natural language command examples
- Breeding orchestration lifecycle
- Consent rules
- Response contract

---

## 9. Functional Requirements

### 9.1 Discord Onboarding

**Requirement**: Users can connect a Discord account.

- Sign in via Discord OAuth
- Discord connection is **optional** — local import/breed works without it
- System displays: Discord username, avatar, connected state
- Discord identity can be used for verified attribution in publish/claim

**Acceptance Criteria**:
- User can sign in with "Sign in with Discord"
- Connected identity visible in **Connect** area
- Import and breed work without Discord
- Published specimens show verified attribution if connected

### 9.2 Discord Interaction Modes

**Requirement**: System distinguishes two modes.

1. **Coordinator Bot Mode** (MVP): Dedicated ClawPark bot in Discord
2. **Skill-installed Claw Mode** (Future): A Claw with `clawpark` skill installed

Both modes use the same backend orchestration contract.

### 9.3 Home Endpoint

**Requirement**: Single `/home` endpoint provides full status.

Must include:
- `connected_identity` — Discord user info or null
- `onboarding_state` — New, onboarded, active
- `owned_claw_count` — Number of claimed agents
- `pending_imports` — Waiting for claim
- `breedable_pairs` — Pairs ready to breed
- `cooldowns` — Agents on breeding cooldown
- `unsaved_newborns` — Children waiting to save
- `recent_lineages` — Last few breed runs
- `what_to_do_next` — Recommended action

**Acceptance Criteria**: Agents can call `/home` once and decide their next action within 3 seconds.

### 9.4 Import OpenClaw ZIP

**Requirement**: Users can upload and parse OpenClaw agent ZIPs.

Must parse:
- `IDENTITY.md`
- `SOUL.md`
- `TOOLS.md` (optional)
- `skills/*/SKILL.md` (optional)

Must extract:
- Name and identity (creature, role, directive, vibe, emoji)
- Soul traits with weights
- Skill badges with dominance
- Tool badges with potency
- Warnings and issues
- Fingerprint for provenance

**Acceptance Criteria**: Preview shows identity, traits, skills, tools, and warnings before confirm.

### 9.5 Claim / Ownership

**Requirement**: Imported agents become "claimed specimens" locally.

Each specimen has states:
- `imported` — Just uploaded
- `claimed` — User owns this locally
- `breedable` — Ready to breed
- `cooldown` — Recent breed, waiting
- `archived` — User marked inactive
- `published` — Sent to marketplace (optional)

**Acceptance Criteria**: Discord connection is optional for ownership. Local ownership always works.

### 9.6 Nursery (Gallery)

**Requirement**: Show user's owned agents.

Each card displays:
- Avatar/visual
- Name
- Identity summary (creature, role, emoji)
- Traits, skills, tools (abbreviated)
- Breedability state
- Provenance badge

**Acceptance Criteria**: User can select two agents and jump to Breed Lab.

### 9.7 Breed Lab

**Requirement**: Full breeding flow with conversation.

Must support:
- Select two agents
- Show compatibility and prediction
- Input breed prompt
- Talk to parents (generate conversation)
- Execute breed
- Show child result with lineage

**Acceptance Criteria**: Child is actually created and lineage is saved.

### 9.8 Discord Breeding Orchestration

**Requirement**: Users can breed via natural language in Discord.

Supported intents:
- "I want to breed this pair"
- "Find me a partner for this one"
- "Is this pair compatible?"
- "Go ahead and breed"
- "Cancel"

Lifecycle stages:
1. `intent_created` — User expresses intent
2. `candidate_suggested` — Bot proposes candidates
3. `consent_pending` — Waiting for consent (if needed)
4. `eligibility_checked` — Both agents valid
5. `run_started` — Breed in progress
6. `result_ready` — Child created
7. `saved` or `cancelled` — Final state

**Discord Response Contract**: Must return:
- Suggested candidates (if applicable)
- Compatibility summary
- Reason if blocked
- Whether consent is needed
- Lineage summary if successful
- Whether child was saved

**Acceptance Criteria**: Discord conversation is understandable and user knows next action.

### 9.9 Matchmaking & Consent

**Requirement**: Different ownership scenarios require different consent handling.

Cases:
- `same-owner` — Same person owns both → auto-approve
- `same-linked-identity` — Same Discord account owns both → auto-approve
- `cross-owner` — Different owners → requires consent
- `unknown-owner` — No owner info → requires consent

**Acceptance Criteria**: User understands why breed is approved or blocked.

### 9.10 Lineage

**Requirement**: Child result shows full lineage.

Must display:
- Parent A and Parent B
- Inheritance map (which traits from where)
- Doctrine (child's philosophy/creed)
- Breeding conversation (if recorded)
- Provenance trail

**Acceptance Criteria**: User can read where child inherited each trait and understand the child's archetype.

### 9.11 Verified Identity & Attribution

**Requirement**: Discord-linked mode vs. local-only mode.

- Without Discord: all breeding works, specimens are "unverified"
- With Discord: publish/claim shows verified publisher identity
- Discord connection does **not** gate local import/breed

**Acceptance Criteria**: User sees whether a specimen is local or verified-linked.

---

## 10. Data Model Summary

### Key Types

**Specimen**: A claimed local agent.
- id, name, identity, soul traits, skills, tools, visual
- ownership_state, breedable status
- provenance (source hash, import record, claimed_by Discord user)

**BreedingIntent**: A user's desire to breed.
- Parsed from Discord message or UI input
- Tracks target specimens, suggested candidates
- Flows through 7 stages: intent → candidates → consent → eligible → run → result → saved

**BreedingProposal**: Permission request for cross-owner breeding.
- Tracks consent status: pending → approved/rejected/expired

**BreedingRun**: Actual breed execution.
- parentA, parentB, prompt, conversation, prediction, resultChildId

**Lineage**: Heritage of a child.
- parentA, parentB, inheritanceMap (which traits from where), conversation, doctrine

---

## 11. UX Principles

1. **Next action is always visible** — Home shows what to do in priority order.
2. **Import is easiest** — ZIP drag-and-drop, instant preview, one-click confirm.
3. **Marketplace stays quiet** — It's there if you want it, but not in the way.
4. **Failure explains itself** — If breed can't happen, user knows why and next step.
5. **Lineage is the victory lap** — The result screen is the best part.
6. **Works for humans and agents** — UI and skill.md are equally important.

---

## 12. Success Metrics (MVP)

- % of users who successfully import 2+ agents
- % of imports that complete without errors
- Import failure reasons (to fix parser)
- % of breedable pair detection that is accurate
- % of breed runs that succeed
- % of children that are saved
- % of agents using `/home` endpoint
- % of Discord breeding requests that are understood correctly

---

## 13. MVP Scope

### Included

- Discord identity connection
- Discord Coordinator Bot (conversational breeding)
- Breeding intent/proposal/consent model
- ZIP import with parser
- Nursery
- Breed Lab with conversation
- Lineage save
- Home payload
- Agent-readable contracts (skill.md, heartbeat.md, breeding.md, rules.md, skill.json, discord.md)

### Excluded

- Full autonomous Claw-to-Claw negotiation
- Guild-wide production bot rollout
- Slash commands
- Public marketplace economy
- Social networking
- Real-time collaboration
- Cross-user trading

---

## 14. Acceptance Criteria Summary

MVP is successful when:

> **Users can import local OpenClaw agent ZIPs, claim them, breed two of them together, see the child lineage with inheritance details, and save the result.**
>
> **And agents can read skill.md / heartbeat.md / breeding.md and automate this entire flow without human interaction.**
>
> **And users can optionally link Discord for verified identity, but all core breeding works without it.**
>
> **And users can ask Discord to breed agents in natural language and get back a clear breeding result.**

---

## 15. Risks

1. **OpenClaw workspace structure varies** — Parser must be robust
2. **Skill extraction quality** — `skills/*/SKILL.md` parsing affects accuracy
3. **Marketplace bloat** — Too many roles; need clear separation
4. **Consent model complexity** — Could slow MVP; must simplify early
5. **Discord intent parsing errors** — User frustration if system misunderstands
6. **Ownership/consent confusion** — Cross-owner rules must be crystal clear

---

## 16. Implementation Roadmap

### Phase 1: Contract Foundation

- Discord onboarding/consent specs
- skill.md, heartbeat.md, breeding.md, rules.md, skill.json, discord.md
- `/api/v1/home` endpoint specification

### Phase 2: Real Local Breeding MVP

- Coordinator Bot Mode
- Breeding intent/proposal/consent API
- ZIP import UI and parser hardening
- Nursery and Breed Lab
- Lineage save

### Phase 3: Polish & Hardening

- API contract tests
- Parser regression tests
- Discord flow integration tests
- Failure path handling
- Docs finalization

### Phase 4: Exchange (Post-MVP)

- Marketplace UI reorg
- Publish/download/install flows

---

## 17. References

Design patterns adapted from:
- Moltbook SKILL.md, HEARTBEAT.md, RULES.md
- OpenClaw official documentation
- ClawPark breeding engine (src/engine/)
- Discord bot best practices
