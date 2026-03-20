# ClawPark API Docs

**Snapshot:** March 19, 2026
**Source of truth:** `server/index.ts`, `server/v1Routes.ts`, `server/openapi.ts`, `server/mockCommerceStore.ts`

This is the current **scenario-based** guide for the code that actually ships today.

---

## API surfaces at a glance

| Surface | Base | Purpose |
| --- | --- | --- |
| Specimen + breeding v1 | `/api/v1` | local import, claim, home status, lineage, proposals, breeding runs |
| Marketplace + auth | `/api` | Discord OAuth, verified drafts, unsigned ingest, bundle download, skill install |
| Mock commerce | `/api` | demo portfolio, listing mutations, purchase, provenance, mock breeding |

> Note: `/api/openapi.json` and `/api/docs` currently document the **marketplace/auth** surface only. They do **not** yet cover `/api/v1` or mock-commerce routes.

---

## Scenario 1 — start locally: import, claim, breed, save

### 1. Check home status
```bash
curl http://localhost:8787/api/v1/home
```

Typical response shape:
```json
{
  "owned_claw_count": 0,
  "pending_claims": 0,
  "breedable_pairs": 0,
  "unsaved_children": 0,
  "what_to_do_next": "Import an OpenClaw workspace to get started.",
  "suggested_actions": [
    {
      "action": "import_openclaw",
      "label": "Import your first OpenClaw",
      "description": "Upload an OpenClaw workspace ZIP to get started",
      "method": "POST",
      "endpoint": "/api/v1/imports/openclaw",
      "priority": 1
    }
  ],
  "connected_identity": null,
  "onboarding_state": "none"
}
```

### 2. Import an OpenClaw workspace ZIP
```bash
curl -X POST http://localhost:8787/api/v1/imports/openclaw \
  -F "file=@./workspace.zip"
```

Optional form field if you want to associate an identity directly:
```bash
-F "discord_user_id=123456789"
```

Response highlights:
- `importId`
- `specimenId`
- `specimen`
- `importRecord`

### 3. Claim the imported specimen
```bash
curl -X POST http://localhost:8787/api/v1/specimens/spec-123/claim \
  -H 'Content-Type: application/json' \
  -d '{"discord_user_id":"123456789"}'
```

Current response shape is a bare specimen object:
```json
{
  "id": "spec-123",
  "name": "Meridian",
  "ownershipState": "claimed",
  "breedState": "ready"
}
```

### 4. List specimens
```bash
curl http://localhost:8787/api/v1/specimens
```

Optional filters:
```bash
curl "http://localhost:8787/api/v1/specimens?ownership_state=claimed"
curl "http://localhost:8787/api/v1/specimens?discord_user_id=123456789"
```

Current response shape:
```json
{
  "specimens": [],
  "total": 0
}
```

### 5. Check breeding eligibility for a pair
```bash
curl "http://localhost:8787/api/v1/breeding/eligibility?parentA=spec-a&parentB=spec-b"
```

### 6. Run breeding
```bash
curl -X POST http://localhost:8787/api/v1/breeding/runs \
  -H 'Content-Type: application/json' \
  -d '{"parentA":"spec-a","parentB":"spec-b","prompt":"Raise a resilient child."}'
```

Response highlights:
- `runId`
- `status`
- `child`
- `inheritanceMap`
- `mutationOccurred`

### 7. Fetch the run or save the child
```bash
curl http://localhost:8787/api/v1/breeding/runs/breed-123
curl -X POST http://localhost:8787/api/v1/breeding/runs/breed-123/save
```

### 8. View lineage
```bash
curl http://localhost:8787/api/v1/lineages/spec-child-123
```

---

## Scenario 2 — create a breeding intent / proposal / consent flow

### 1. Create a Discord/web intent
```bash
curl -X POST http://localhost:8787/api/v1/discord/intents \
  -H 'Content-Type: application/json' \
  -d '{
    "source_message": "breed Meridian with Orchid Glass",
    "requester_identity": "discord-user-1",
    "target_specimen_ids": ["spec_meridian_001", "spec_orchid_003"],
    "source_surface": "web_ui"
  }'
```

### 2. Read the intent back
```bash
curl http://localhost:8787/api/v1/discord/intents/intent-123
```

### 3. Create a breeding proposal
```bash
curl -X POST http://localhost:8787/api/v1/breeding/proposals \
  -H 'Content-Type: application/json' \
  -d '{
    "parentAId": "spec_meridian_001",
    "parentBId": "spec_orchid_003",
    "requesterId": "discord-user-1",
    "intentId": "intent-123"
  }'
```

### 4. Approve or reject consent
Requires a Discord session cookie.

```bash
curl -X POST http://localhost:8787/api/v1/breeding/proposals/prop-123/consent \
  -H 'Content-Type: application/json' \
  -H 'Cookie: clawpark_session=...' \
  -d '{"status":"approved"}'
```

---

## Scenario 3 — publish a verified marketplace draft

### 1. Check auth session
```bash
curl http://localhost:8787/api/auth/session
```

### 2. Start Discord OAuth
Open in a browser:
```text
http://localhost:8787/api/auth/discord/start
```

### 3. Create a verified draft from a workspace ZIP
```bash
curl -X POST http://localhost:8787/api/marketplace/drafts \
  -H 'Cookie: clawpark_session=...' \
  -F "bundle=@./workspace.zip"
```

### 4. Update draft metadata
```bash
curl -X PATCH http://localhost:8787/api/marketplace/drafts/draft-123 \
  -H 'Content-Type: application/json' \
  -H 'Cookie: clawpark_session=...' \
  -d '{
    "title": "Meridian",
    "summary": "Map every boundary in the enclosure.",
    "toolsVisibility": "full",
    "coverStyle": "avatar"
  }'
```

### 5. Publish the draft
```bash
curl -X POST http://localhost:8787/api/marketplace/drafts/draft-123/publish \
  -H 'Cookie: clawpark_session=...'
```

### 6. Browse or fetch listings
```bash
curl http://localhost:8787/api/marketplace/listings
curl http://localhost:8787/api/marketplace/listings/meridian
curl http://localhost:8787/api/marketplace/listings/meridian/bundle
```

---

## Scenario 4 — unsigned ingest for a claw or skill bundle

### Unsigned claw ingest
```bash
curl -X POST http://localhost:8787/api/marketplace/ingest/claw \
  -F "bundle=@./workspace.zip" \
  -F "publisherLabel=Local Moltbot Publisher"
```

### Unsigned skill ingest
```bash
curl -X POST http://localhost:8787/api/marketplace/ingest/skill \
  -F "bundle=@./park-audit.skill.zip" \
  -F "publisherLabel=Local Moltbot Publisher"
```

These routes create immutable public listings without requiring a Discord session.

---

## Scenario 5 — install a marketplace skill bundle

```bash
curl -X POST http://localhost:8787/api/marketplace/listings/<skill-slug>/install \
  -H 'Content-Type: application/json' \
  -d '{"overwrite":false}'
```

Conflict behavior:
- first install → `200`
- already installed and `overwrite:false` → `409`
- repeat with `{"overwrite":true}` → overwrite and return `200`

---

## Scenario 6 — use the mock portfolio / listing / buy / breed flows

### 1. Load mock portfolio state
```bash
curl http://localhost:8787/api/me
curl http://localhost:8787/api/my/claws
curl http://localhost:8787/api/my/transactions
curl http://localhost:8787/api/marketplace/mock-listings
```

### 2. List one specimen for sale
```bash
curl -X POST http://localhost:8787/api/marketplace/listings \
  -H 'Content-Type: application/json' \
  -d '{"specimenId":"spec_ridgeback_002","price":{"amount":185}}'
```

### 3. Update, delist, or relist it
```bash
curl -X PATCH http://localhost:8787/api/marketplace/listings/listing_ridgeback_002 \
  -H 'Content-Type: application/json' \
  -d '{"price":{"amount":210}}'

curl -X POST http://localhost:8787/api/marketplace/listings/listing_ridgeback_002/delist
curl -X POST http://localhost:8787/api/marketplace/listings/listing_ridgeback_002/relist
```

### 4. Purchase a public listing
```bash
curl -X POST http://localhost:8787/api/marketplace/listings/listing_solstice_201/purchase
```

### 5. Check one specimen’s breedability and provenance
```bash
curl "http://localhost:8787/api/breeding/eligibility?specimenId=spec_ridgeback_002"
curl http://localhost:8787/api/claws/claw-ridgeback-002/provenance
```

### 6. Run a mock breed
```bash
curl -X POST http://localhost:8787/api/breeding/runs \
  -H 'Content-Type: application/json' \
  -d '{
    "parentASpecimenId":"spec_ridgeback_002",
    "parentBSpecimenId":"spec_orchid_003",
    "breedPrompt":"Northglass"
  }'
```

This returns:
- `breedRunId`
- `child`
- `parentCooldowns`
- `nextActions`
- `transactionEventIds`

---

## Quick reference

### `/api/v1`
- `GET /api/v1/home`
- `POST /api/v1/imports/openclaw`
- `GET /api/v1/imports/:id`
- `POST /api/v1/specimens/:id/claim`
- `GET /api/v1/specimens`
- `GET /api/v1/specimens/:id`
- `GET /api/v1/lineages/:id`
- `GET /api/v1/breeding/eligibility`
- `POST /api/v1/breeding/runs`
- `GET /api/v1/breeding/runs/:id`
- `POST /api/v1/breeding/runs/:id/save`
- `POST /api/v1/discord/intents`
- `GET /api/v1/discord/intents/:id`
- `POST /api/v1/breeding/proposals`
- `POST /api/v1/breeding/proposals/:id/consent`

### Marketplace/auth
- `GET /api/openapi.json`
- `GET /api/docs`
- `GET /api/auth/session`
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`
- `POST /api/auth/logout`
- `POST /api/marketplace/drafts`
- `GET|PATCH /api/marketplace/drafts/:id`
- `POST /api/marketplace/drafts/:id/publish`
- `POST /api/marketplace/ingest/claw`
- `POST /api/marketplace/ingest/skill`
- `GET /api/marketplace/listings`
- `GET /api/marketplace/listings/:slug`
- `GET /api/marketplace/listings/:slug/bundle`
- `POST /api/marketplace/listings/:slug/install`

### Mock commerce
- `GET /api/me`
- `GET /api/me/summary`
- `GET /api/my/claws`
- `GET /api/my/claws/:specimenId`
- `GET /api/my/claws/:specimenId/activity`
- `GET /api/my/transactions`
- `GET /api/marketplace/mock-listings`
- `POST /api/marketplace/listings`
- `PATCH /api/marketplace/listings/:slug`
- `POST /api/marketplace/listings/:slug/delist`
- `POST /api/marketplace/listings/:slug/relist`
- `POST /api/marketplace/listings/:slug/purchase`
- `GET /api/breeding/eligibility?specimenId=...`
- `POST /api/breeding/runs`
- `GET /api/claws/:clawId/provenance`

---

## Related docs
- [Mock commerce reference](./MOCK_API.md)
- [Frontend task tracker](./FRONTEND_TASK.md)
- [Backend task tracker](./BACKEND_TASK.md)
