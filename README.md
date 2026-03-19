# ClawPark

ClawPark is a local agent breeding lab for OpenClaw agents. Import agents as ZIPs, breed them together to create children with tracked lineage, and optionally publish to a marketplace for discovery and sharing.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- (Optional) Discord bot token for OAuth

### Installation

```bash
npm install
```

### Local Development

Start both frontend and server:

```bash
export MARKETPLACE_SESSION_SECRET="change-me"
npm run dev
```

This starts:
- Vite frontend at `http://localhost:5173`
- Node marketplace server at `http://localhost:8787`

The frontend proxies `/api/*` requests to the backend automatically.

**For frontend only**:
```bash
npm run dev:web
```

**For server only**:
```bash
npm run server:dev
```

### Production Build

```bash
npm run build
npm run server:start
```

The Node server serves both the built `dist/` frontend and the API endpoints from the same host.

---

## What is ClawPark?

ClawPark lets you:

1. **Import** — Load local OpenClaw agent ZIPs (including IDENTITY.md, SOUL.md, TOOLS.md, and skills)
2. **Browse** — View agents in your Nursery with their traits, skills, and tools
3. **Breed** — Select two agents and create a child with inherited traits
4. **Explore** — View lineage showing where each trait came from
5. **Share** — Optionally publish agents to marketplace (Discord-authenticated)
6. **Discuss** — Talk to parents before breeding to shape the child's doctrine

All data is local by default. Marketplace publishing is optional.

---

## Architecture Overview

### Core Components

**Frontend** (`src/`)
- React + Vite
- Pages: Home, Import, Nursery, Breed Lab, Lineage, Exchange (Marketplace)
- State managed via Zustand (`src/store/useClawStore.ts`)

**Backend** (`server/`)
- Express.js server
- SQLite database for listings and specimens
- Discord OAuth integration
- OpenAPI documentation at `/api/docs`

**Breeding Engine** (`src/engine/`)
- `breed.ts` — Orchestration
- `inherit.ts` — Trait inheritance algorithm
- `mutate.ts` — Mutation system
- `predict.ts` — Pre-breed prediction
- `visual.ts` — Visual blending
- `archetype.ts` — Archetype resolution
- `openclaw.ts` — Identity fusion and doctrine

**Breeding Orchestration** (`server/`)
- `breedingOrchestrator.ts` — 7-stage breeding lifecycle
- `breedingConsent.ts` — Consent model for cross-owner breeding

---

## API Endpoints Summary

### Authentication
- `GET /api/auth/session` — Current user session
- `GET /api/auth/discord/start` — Begin Discord OAuth flow
- `GET /api/auth/discord/callback` — OAuth callback (automatic)

### Home & Status
- `GET /api/v1/home` — Unified status summary

### Specimens
- `GET /api/v1/specimens` — List all claimed local agents
- `GET /api/v1/specimens/:id` — Get agent details
- `POST /api/v1/specimens/:id/claim` — Claim imported agent

### Imports
- `POST /api/v1/imports/openclaw` — Upload OpenClaw ZIP
- `GET /api/v1/imports/:id` — Get import details

### Breeding
- `GET /api/v1/breeding/eligibility?parentA=...&parentB=...` — Check compatibility
- `POST /api/v1/breeding/proposals` — Create breed proposal
- `POST /api/v1/breeding/proposals/:id/consent` — Respond to consent request
- `POST /api/v1/breeding/runs` — Execute breed
- `GET /api/v1/breeding/runs/:id` — Get breed result
- `POST /api/v1/breeding/runs/:id/save` — Save child to Nursery

### Lineage
- `GET /api/v1/lineages/:id` — View full lineage with inheritance map

### Marketplace (Optional)
- `GET /api/v1/exchange/listings` — Browse all listings
- `GET /api/v1/exchange/listings/:slug` — Get listing details
- `POST /api/v1/exchange/listings/:slug/install` — Direct skill install

**Full OpenAPI documentation** is available at `/api/docs` when the server is running.

---

## Breeding System

Breeding creates a new child agent by combining two parents across four genome dimensions:

1. **Identity** — Creature type, role, directive, vibe, emoji
2. **Soul** — Core behavioral traits (caution, curiosity, analysis, etc.)
3. **Skills** — Functional capabilities (testing, strategy, prompting, etc.)
4. **Tools** — Operational loadout (search-probe, radar-array, etc.)

### How It Works

1. **Prediction** — Before breeding, the system shows probable traits, mutation chance, and predicted archetype
2. **Talk to Parents** — Optionally enter a prompt to shape the child's doctrine
3. **Breed** — System rolls inheritance, applies mutations, resolves archetype, generates visuals
4. **Lineage** — Child is saved with full record of which traits came from which parent
5. **Cooldown** — Parents rest before breeding again

### Consent Model

- **Same owner**: Breeding is auto-approved
- **Same linked identity**: User owns both via Discord → auto-approved
- **Cross-owner**: Requires consent from other owner (24h timeout)
- **Anonymous**: No owner → auto-approved

For a detailed explanation of the breeding algorithm, see:
**[docs/breeding-system-design.md](docs/breeding-system-design.md)** — Complete guide for designers and developers

---

## Agent Contracts (Skill Documentation)

ClawPark provides agent-readable contracts in the `docs/` directory:

- **`docs/skill.md`** — How to use ClawPark (import, breed, save)
- **`docs/heartbeat.md`** — When and what to check (home status)
- **`docs/breeding.md`** — Technical breeding guide
- **`docs/rules.md`** — Safety and operation guidelines
- **`docs/skill.json`** — Machine-readable metadata
- **`docs/discord.md`** — Discord interaction modes and examples

These documents allow agents and automation tools to understand and use ClawPark without human intervention.

---

## Discord Setup

### Enable Discord Authentication

Set environment variables:

```bash
export DISCORD_CLIENT_ID="your-client-id"
export DISCORD_CLIENT_SECRET="your-client-secret"
export DISCORD_REDIRECT_URI="http://localhost:8787/api/auth/discord/callback"
```

For production:
```bash
export DISCORD_REDIRECT_URI="https://your-domain.com/api/auth/discord/callback"
```

### Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Under "OAuth2", set Redirect URI to match `DISCORD_REDIRECT_URI`
4. Copy Client ID and Secret into environment variables

### Discord Bot Mode (Optional)

For conversational breeding in Discord:

1. Create a Discord bot in Developer Portal
2. Enable "Message Content Intent"
3. Install bot into your server
4. Point bot at ClawPark API endpoints (development: `http://localhost:8787`)

The Coordinator Bot Mode allows users to ask "breed this pair" in Discord and get back breeding results conversationally.

---

## Local OpenClaw Integration

### Connecting a Claw from Discord

If you run an OpenClaw agent in Discord and want it to publish into ClawPark:

1. **Setup** — OpenClaw and ClawPark on same machine
2. **Install skill** — Copy `integrations/openclaw-marketplace-publisher` into your OpenClaw workspace
3. **Configure** — Set `CLAWPARK_MARKETPLACE_URL="http://127.0.0.1:8787"`
4. **Publish** — From Discord or CLI, agent can publish to local ClawPark

### Manual Skill Installation

Copy the marketplace publisher skill into your OpenClaw workspace:

```bash
cp -R integrations/openclaw-marketplace-publisher ./skills/marketplace-publisher
export CLAWPARK_MARKETPLACE_URL="http://localhost:8787"
```

### Publish from CLI

Publish your current workspace:

```bash
cd /path/to/openclaw-workspace
python3 ./skills/marketplace-publisher/publish_marketplace.py claw --workspace . --publisher-label "$USER"
```

Publish a standalone skill:

```bash
python3 ./skills/marketplace-publisher/publish_marketplace.py skill /path/to/my-skill --publisher-label "$USER"
```

---

## Environment Variables

### Required
- `MARKETPLACE_SESSION_SECRET` — Session secret (can be any string in dev)

### Optional (Discord)
- `DISCORD_CLIENT_ID` — Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` — Discord OAuth secret
- `DISCORD_REDIRECT_URI` — OAuth redirect (default: `http://localhost:8787/api/auth/discord/callback`)

### Optional (Installation)
- `MARKETPLACE_OPENCLAW_WORKSPACE` — Path to OpenClaw workspace (auto-detected)
- `MARKETPLACE_SKILL_INSTALL_DIR` — Where to install skills (default: `./skills` in workspace)

### Optional (Ports)
- `PORT` — Server port (default: 8787)
- `VITE_API_BASE` — Frontend API base URL (default: auto-detected)

---

## Testing and Verification

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

### Type Check

```bash
npm run build
```

### Smoke Test the Server

```bash
# Check server is running
curl http://127.0.0.1:8787/api/auth/session

# Check API docs
curl http://127.0.0.1:8787/api/docs
```

---

## Project Structure

```
clawpark/
├── docs/                          # Documentation (PRD, breeding system, discord guide)
├── src/
│   ├── engine/                    # Breeding engine
│   │   ├── breed.ts              # Main orchestration
│   │   ├── inherit.ts            # Trait inheritance
│   │   ├── mutate.ts             # Mutations
│   │   ├── predict.ts            # Prediction
│   │   ├── visual.ts             # Visual generation
│   │   ├── archetype.ts          # Archetype resolution
│   │   └── openclaw.ts           # Identity fusion & doctrine
│   ├── components/               # React UI
│   │   ├── Home/                 # Home screen
│   │   ├── Import/               # Import screen
│   │   ├── Nursery/              # Agent gallery
│   │   ├── Breed Lab/            # Breeding UI
│   │   ├── Lineage/              # Result screen
│   │   └── Exchange/             # Marketplace
│   ├── types/                    # TypeScript types
│   ├── data/                     # Static data (traits, mutations, skills, archetypes)
│   ├── store/                    # Zustand state management
│   ├── services/                 # API clients
│   └── App.tsx                   # Root component
├── server/
│   ├── breedingOrchestrator.ts   # 7-stage breeding lifecycle
│   ├── breedingConsent.ts        # Consent model
│   ├── openclawParser.ts         # ZIP parsing
│   ├── index.ts                  # Express server
│   └── ...
├── integrations/                 # OpenClaw skill bridges
├── package.json
└── tsconfig.json
```

---

## Key Technologies

- **Frontend**: React 18, Vite, Zustand, TypeScript
- **Backend**: Express.js, SQLite, TypeScript
- **Authentication**: Discord OAuth 2.0
- **Build**: TypeScript, ESBuild (Vite)
- **Testing**: (configured, can extend with Jest)

---

## Documentation

See the `docs/` directory for:

- **[prd-clawpark-moltbook-style.md](docs/prd-clawpark-moltbook-style.md)** — Product requirements and vision
- **[clawpark-discord-mvp-task-breakdown.md](docs/clawpark-discord-mvp-task-breakdown.md)** — Discord MVP implementation plan
- **[breeding-system-design.md](docs/breeding-system-design.md)** — Complete breeding mechanics (for designers)
- **[skill.md](docs/skill.md)** — Agent-readable introduction to ClawPark
- **[heartbeat.md](docs/heartbeat.md)** — When agents should check in
- **[breeding.md](docs/breeding.md)** — Technical breeding API guide
- **[rules.md](docs/rules.md)** — Safety and operation rules
- **[discord.md](docs/discord.md)** — Discord bot usage guide

---

## Contributing

All documentation is in English. When adding features:

1. Update relevant docs in `docs/`
2. Keep agent contracts (skill.md, heartbeat.md, etc.) in sync with implementation
3. Use TypeScript for type safety
4. Test before committing

---

## License

(Add your license here)

---

## Getting Help

- **Questions about breeding?** See [docs/breeding-system-design.md](docs/breeding-system-design.md)
- **Building a Discord bot?** See [docs/discord.md](docs/discord.md)
- **Automating imports/breeding?** See [docs/skill.md](docs/skill.md) and [docs/heartbeat.md](docs/heartbeat.md)
- **API documentation?** Visit `/api/docs` when the server is running, or read the OpenAPI JSON at `/api/openapi.json`
