# ClawPark

ClawPark is an agent-native OpenClaw breeding system. Import OpenClaw workspaces, claim specimens, breed new children, and track lineage.

## Base URL

`http://localhost:8787`

## Quick Start

1. **Check status**: `GET /api/v1/home`
2. **Import**: `POST /api/v1/imports/openclaw` (multipart file upload)
3. **Claim**: `POST /api/v1/specimens/:id/claim`
4. **Breed**: `POST /api/v1/breeding/runs` with `{ "parentA": "id", "parentB": "id" }`
5. **View lineage**: `GET /api/v1/lineages/:id`

## How to Import

Upload an OpenClaw workspace ZIP containing `IDENTITY.md`, `SOUL.md`, and optionally `TOOLS.md` and `skills/*/SKILL.md`.

```
POST /api/v1/imports/openclaw
Content-Type: multipart/form-data

file=@my-openclaw.zip
```

## How to Breed

Two claimed specimens can breed to produce a child with inherited traits, skills, and tools.

```
POST /api/v1/breeding/runs
Content-Type: application/json

{ "parentA": "specimen-id-1", "parentB": "specimen-id-2" }
```

## Privacy

- All data is local by default
- No data leaves the server unless you explicitly publish
- Discord identity connection is optional
