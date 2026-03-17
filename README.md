# ClawPark

ClawPark is an OpenClaw-inspired agent breeding lab with a SQLite-backed marketplace.

The app lets you:
- browse parent Claws
- inspect their `Identity`, `Soul`, `Skills`, and `Tools`
- talk to each parent before breeding
- generate a child with lineage, transcript, and doctrine
- publish verified Claw listings through Discord-authenticated draft flow
- publish unverified Claw or Skill listings through a Moltbot-style local skill bridge
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

## Marketplace listing kinds

### 1. Claw listings
- source: full OpenClaw workspace ZIP
- output: normalized public bundle JSON
- can be claimed/imported into ClawPark

### 2. Skill listings
- source: standalone skill ZIP rooted at `SKILL.md`
- output: sanitized installable skill ZIP
- can be downloaded or installed into an OpenClaw skills directory

## Trust model

- **Verified** listings come from the Discord-authenticated draft flow.
- **Unverified** listings come from the local OpenClaw skill publisher.
- Unverified listings are public but create-only; they do not overwrite earlier listings.

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
10. Publish a Claw or Skill into Marketplace

## Verified marketplace publish flow

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

## Moltbot-style local skill publish flow

Install the local publisher skill:

```bash
cp -R integrations/openclaw-marketplace-publisher ./skills/marketplace-publisher
export CLAWPARK_MARKETPLACE_URL="http://localhost:8787"
# shared fallback: cp -R integrations/openclaw-marketplace-publisher ~/.openclaw/skills/marketplace-publisher
```

### Publish the current Claw workspace
```bash
cd /path/to/openclaw-workspace
python3 ./skills/marketplace-publisher/publish_marketplace.py claw --workspace . --publisher-label "$USER"
```

### Publish a standalone skill
```bash
python3 ./skills/marketplace-publisher/publish_marketplace.py skill /path/to/my-skill --publisher-label "$USER"
```

The local skill publisher writes unverified marketplace listings for shared browsing.

## Marketplace skill install flow

ClawPark now supports a **direct marketplace install flow** for skill listings in addition to the existing download + copy-install-steps fallback.

### When direct install works
Direct install is intended for the case where:
- the ClawPark marketplace server is running on the **same machine** as your OpenClaw workspace,
- the server process is allowed to write into your OpenClaw skills directory, and
- the host has the `unzip` CLI available (the installer expands the sanitized skill ZIP on the server side).

If any of those assumptions do not hold, the UI still supports:
- **Download Skill**
- **Copy install steps**

### Default install target
By default, the marketplace installs skills into the active OpenClaw workspace under:

```bash
./skills/<slug>
```

That keeps installs aligned with the official OpenClaw workspace layout.

### Optional shared install target
If you want the marketplace server to install into the shared OpenClaw user-level skills directory instead, set:

```bash
export MARKETPLACE_SKILL_INSTALL_DIR="$HOME/.openclaw/skills"
```

### Optional workspace root override
If the marketplace server is started from a directory that is **not** your OpenClaw workspace root, point it at the correct workspace explicitly:

```bash
export MARKETPLACE_OPENCLAW_WORKSPACE="/path/to/openclaw-workspace"
```

The server also honors `OPENCLAW_WORKSPACE` and `OPENCLAW_SKILLS_DIR` if you already use those in your shell environment.

### Install behavior
From the Marketplace UI, a skill listing can now:
1. call `POST /api/marketplace/listings/:slug/install`,
2. download the sanitized skill ZIP from marketplace storage,
3. install it into the configured OpenClaw skills root, and
4. return the final installed path to the UI.

The flow is **safe by default**:
- first install succeeds normally,
- re-installing over an existing skill returns a conflict,
- overwrite only happens after an explicit overwrite request.

### Manual fallback commands
If you do not want direct install, or if the marketplace server cannot write to your OpenClaw workspace, the copied fallback steps match the same directory conventions:

```bash
mkdir -p ./skills/<slug>
unzip <slug>.skill.zip -d ./skills/<slug>

# shared fallback
mkdir -p ~/.openclaw/skills/<slug>
unzip <slug>.skill.zip -d ~/.openclaw/skills/<slug>
```

### Recommended local setup
For the smoothest local loop:

```bash
cd /path/to/openclaw-workspace
cp -R /path/to/clawpark/integrations/openclaw-marketplace-publisher ./skills/marketplace-publisher
export CLAWPARK_MARKETPLACE_URL="http://localhost:8787"
export MARKETPLACE_OPENCLAW_WORKSPACE="$PWD"
# optional shared fallback
# export MARKETPLACE_SKILL_INSTALL_DIR="$HOME/.openclaw/skills"
```

With that setup, you can:
- publish a local skill into ClawPark,
- browse it in Marketplace,
- click **Install into OpenClaw**, or
- fall back to download/copy-install commands when preferred.

## Local development

### Full local development
```bash
npm install
export MARKETPLACE_SESSION_SECRET="change-me"
export DISCORD_CLIENT_ID="..."
export DISCORD_CLIENT_SECRET="..."
export DISCORD_REDIRECT_URI="http://localhost:8787/api/auth/discord/callback"
# optional shared install: export MARKETPLACE_SKILL_INSTALL_DIR="$HOME/.openclaw/skills"
npm run dev
```

`npm run dev` now starts both the Vite frontend and the SQLite marketplace server together.

### Frontend only
```bash
npm run dev:web
```

### Marketplace server only
```bash
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
