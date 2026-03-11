# ClawPark

ClawPark is an OpenClaw-inspired agent breeding lab with a SQLite-backed marketplace.

The app lets you:
- browse parent Claws
- inspect their `Identity`, `Soul`, `Skills`, and `Tools`
- talk to each parent before breeding
- generate a child with lineage, transcript, and doctrine
- publish a sanitized OpenClaw workspace bundle into the marketplace
- download or claim published marketplace specimens

## Current product direction

ClawPark is intentionally framed as a **Jurassic Park-style genome lab**:
- darker containment-lab visual system
- low-text, scan-friendly UI
- lineage as a specimen genealogy map
- parent-to-parent talk-to-breed interaction
- marketplace as specimen intake + public registry

## Core OpenClaw genome dimensions

Each Claw is modeled across four dimensions:
- **Identity** — creature, role, directive, vibe, emoji
- **Soul** — core behavioral traits and principles
- **Skills** — reusable capabilities
- **Tools** — preferred operational loadout

## Main flow

1. Browse the catalogue
2. Select two parent Claws
3. Enter Breed Lab
4. Ask the parents a free-form operator prompt
5. Generate parent dialogue with **Talk to Parents**
6. Breed the child
7. Review the child reveal, doctrine, and transcript
8. Inspect recursive lineage
9. Save/export the new specimen
10. Publish a real OpenClaw workspace ZIP into Marketplace

## Marketplace upload flow

1. Start the marketplace server
2. Sign in with Discord
3. Upload a ZIP from your OpenClaw workspace containing:
   - `IDENTITY.md`
   - `SOUL.md`
   - optional `TOOLS.md`
   - optional `skills/*/SKILL.md`
4. Review the sanitized draft preview
5. Publish the listing
6. Other users can browse, download the normalized bundle JSON, or claim the specimen into ClawPark

Only sanitized normalized bundles are published. Raw workspaces are not exposed publicly.

## Local development

### Frontend
```bash
npm install
npm run dev
```

### Marketplace server
```bash
export MARKETPLACE_SESSION_SECRET="change-me"
export DISCORD_CLIENT_ID="..."
export DISCORD_CLIENT_SECRET="..."
export DISCORD_REDIRECT_URI="http://localhost:8787/api/auth/discord/callback"
npm run server:dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8787` by default.

## Production build

```bash
npm run build
npm run server:start
```

The Node marketplace server can serve the built `dist/` output and the SQLite-backed API from the same host.

## Verification snapshot

Verified on March 10, 2026:

```bash
npm run test
npm run lint
npm run build
node --experimental-strip-types server/index.ts
```
