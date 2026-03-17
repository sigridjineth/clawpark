# ClawPark — Product Specification

## Product summary
ClawPark is an OpenClaw-inspired breeding lab for AI agents.

The product combines three loops:
1. **Breed** two parent Claws into a child with visible inherited traits, skills, tools, and doctrine.
2. **Inspect** the result through reveal, lineage, and detailed specimen dossiers.
3. **Publish** Claws or Skills into a marketplace for discovery, download, claiming, and future commercial loops.

Pitch:
**CryptoKitties for AI agents, but with readable genomes, lineage, and operator-driven evolution.**

---

## Core product pillars

### 1. Agent genome readability
Every Claw must be legible as an agent, not just a collectible.

Each specimen exposes four dimensions:
- **Identity** — creature, role, directive, vibe, emoji
- **Soul** — behavioral traits and values
- **Skills** — reusable abilities and working style
- **Tools** — preferred operational loadout

The user should be able to understand:
- what this Claw is,
- how it behaves,
- what it is good at,
- what it reaches for first.

### 2. Breeding as authored evolution
Breeding should feel like a controlled experiment, not a random shuffle.

The user:
- selects two parents,
- optionally steers one preferred trait,
- provides an operator prompt,
- watches the parents “argue” their way into a child.

The result includes:
- inheritance map,
- breeding transcript,
- child doctrine,
- recursive lineage.

### 3. Marketplace as public registry
The marketplace is not just a download page. It is the public registry of what exists in the park.

It currently supports:
- **verified Claw listings** through Discord-authenticated publish flow,
- **unverified Claw and Skill listings** through a local OpenClaw skill bridge,
- claim/download behavior depending on listing kind.

---

## Current user flows

### Flow A — Breed a child
1. Open the gallery.
2. Inspect or select a parent Claw.
3. Select two parents.
4. Enter Breed Lab.
5. Review prediction and optional trait steering.
6. Enter an operator prompt.
7. Run **Talk to Parents**.
8. Initiate breeding.
9. Watch reveal and inspect doctrine/transcript.
10. View lineage or save the child back to the gallery.

### Flow B — Inspect a Claw
1. Open the gallery.
2. Click a Claw card.
3. Read the specimen dossier.
4. Review Identity, Soul, Skills, Tools, directive, and per-item detail.
5. Select the Claw for breeding if desired.

### Flow C — Publish a verified Claw
1. Open Marketplace.
2. Go to **Publish**.
3. Sign in with Discord.
4. Upload an OpenClaw workspace ZIP.
5. Review the draft preview.
6. Edit title/summary if needed.
7. Publish the listing.

### Flow D — Publish from a local OpenClaw skill
1. Install the local publisher skill.
2. Point it at the marketplace server.
3. Publish either:
   - the current OpenClaw workspace as a Claw listing, or
   - a standalone skill folder as a Skill listing.
4. The listing appears as **Unverified** in the shared marketplace.

### Flow E — Browse marketplace listings
- **Claw listings**
  - browse,
  - inspect,
  - download bundle JSON,
  - claim into the gallery.
- **Skill listings**
  - browse,
  - inspect,
  - download skill ZIP,
  - install directly into the local OpenClaw skills directory when the marketplace API is local,
  - copy install instructions.

---

## UI model
ClawPark is intentionally styled as a **Jurassic Park-style genome facility**.

Design rules:
- darker containment-lab shell,
- low-text, high-signal hierarchy,
- dossier-style detail panels,
- collectible cards with scientific framing,
- lineage as a specimen genealogy view,
- marketplace as intake + registry.

The interface should always answer:
- what is this specimen,
- why was it produced,
- where did its traits come from,
- what can I do with it now.

---

## Marketplace listing model

### Listing types
#### Claw listing
- source: OpenClaw workspace bundle
- content: normalized public Claw bundle
- actions: browse, download, claim

#### Skill listing
- source: standalone skill bundle rooted at `SKILL.md`
- content: sanitized installable skill ZIP
- actions: browse, download, local install, install externally

### Trust states
#### Verified
- published through managed Discord-authenticated web flow
- intended to represent attributed marketplace content

#### Unverified
- published through local OpenClaw skill integration
- public, but not identity-verified by the marketplace
- create-only; cannot overwrite an existing listing

---

## Example content included in the repo
The repo includes checked-in local example bundles for demo, parser validation, and seed marketplace data.

### Example Claw
- **Meridian** — a full workspace-style Claw example

### Example Skills
- **Park Audit** — review / inspection style skill
- **Containment Launch** — launch / release checklist style skill

These examples are used for:
- local marketplace seed data,
- parser tests,
- realistic demo fixtures,
- local publisher demonstrations.

---

## Acceptance criteria for the current product
- Users can browse and breed Claws.
- Every Claw exposes Identity, Soul, Skills, and Tools.
- Users can inspect detailed Claw dossiers from the gallery.
- Breed results generate lineage, doctrine, and transcript.
- The marketplace supports both Claw and Skill listings.
- Verified Claw publish works through the managed Discord flow.
- Unverified Claw and Skill publish works through the local OpenClaw skill bridge.
- Seed marketplace data is backed by checked-in local example bundles.

---

## Explicit non-goals for the current version
These are intentionally **not** complete yet:
- purchase / selling economy,
- inventory ownership transfer,
- cooldown-based commercial breeding loop,
- auction mechanics,
- wallet / on-chain ownership,
- moderation/admin dashboards,
- hardened production trust model for unsigned publishing.

Those items are tracked separately in `TODO(task).md`.
