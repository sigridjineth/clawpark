# ClawPark API Mock Specification

**Document Version:** v1.0
**Last Updated:** March 19, 2026
**Purpose:** Complete API specification for independent frontend development

Frontend developers use this document to build UI without backend. Each endpoint includes:
- Request format (method, path, headers, body)
- Response format (JSON with real example data)
- Error responses (400, 401, 404, 500 examples)
- Auth requirements (Discord OAuth or open)

---

## Base URL

```
http://localhost:8787/api/v1
```

All examples assume `BASE = /api/v1`.

---

## Authentication

Most endpoints are **open** (no auth required). Some endpoints require **Discord OAuth session** (optional; local usage always works).

**Session Cookie:** `clawpark_session` (HttpOnly, Secure)
- Contains signed JWT with `discord_user_id` and `discord_handle`
- Expires after 30 days
- Passed automatically in requests from authenticated client

**When Required:** POST operations that create breeding proposals or intents (cross-owner scenarios).

---

## Specimen Data Model

All responses include full Specimen objects with nested Claw data.

```typescript
interface Specimen {
  id: string;                    // "spec-sage001"
  name: string;                  // "Sage"
  claw: Claw;                    // Full agent definition (see below)
  ownershipState: string;        // "imported" | "claimed" | "archived" | "published"
  breedState: string;            // "ready" | "cooldown" | "ineligible"
  provenance: {
    badge: string;               // "genesis" | "bred" | "imported" | "claimed" | "purchased"
    importedAt?: string;         // ISO 8601
    importedFrom?: string;       // ZIP filename
    parentAId?: string;          // If bred
    parentBId?: string;          // If bred
    discordUserId?: string;      // Owner Discord ID
    discordHandle?: string;      // Owner Discord handle
  };
  cooldownEndsAt?: string;       // ISO 8601, if on cooldown
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

interface Claw {
  id: string;
  name: string;
  archetype: string;             // "Creator", "Speedster", etc.
  generation: number;
  identity?: {
    creature: string;            // "Phoenix", "Sage", etc.
    role: string;                // "Creator", "Guide", etc.
    directive: string;           // Agent's purpose
    vibe: string;                // Personality summary
    emoji: string;               // Visual emoji
  };
  soul: {
    traits: Array<{
      id: string;
      label: string;
      description: string;
      weight: number;            // 0-1
      color: string;             // hex
      visualSymbol: {
        shapeModifier: string;
        description: string;
      };
    }>;
  };
  skills: {
    badges: Array<{
      id: string;
      label: string;
      icon: string;
      dominance: number;         // 0-1
      color: string;
    }>;
  };
  tools?: {
    loadout: Array<{
      id: string;
      label: string;
      icon: string;
      description: string;
      potency: number;           // 0-1
      color: string;
    }>;
  };
  visual: {
    primaryColor: string;
    secondaryColor: string;
    shapeModifiers: string[];
    pattern: string;             // "solid" | "gradient" | "stripe" | "dot" | "wave"
    glowIntensity: number;       // 0-1
  };
  intro: string;                 // Introductory flavor text
  lineage?: {
    parentA: string;             // Parent A ID
    parentB: string;             // Parent B ID
    inheritanceMap: Array<{
      type: string;              // "identity" | "soul" | "skill" | "tool"
      traitId: string;
      label: string;
      origin: string;            // "parentA" | "parentB" | "both" | "mutation"
      originWeight?: number;
      kind?: string;             // "inherited" | "dominant" | "fused" | "mutation"
      detail?: string;
    }>;
    breedingConversation?: Array<{
      id: string;
      speaker: string;           // "user" | "parentA" | "parentB" | "fusion"
      title: string;
      content: string;
    }>;
    doctrine?: {
      title: string;
      creed: string;
      summary: string;
    };
  };
}
```

---

## Endpoints

### 1. GET /api/v1/home

**Auth:** Optional (session cookie or no user)

**Purpose:** Status summary and next action recommendation

**Request:**
```
GET /api/v1/home
```

**Response (200):**
```json
{
  "connected_identity": {
    "discordUserId": "123456789",
    "discordHandle": "SageKeeper",
    "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
    "verifiedAt": "2026-03-18T10:00:00Z"
  },
  "owned_claw_count": 5,
  "breedable_pairs": 2,
  "pending_claims": 1,
  "unsaved_children": 0,
  "what_to_do_next": "Claim your imported agent and select a breeding pair",
  "suggested_actions": [
    {
      "id": "claim_pending",
      "label": "Claim Imported Agent",
      "description": "You have 1 agent waiting to be claimed",
      "cta": "Claim Now",
      "screen": "import",
      "priority": 1,
      "endpoint": "/api/v1/specimens/spec-import001/claim",
      "method": "POST"
    },
    {
      "id": "select_pair",
      "label": "Select a Breeding Pair",
      "description": "You have 2 eligible pairs ready to breed",
      "cta": "Go to Nursery",
      "screen": "nursery",
      "priority": 2
    }
  ]
}
```

**Response (200) — No User (Local Mode):**
```json
{
  "connected_identity": null,
  "owned_claw_count": 0,
  "breedable_pairs": 0,
  "pending_claims": 0,
  "unsaved_children": 0,
  "what_to_do_next": "Import your first OpenClaw agent to get started",
  "suggested_actions": [
    {
      "id": "import_first",
      "label": "Import Your First Agent",
      "description": "Upload an OpenClaw workspace ZIP",
      "cta": "Import",
      "screen": "import",
      "priority": 1
    }
  ]
}
```

---

### 2. POST /api/v1/imports/openclaw

**Auth:** Optional (session cookie or discord_user_id in form)

**Purpose:** Upload OpenClaw agent ZIP, parse, return preview

**Request:**
```
POST /api/v1/imports/openclaw
Content-Type: multipart/form-data

file: <ZIP bytes>
discord_user_id: "123456789" (optional)
```

**Response (201):**
```json
{
  "importId": "imp-abc12345",
  "specimenId": "spec-sage001",
  "importRecord": {
    "importId": "imp-abc12345",
    "status": "parsed",
    "warnings": [
      "TOOLS.md missing; assuming no tools"
    ]
  },
  "specimen": {
    "id": "spec-sage001",
    "name": "Sage",
    "claw": {
      "id": "sage-uuid",
      "name": "Sage",
      "archetype": "Creator",
      "generation": 1,
      "identity": {
        "creature": "Sage",
        "role": "Creator",
        "directive": "Guides the creation of new ideas",
        "vibe": "Thoughtful and deliberate",
        "emoji": "🌟"
      },
      "soul": {
        "traits": [
          {
            "id": "trait-wisdom",
            "label": "Wisdom",
            "description": "Deep understanding and foresight",
            "weight": 0.9,
            "color": "#8B7DFF",
            "visualSymbol": {
              "shapeModifier": "crystalline",
              "description": "Prismatic pattern"
            }
          },
          {
            "id": "trait-patience",
            "label": "Patience",
            "description": "Ability to wait for the right moment",
            "weight": 0.7,
            "color": "#4B9FFF",
            "visualSymbol": {
              "shapeModifier": "organic",
              "description": "Flowing curves"
            }
          }
        ]
      },
      "skills": {
        "badges": [
          {
            "id": "skill-mentoring",
            "label": "Mentoring",
            "icon": "👨‍🏫",
            "dominance": 0.85,
            "color": "#FFB84D"
          }
        ]
      },
      "tools": {
        "loadout": [
          {
            "id": "tool-compass",
            "label": "Compass",
            "icon": "🧭",
            "description": "Navigate to meaningful destinations",
            "potency": 0.75,
            "color": "#C4A747"
          }
        ]
      },
      "visual": {
        "primaryColor": "#8B7DFF",
        "secondaryColor": "#4B9FFF",
        "shapeModifiers": ["crystalline", "organic"],
        "pattern": "gradient",
        "glowIntensity": 0.6
      },
      "intro": "A wise guide who helps others find their path forward."
    },
    "ownershipState": "imported",
    "breedState": "ready",
    "provenance": {
      "badge": "imported",
      "importedAt": "2026-03-19T12:00:00Z",
      "importedFrom": "Sage.zip"
    },
    "createdAt": "2026-03-19T12:00:00Z",
    "updatedAt": "2026-03-19T12:00:00Z"
  }
}
```

**Error (400) — Invalid ZIP:**
```json
{
  "error": "Invalid OpenClaw workspace: IDENTITY.md missing"
}
```

**Error (409) — Duplicate (same fingerprint):**
```json
{
  "error": "This agent has already been imported (fingerprint: abc123def456)"
}
```

---

### 3. GET /api/v1/imports/:id

**Auth:** None

**Purpose:** Fetch import record by ID

**Request:**
```
GET /api/v1/imports/imp-abc12345
```

**Response (200):**
```json
{
  "importId": "imp-abc12345",
  "status": "parsed",
  "warnings": [],
  "specimenId": "spec-sage001"
}
```

**Error (404):**
```json
{
  "error": "Import record not found"
}
```

---

### 4. POST /api/v1/specimens/:id/claim

**Auth:** Optional (session cookie or discord_user_id in body)

**Purpose:** Claim imported specimen, mark as owned

**Request:**
```
POST /api/v1/specimens/spec-sage001/claim
Content-Type: application/json

{
  "discord_user_id": "123456789" (optional)
}
```

**Response (200):**
```json
{
  "id": "spec-sage001",
  "name": "Sage",
  "claw": { /* full Claw object */ },
  "ownershipState": "claimed",
  "breedState": "ready",
  "provenance": {
    "badge": "claimed",
    "importedAt": "2026-03-19T12:00:00Z",
    "discordUserId": "123456789",
    "discordHandle": "SageKeeper"
  },
  "createdAt": "2026-03-19T12:00:00Z",
  "updatedAt": "2026-03-19T12:00:15Z"
}
```

**Error (404):**
```json
{
  "error": "Specimen not found"
}
```

**Error (400) — Already claimed:**
```json
{
  "error": "Specimen already claimed"
}
```

---

### 5. GET /api/v1/specimens

**Auth:** None

**Purpose:** List all claimed specimens (optional filters)

**Request:**
```
GET /api/v1/specimens
GET /api/v1/specimens?ownership_state=claimed
GET /api/v1/specimens?discord_user_id=123456789
```

**Response (200):**
```json
{
  "specimens": [
    {
      "id": "spec-sage001",
      "name": "Sage",
      "claw": { /* full Claw */ },
      "ownershipState": "claimed",
      "breedState": "ready",
      "provenance": { /* ... */ },
      "createdAt": "2026-03-19T12:00:00Z",
      "updatedAt": "2026-03-19T12:00:15Z"
    },
    {
      "id": "spec-bolt001",
      "name": "Bolt",
      "claw": { /* full Claw */ },
      "ownershipState": "claimed",
      "breedState": "ready",
      "provenance": { /* ... */ },
      "createdAt": "2026-03-19T12:01:00Z",
      "updatedAt": "2026-03-19T12:01:15Z"
    }
  ],
  "total": 2
}
```

---

### 6. GET /api/v1/specimens/:id

**Auth:** None

**Purpose:** Fetch single specimen by ID

**Request:**
```
GET /api/v1/specimens/spec-sage001
```

**Response (200):**
```json
{
  "id": "spec-sage001",
  "name": "Sage",
  "claw": { /* full Claw */ },
  "ownershipState": "claimed",
  "breedState": "ready",
  "provenance": { /* ... */ },
  "createdAt": "2026-03-19T12:00:00Z",
  "updatedAt": "2026-03-19T12:00:15Z"
}
```

**Error (404):**
```json
{
  "error": "Specimen not found"
}
```

---

### 7. GET /api/v1/breeding/eligibility

**Auth:** None

**Purpose:** Check if two specimens can breed

**Request:**
```
GET /api/v1/breeding/eligibility?parentA=spec-sage001&parentB=spec-bolt001
```

**Response (200) — Eligible:**
```json
{
  "eligible": true,
  "parentA": {
    "id": "spec-sage001",
    "breedState": "ready",
    "eligible": true
  },
  "parentB": {
    "id": "spec-bolt001",
    "breedState": "ready",
    "eligible": true
  }
}
```

**Response (200) — Not Eligible:**
```json
{
  "eligible": false,
  "parentA": {
    "id": "spec-sage001",
    "breedState": "cooldown",
    "eligible": false
  },
  "parentB": {
    "id": "spec-bolt001",
    "breedState": "ready",
    "eligible": true
  },
  "reasonCode": "parent_a_cooldown",
  "reason": "Sage is on breeding cooldown until 2026-03-21"
}
```

**Error (400):**
```json
{
  "error": "parentA and parentB query params required"
}
```

---

### 8. POST /api/v1/breeding/runs

**Auth:** Optional (session for Discord user tracking)

**Purpose:** Execute breeding between two specimens

**Request:**
```
POST /api/v1/breeding/runs
Content-Type: application/json

{
  "parentA": "spec-sage001",
  "parentB": "spec-bolt001",
  "prompt": "Create a child that balances wisdom and speed"
}
```

**Response (201) — Success:**
```json
{
  "runId": "run-xyz789",
  "status": "complete",
  "child": {
    "id": "spec-nova001",
    "name": "Nova",
    "claw": {
      "id": "nova-uuid",
      "name": "Nova",
      "archetype": "Sage Speedster",
      "generation": 2,
      "identity": {
        "creature": "Nova",
        "role": "Guide",
        "directive": "Moves wisdom swiftly",
        "vibe": "Quick-witted and thoughtful",
        "emoji": "⚡"
      },
      "soul": {
        "traits": [
          {
            "id": "trait-wisdom",
            "label": "Wisdom",
            "weight": 0.85,
            "color": "#8B7DFF",
            "visualSymbol": { /* ... */ }
          },
          {
            "id": "trait-speed",
            "label": "Speed",
            "weight": 0.75,
            "color": "#FF6B6B",
            "visualSymbol": { /* ... */ }
          },
          {
            "id": "trait-clarity",
            "label": "Clarity",
            "weight": 0.65,
            "color": "#4DD0E1",
            "visualSymbol": { /* ... */ }
          }
        ]
      },
      "skills": {
        "badges": [
          {
            "id": "skill-mentoring",
            "label": "Mentoring",
            "dominance": 0.8,
            "color": "#FFB84D"
          },
          {
            "id": "skill-swift-thinking",
            "label": "Swift Thinking",
            "dominance": 0.75,
            "color": "#FF6B6B"
          }
        ]
      },
      "tools": {
        "loadout": [
          {
            "id": "tool-compass",
            "label": "Compass",
            "description": "Navigate to meaningful destinations",
            "potency": 0.7,
            "color": "#C4A747"
          }
        ]
      },
      "visual": {
        "primaryColor": "#8B7DFF",
        "secondaryColor": "#FF6B6B",
        "shapeModifiers": ["crystalline", "angular"],
        "pattern": "gradient",
        "glowIntensity": 0.7
      },
      "intro": "A guide who moves with purpose and clarity.",
      "lineage": {
        "parentA": "spec-sage001",
        "parentB": "spec-bolt001",
        "inheritanceMap": [
          {
            "type": "soul",
            "traitId": "trait-wisdom",
            "label": "Wisdom",
            "origin": "parentA",
            "kind": "inherited"
          },
          {
            "type": "soul",
            "traitId": "trait-speed",
            "label": "Speed",
            "origin": "parentB",
            "kind": "inherited"
          },
          {
            "type": "soul",
            "traitId": "trait-clarity",
            "label": "Clarity",
            "origin": "both",
            "kind": "fused"
          }
        ],
        "breedingConversation": [
          {
            "id": "turn-1",
            "speaker": "user",
            "title": "Breeding Intent",
            "content": "Create a child that balances wisdom and speed"
          },
          {
            "id": "turn-2",
            "speaker": "parentA",
            "title": "Sage speaks",
            "content": "I offer my patient wisdom, my ability to see deeply..."
          },
          {
            "id": "turn-3",
            "speaker": "parentB",
            "title": "Bolt speaks",
            "content": "I bring speed and agility, momentum and transformation..."
          },
          {
            "id": "turn-4",
            "speaker": "fusion",
            "title": "The Child Emerges",
            "content": "I am Nova, wisdom in motion, clarity through speed..."
          }
        ],
        "doctrine": {
          "title": "The Way of Clear Movement",
          "creed": "Speed without wisdom is chaos; wisdom without speed is stagnation. I move with purpose.",
          "summary": "Nova balances contemplation with action, bringing clarity to rapid change."
        }
      }
    },
    "ownershipState": "imported",
    "breedState": "ready",
    "provenance": {
      "badge": "bred",
      "parentAId": "spec-sage001",
      "parentBId": "spec-bolt001"
    },
    "createdAt": "2026-03-19T12:30:00Z",
    "updatedAt": "2026-03-19T12:30:00Z"
  },
  "inheritanceMap": [
    {
      "type": "soul",
      "traitId": "trait-wisdom",
      "label": "Wisdom",
      "origin": "parentA",
      "kind": "inherited"
    }
  ],
  "mutationOccurred": true
}
```

**Error (400) — Not Eligible:**
```json
{
  "error": "Sage is on breeding cooldown until 2026-03-21"
}
```

**Error (401) — Cross-Owner, Consent Pending:**
```json
{
  "error": "Consent required: proposal created",
  "proposalId": "prop-abc123"
}
```

---

### 9. GET /api/v1/breeding/runs/:id

**Auth:** None

**Purpose:** Fetch breeding run status

**Request:**
```
GET /api/v1/breeding/runs/run-xyz789
```

**Response (200):**
```json
{
  "runId": "run-xyz789",
  "parentAId": "spec-sage001",
  "parentBId": "spec-bolt001",
  "prompt": "Create a child that balances wisdom and speed",
  "status": "complete",
  "childSpecimenId": "spec-nova001",
  "createdAt": "2026-03-19T12:30:00Z"
}
```

---

### 10. POST /api/v1/breeding/runs/:id/save

**Auth:** Optional (session for Discord user tracking)

**Purpose:** Save child specimen to nursery

**Request:**
```
POST /api/v1/breeding/runs/run-xyz789/save
```

**Response (200):**
```json
{
  "id": "spec-nova001",
  "name": "Nova",
  "claw": { /* full Claw */ },
  "ownershipState": "claimed",
  "breedState": "ready",
  "provenance": {
    "badge": "bred",
    "parentAId": "spec-sage001",
    "parentBId": "spec-bolt001"
  },
  "createdAt": "2026-03-19T12:30:00Z",
  "updatedAt": "2026-03-19T12:30:00Z"
}
```

---

### 11. GET /api/v1/lineages/:id

**Auth:** None

**Purpose:** Fetch full lineage tree for a specimen

**Request:**
```
GET /api/v1/lineages/spec-nova001
```

**Response (200):**
```json
{
  "root": {
    "specimen": {
      "id": "spec-nova001",
      "name": "Nova",
      "claw": { /* full Claw with lineage */ },
      "ownershipState": "claimed",
      "breedState": "ready",
      "provenance": {
        "badge": "bred",
        "parentAId": "spec-sage001",
        "parentBId": "spec-bolt001"
      },
      "createdAt": "2026-03-19T12:30:00Z",
      "updatedAt": "2026-03-19T12:30:00Z"
    },
    "parentA": {
      "specimen": {
        "id": "spec-sage001",
        "name": "Sage",
        "claw": { /* full Claw */ },
        "ownershipState": "claimed",
        "breedState": "cooldown",
        "provenance": {
          "badge": "imported",
          "importedAt": "2026-03-19T12:00:00Z"
        },
        "createdAt": "2026-03-19T12:00:00Z",
        "updatedAt": "2026-03-19T12:30:00Z",
        "cooldownEndsAt": "2026-03-21T12:30:00Z"
      },
      "parentA": null,
      "parentB": null
    },
    "parentB": {
      "specimen": {
        "id": "spec-bolt001",
        "name": "Bolt",
        "claw": { /* full Claw */ },
        "ownershipState": "claimed",
        "breedState": "cooldown",
        "provenance": {
          "badge": "imported",
          "importedAt": "2026-03-19T12:01:00Z"
        },
        "createdAt": "2026-03-19T12:01:00Z",
        "updatedAt": "2026-03-19T12:30:00Z",
        "cooldownEndsAt": "2026-03-21T12:30:00Z"
      },
      "parentA": null,
      "parentB": null
    }
  },
  "depth": 2
}
```

---

### 12. POST /api/v1/discord/intents

**Auth:** Optional (Discord user ID from session or body)

**Purpose:** Create breeding intent from Discord message

**Request:**
```
POST /api/v1/discord/intents
Content-Type: application/json

{
  "source_message": "breed sage and bolt please",
  "source_surface": "discord",
  "requester_identity": {
    "discordUserId": "123456789",
    "handle": "SageKeeper"
  },
  "target_specimen_ids": ["spec-sage001", "spec-bolt001"]
}
```

**Response (201) — Same Owner (Auto-Approve):**
```json
{
  "intentId": "intent-abc123",
  "status": "eligibility_checked",
  "suggestedCandidates": [],
  "blockReason": null,
  "createdAt": "2026-03-19T12:05:00Z",
  "updatedAt": "2026-03-19T12:05:00Z"
}
```

**Response (201) — Cross-Owner (Consent Pending):**
```json
{
  "intentId": "intent-def456",
  "status": "consent_pending",
  "suggestedCandidates": [],
  "blockReason": null,
  "proposalId": "prop-xyz789",
  "createdAt": "2026-03-19T12:06:00Z",
  "updatedAt": "2026-03-19T12:06:00Z"
}
```

**Response (201) — Need Candidates:**
```json
{
  "intentId": "intent-ghi789",
  "status": "candidate_suggested",
  "suggestedCandidates": [
    {
      "specimenId": "spec-bolt001",
      "name": "Bolt",
      "compatibilitySummary": "Speed and agility; good complement to Sage's wisdom",
      "ownerRelationship": "same-linked-identity",
      "eligibleForAutoApprove": true
    },
    {
      "specimenId": "spec-prism001",
      "name": "Prism",
      "compatibilitySummary": "Multi-faceted wisdom; synergizes well",
      "ownerRelationship": "cross-owner",
      "eligibleForAutoApprove": false
    }
  ],
  "blockReason": null,
  "createdAt": "2026-03-19T12:07:00Z",
  "updatedAt": "2026-03-19T12:07:00Z"
}
```

**Error (400) — Unknown Specimen:**
```json
{
  "error": "Specimen 'sage' not found",
  "suggestedMatches": ["spec-sage001", "spec-sage-v2"]
}
```

---

### 13. GET /api/v1/discord/intents/:id

**Auth:** None

**Purpose:** Fetch breeding intent by ID (for multi-turn context)

**Request:**
```
GET /api/v1/discord/intents/intent-abc123
```

**Response (200):**
```json
{
  "intentId": "intent-abc123",
  "status": "eligibility_checked",
  "suggestedCandidates": [],
  "blockReason": null,
  "createdAt": "2026-03-19T12:05:00Z",
  "updatedAt": "2026-03-19T12:05:00Z"
}
```

---

### 14. POST /api/v1/breeding/proposals

**Auth:** Optional (session or body)

**Purpose:** Create consent proposal for cross-owner breeding

**Request:**
```
POST /api/v1/breeding/proposals
Content-Type: application/json

{
  "parentAId": "spec-sage001",
  "parentBId": "spec-prism001",
  "requesterId": "123456789",
  "intentId": "intent-ghi789"
}
```

**Response (201):**
```json
{
  "id": "prop-xyz789",
  "parentAId": "spec-sage001",
  "parentBId": "spec-prism001",
  "requesterId": "123456789",
  "consentStatus": "pending",
  "expiresAt": "2026-03-20T12:07:00Z",
  "createdAt": "2026-03-19T12:07:00Z"
}
```

---

### 15. POST /api/v1/breeding/proposals/:id/consent

**Auth:** Required (Discord session)

**Purpose:** Give consent (approve/reject) to breeding proposal

**Request:**
```
POST /api/v1/breeding/proposals/prop-xyz789/consent
Content-Type: application/json

{
  "status": "approved"
}
```

**Response (200):**
```json
{
  "id": "prop-xyz789",
  "parentAId": "spec-sage001",
  "parentBId": "spec-prism001",
  "requesterId": "123456789",
  "consentStatus": "approved",
  "expiresAt": "2026-03-20T12:07:00Z",
  "createdAt": "2026-03-19T12:07:00Z"
}
```

**Error (401) — Not Authenticated:**
```json
{
  "error": "Discord OAuth required to give consent"
}
```

---

### 16. GET /api/auth/session

**Auth:** Optional (reads session cookie)

**Purpose:** Get current session info or null if not logged in

**Request:**
```
GET /api/auth/session
```

**Response (200) — Authenticated:**
```json
{
  "discordUserId": "123456789",
  "discordHandle": "SageKeeper",
  "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
  "verifiedAt": "2026-03-18T10:00:00Z",
  "expiresAt": "2026-04-18T10:00:00Z"
}
```

**Response (200) — Not Authenticated:**
```json
{
  "discordUserId": null,
  "discordHandle": null,
  "avatarUrl": null,
  "verifiedAt": null,
  "expiresAt": null
}
```

---

## Error Response Format

All errors follow standard HTTP status codes with JSON body:

**400 Bad Request:**
```json
{
  "error": "Human-readable error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Discord OAuth required for this action"
}
```

**404 Not Found:**
```json
{
  "error": "Specimen not found"
}
```

**409 Conflict:**
```json
{
  "error": "This agent has already been imported"
}
```

**500 Internal Server Error:**
```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

---

## Common Patterns

### Pagination (Future)

Not implemented in MVP, but structure for future:

```
GET /api/v1/specimens?limit=10&offset=0
```

Response includes `total` count and items array.

### Filters

Specimens:
```
GET /api/v1/specimens?ownership_state=claimed
GET /api/v1/specimens?discord_user_id=123456789
```

### Timestamps

All timestamps are ISO 8601 UTC:
```
2026-03-19T12:30:00Z
```

### IDs

All IDs use UUID with short prefix:
```
spec-abc12345      (Specimen)
imp-def67890       (Import)
run-ghi11111       (Breeding Run)
intent-jkl22222    (Intent)
prop-mno33333      (Proposal)
```

---

## Mock Data Reference

Frontend developers can use these names/IDs in manual testing:

**Sample Specimens:**
- `spec-sage001` — Sage (Wisdom, Patience, Creator role)
- `spec-bolt001` — Bolt (Speed, Agility, Speedster role)
- `spec-prism001` — Prism (Clarity, Reflection, Glass-breaker role)
- `spec-echo001` — Echo (Resonance, Amplification, Amplifier role)

**Sample Discord Users:**
- `123456789` / `SageKeeper`
- `987654321` / `BoltRunner`
- `111222333` / `PrismBreaker`

**Realistic Import Flows:**
1. Import Sage → `spec-sage001` (no tools warning)
2. Claim as SageKeeper
3. Import Bolt → `spec-bolt001` (all fields)
4. Claim as BoltRunner
5. Breed together → `spec-nova001` with lineage
6. Save child to nursery

---

## Testing Checklist for Frontend

- [ ] GET /api/v1/home displays correctly with and without user
- [ ] POST /api/v1/imports/openclaw shows preview
- [ ] POST /api/v1/specimens/:id/claim updates ownership
- [ ] GET /api/v1/specimens lists all specimens
- [ ] GET /api/v1/breeding/eligibility shows compatible pairs
- [ ] POST /api/v1/breeding/runs creates child with lineage
- [ ] GET /api/v1/lineages/:id shows full tree
- [ ] POST /api/v1/discord/intents creates intent
- [ ] Error responses show helpful messages
- [ ] All endpoints work without session cookie
- [ ] Session cookie improves personalization

---

**End of Mock API Specification**
