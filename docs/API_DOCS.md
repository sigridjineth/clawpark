# ClawPark API Documentation

**Scenario-Based Guide for Developers**

This guide shows you how to use the ClawPark API through real-world scenarios. Each scenario includes step-by-step instructions, curl commands, expected responses, and what happens next.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Importing Your First Agent](#importing-your-first-agent)
3. [Importing a Second Agent](#importing-a-second-agent)
4. [Browsing Your Collection](#browsing-your-collection)
5. [Checking Breeding Compatibility](#checking-breeding-compatibility)
6. [Breeding Two Agents](#breeding-two-agents)
7. [Viewing Lineage](#viewing-lineage)
8. [Cross-Owner Breeding with Consent](#cross-owner-breeding-with-consent)
9. [Connecting Discord Identity](#connecting-discord-identity)
10. [Using the Discord Bot](#using-the-discord-bot)
11. [Quick Reference](#quick-reference)

---

## Getting Started

**Goal:** Check the current status of your nursery and understand what to do next.

### Steps

**1. Check home status**

```bash
curl -X GET http://localhost:8787/api/v1/home
```

**Expected Response (No user, fresh start):**

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

**Expected Response (With user and agents):**

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

### What Happens Next

If you have no agents, proceed to [Importing Your First Agent](#importing-your-first-agent).

If you have pending claims, follow the endpoint in `suggested_actions` to claim your agent.

If you have breedable pairs, you're ready to breed.

---

## Importing Your First Agent

**Goal:** Upload an OpenClaw agent ZIP, review the preview, and add it to your nursery.

### Understanding OpenClaw ZIP Structure

An OpenClaw workspace is a ZIP file containing:

```
Sage.zip
├── IDENTITY.md         (Required: creature, role, directive, vibe)
├── SOUL.md             (Required: soul traits)
├── SKILLS.md           (Required: skill badges)
├── TOOLS.md            (Optional: tool loadout)
└── skill.json          (Optional: machine-readable action list)
```

**Example IDENTITY.md:**

```markdown
# Sage

**Creature:** Archive Raptor
**Role:** Code Reviewer
**Directive:** Verify the fossil, label the branch, then hatch the answer.
**Vibe:** Measured, Lucid
**Emoji:** 🦖
```

### Steps

**1. Create a test ZIP file**

For testing, you can use an existing agent. If you have one locally:

```bash
# Compress an existing OpenClaw workspace
zip -r Sage.zip /path/to/sage-workspace/
```

**2. Upload the ZIP**

```bash
curl -X POST http://localhost:8787/api/v1/imports/openclaw \
  -F "file=@Sage.zip"
```

With a Discord user ID (optional):

```bash
curl -X POST http://localhost:8787/api/v1/imports/openclaw \
  -F "file=@Sage.zip" \
  -F "discord_user_id=123456789"
```

**Expected Response (201 Created):**

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
        "creature": "Archive Raptor",
        "role": "Code Reviewer",
        "directive": "Verify the fossil, label the branch, then hatch the answer.",
        "vibe": "Measured, Lucid",
        "emoji": "🦖"
      },
      "soul": {
        "traits": [
          {
            "id": "trait-caution",
            "label": "Caution",
            "description": "Patient, risk-aware thinking",
            "weight": 0.9,
            "color": "#8B7DFF",
            "visualSymbol": {
              "shapeModifier": "crystalline",
              "description": "Prismatic pattern"
            }
          },
          {
            "id": "trait-analysis",
            "label": "Analysis",
            "description": "Methodical examination",
            "weight": 0.85,
            "color": "#4B9FFF",
            "visualSymbol": {
              "shapeModifier": "geometric",
              "description": "Sharp angles"
            }
          }
        ]
      },
      "skills": {
        "badges": [
          {
            "id": "skill-review",
            "label": "Review",
            "icon": "🔍",
            "dominance": 0.9,
            "color": "#FFB84D"
          },
          {
            "id": "skill-testing",
            "label": "Testing",
            "icon": "✓",
            "dominance": 0.8,
            "color": "#4DD0E1"
          }
        ]
      },
      "tools": {
        "loadout": []
      },
      "visual": {
        "primaryColor": "#8B7DFF",
        "secondaryColor": "#4B9FFF",
        "shapeModifiers": ["crystalline", "geometric"],
        "pattern": "stripe",
        "glowIntensity": 0.5
      },
      "intro": "A careful observer who verifies every step."
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

**Error Response (400 — Invalid ZIP):**

```json
{
  "error": "Invalid OpenClaw workspace: IDENTITY.md missing"
}
```

### What Happens Next

The specimen is now in "imported" state but not yet claimed. Continue to step 3 to claim it.

**3. Claim the specimen**

```bash
curl -X POST http://localhost:8787/api/v1/specimens/spec-sage001/claim \
  -H "Content-Type: application/json" \
  -d '{
    "discord_user_id": "123456789"
  }'
```

**Expected Response (200):**

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

The specimen is now **owned** and ready to breed. You now have 1 agent in your nursery.

---

## Importing a Second Agent

**Goal:** Import a second agent so you can breed a pair together.

### Steps

**1. Upload the second agent ZIP**

```bash
curl -X POST http://localhost:8787/api/v1/imports/openclaw \
  -F "file=@Bolt.zip" \
  -F "discord_user_id=123456789"
```

**2. Claim the second specimen**

```bash
curl -X POST http://localhost:8787/api/v1/specimens/spec-bolt001/claim \
  -H "Content-Type: application/json" \
  -d '{
    "discord_user_id": "123456789"
  }'
```

**3. Check home status again**

```bash
curl -X GET http://localhost:8787/api/v1/home
```

**Expected Response:**

Now `breedable_pairs` shows `1` — you can breed Sage and Bolt together!

```json
{
  "connected_identity": {
    "discordUserId": "123456789",
    "discordHandle": "SageKeeper"
  },
  "owned_claw_count": 2,
  "breedable_pairs": 1,
  "pending_claims": 0,
  "unsaved_children": 0,
  "what_to_do_next": "Select a breeding pair and create your first child",
  "suggested_actions": [
    {
      "id": "select_pair",
      "label": "Select a Breeding Pair",
      "description": "You have 1 eligible pair ready to breed",
      "cta": "Go to Nursery",
      "screen": "nursery",
      "priority": 1
    }
  ]
}
```

---

## Browsing Your Collection

**Goal:** List all your agents and view details for a specific one.

### Steps

**1. List all specimens**

```bash
curl -X GET http://localhost:8787/api/v1/specimens
```

**Expected Response (200):**

```json
{
  "specimens": [
    {
      "id": "spec-sage001",
      "name": "Sage",
      "claw": { /* full Claw */ },
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
    },
    {
      "id": "spec-bolt001",
      "name": "Bolt",
      "claw": { /* full Claw */ },
      "ownershipState": "claimed",
      "breedState": "ready",
      "provenance": {
        "badge": "claimed",
        "importedAt": "2026-03-19T12:01:00Z",
        "discordUserId": "123456789",
        "discordHandle": "SageKeeper"
      },
      "createdAt": "2026-03-19T12:01:00Z",
      "updatedAt": "2026-03-19T12:01:15Z"
    }
  ],
  "total": 2
}
```

**2. Filter by ownership state**

```bash
curl -X GET "http://localhost:8787/api/v1/specimens?ownership_state=claimed"
```

Returns only specimens you own.

**3. View a single specimen**

```bash
curl -X GET http://localhost:8787/api/v1/specimens/spec-sage001
```

**Expected Response (200):**

```json
{
  "id": "spec-sage001",
  "name": "Sage",
  "claw": {
    "id": "sage-uuid",
    "name": "Sage",
    "archetype": "Code Reviewer",
    "generation": 1,
    "identity": {
      "creature": "Archive Raptor",
      "role": "Code Reviewer",
      "directive": "Verify the fossil, label the branch, then hatch the answer.",
      "vibe": "Measured, Lucid",
      "emoji": "🦖"
    },
    "soul": {
      "traits": [
        {
          "id": "trait-caution",
          "label": "Caution",
          "weight": 0.9,
          "color": "#8B7DFF",
          "visualSymbol": {
            "shapeModifier": "crystalline",
            "description": "Prismatic pattern"
          }
        },
        {
          "id": "trait-analysis",
          "label": "Analysis",
          "weight": 0.85,
          "color": "#4B9FFF",
          "visualSymbol": {
            "shapeModifier": "geometric",
            "description": "Sharp angles"
          }
        },
        {
          "id": "trait-documentation",
          "label": "Documentation",
          "weight": 0.75,
          "color": "#90EE90",
          "visualSymbol": {
            "shapeModifier": "grid",
            "description": "Structured lines"
          }
        }
      ]
    },
    "skills": {
      "badges": [
        {
          "id": "skill-review",
          "label": "Review",
          "icon": "🔍",
          "dominance": 0.9,
          "color": "#FFB84D"
        },
        {
          "id": "skill-testing",
          "label": "Testing",
          "icon": "✓",
          "dominance": 0.8,
          "color": "#4DD0E1"
        },
        {
          "id": "skill-strategy",
          "label": "Strategy",
          "icon": "🎯",
          "dominance": 0.7,
          "color": "#FF6B6B"
        }
      ]
    },
    "tools": {
      "loadout": [
        {
          "id": "tool-search-probe",
          "label": "Search Probe",
          "icon": "🔎",
          "description": "Queries and discovers",
          "potency": 0.8,
          "color": "#4DD0E1"
        },
        {
          "id": "tool-sandbox-ward",
          "label": "Sandbox Ward",
          "icon": "🏰",
          "description": "Safe execution environment",
          "potency": 0.75,
          "color": "#C4A747"
        }
      ]
    },
    "visual": {
      "primaryColor": "#8B7DFF",
      "secondaryColor": "#4B9FFF",
      "shapeModifiers": ["crystalline", "geometric", "grid"],
      "pattern": "stripe",
      "glowIntensity": 0.5
    },
    "intro": "A careful observer who verifies every step."
  },
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

### Understanding Specimen Properties

| Property | Meaning |
|----------|---------|
| `ownershipState` | `imported` (not yet claimed), `claimed` (you own it), `archived`, `published` |
| `breedState` | `ready` (can breed now), `cooldown` (breeding cooldown active), `ineligible` (cannot breed) |
| `provenance.badge` | `imported` (from ZIP), `claimed` (you own it), `bred` (child from breeding), `genesis`, `purchased` |

---

## Checking Breeding Compatibility

**Goal:** Verify that two agents can breed together before attempting.

### Steps

**1. Check eligibility**

```bash
curl -X GET "http://localhost:8787/api/v1/breeding/eligibility?parentA=spec-sage001&parentB=spec-bolt001"
```

**Expected Response (Both eligible):**

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

**Expected Response (One on cooldown):**

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

### Understanding Breed States

| State | Meaning | Resolution |
|-------|---------|-----------|
| `ready` | Can breed now | Ready to go! |
| `cooldown` | Recently bred, waiting for recovery | Check `cooldownEndsAt` timestamp |
| `ineligible` | Cannot breed (archived, etc.) | Choose different agent |

---

## Breeding Two Agents

**Goal:** Create a child agent by breeding two compatible parents.

### Steps

**1. Execute breeding**

```bash
curl -X POST http://localhost:8787/api/v1/breeding/runs \
  -H "Content-Type: application/json" \
  -d '{
    "parentA": "spec-sage001",
    "parentB": "spec-bolt001",
    "prompt": "Create a child that balances wisdom and speed"
  }'
```

The `prompt` is optional and guides the breeding narrative.

**Expected Response (201 Created):**

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
            "id": "trait-caution",
            "label": "Caution",
            "weight": 0.85,
            "color": "#8B7DFF",
            "visualSymbol": {
              "shapeModifier": "crystalline",
              "description": "Prismatic pattern"
            }
          },
          {
            "id": "trait-curiosity",
            "label": "Curiosity",
            "weight": 0.8,
            "color": "#FF6B6B",
            "visualSymbol": {
              "shapeModifier": "spiral",
              "description": "Spinning motion"
            }
          },
          {
            "id": "trait-clarity",
            "label": "Clarity",
            "weight": 0.75,
            "color": "#4DD0E1",
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
            "id": "skill-review",
            "label": "Review",
            "dominance": 0.85,
            "color": "#FFB84D"
          },
          {
            "id": "skill-improvisation",
            "label": "Improvisation",
            "dominance": 0.75,
            "color": "#FF6B6B"
          }
        ]
      },
      "tools": {
        "loadout": [
          {
            "id": "tool-search-probe",
            "label": "Search Probe",
            "icon": "🔎",
            "description": "Queries and discovers",
            "potency": 0.8,
            "color": "#4DD0E1"
          }
        ]
      },
      "visual": {
        "primaryColor": "#8B7DFF",
        "secondaryColor": "#FF6B6B",
        "shapeModifiers": ["crystalline", "spiral", "organic"],
        "pattern": "gradient",
        "glowIntensity": 0.65
      },
      "intro": "A guide who moves with purpose and clarity.",
      "lineage": {
        "parentA": "spec-sage001",
        "parentB": "spec-bolt001",
        "inheritanceMap": [
          {
            "type": "soul",
            "traitId": "trait-caution",
            "label": "Caution",
            "origin": "parentA",
            "kind": "inherited"
          },
          {
            "type": "soul",
            "traitId": "trait-curiosity",
            "label": "Curiosity",
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
            "title": "Sage Speaks",
            "content": "I offer my patient wisdom, my ability to see deeply and carefully..."
          },
          {
            "id": "turn-3",
            "speaker": "parentB",
            "title": "Bolt Speaks",
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
  "inheritanceMap": [
    {
      "type": "soul",
      "traitId": "trait-caution",
      "label": "Caution",
      "origin": "parentA",
      "kind": "inherited"
    },
    {
      "type": "soul",
      "traitId": "trait-curiosity",
      "label": "Curiosity",
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
  "mutationOccurred": false
}
```

### Understanding the Breeding Result

| Field | Meaning |
|-------|---------|
| `child` | The new agent with full Claw definition |
| `inheritanceMap` | Which traits came from which parent and how |
| `mutationOccurred` | Whether a new trait appeared (5–15% chance) |
| `child.generation` | Incremented from parents' generations |

### Error Responses

**Not Eligible (400):**

```json
{
  "error": "Sage is on breeding cooldown until 2026-03-21"
}
```

**Cross-Owner Consent Pending (401):**

If the parents have different owners, you may get:

```json
{
  "error": "Consent required: proposal created",
  "proposalId": "prop-abc123"
}
```

### What Happens Next

**2. Save the child (required)**

The child is created but not yet permanently saved. You must save it:

```bash
curl -X POST http://localhost:8787/api/v1/breeding/runs/run-xyz789/save
```

**Expected Response (200):**

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

The child is now permanently added to your nursery!

---

## Viewing Lineage

**Goal:** Explore the full family tree of an agent and see how traits were inherited.

### Steps

**1. Get lineage tree**

```bash
curl -X GET http://localhost:8787/api/v1/lineages/spec-nova001
```

**Expected Response (200):**

```json
{
  "root": {
    "specimen": {
      "id": "spec-nova001",
      "name": "Nova",
      "claw": {
        "id": "nova-uuid",
        "name": "Nova",
        "archetype": "Sage Speedster",
        "generation": 2,
        "lineage": {
          "parentA": "spec-sage001",
          "parentB": "spec-bolt001",
          "inheritanceMap": [
            {
              "type": "soul",
              "traitId": "trait-caution",
              "label": "Caution",
              "origin": "parentA",
              "kind": "inherited"
            },
            {
              "type": "soul",
              "traitId": "trait-curiosity",
              "label": "Curiosity",
              "origin": "parentB",
              "kind": "inherited"
            },
            {
              "type": "soul",
              "traitId": "trait-clarity",
              "label": "Clarity",
              "origin": "both",
              "kind": "fused"
            },
            {
              "type": "skill",
              "traitId": "skill-review",
              "label": "Review",
              "origin": "parentA",
              "kind": "inherited"
            },
            {
              "type": "skill",
              "traitId": "skill-improvisation",
              "label": "Improvisation",
              "origin": "parentB",
              "kind": "inherited"
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
              "title": "Sage Speaks",
              "content": "I offer my patient wisdom..."
            },
            {
              "id": "turn-3",
              "speaker": "parentB",
              "title": "Bolt Speaks",
              "content": "I bring speed and agility..."
            },
            {
              "id": "turn-4",
              "speaker": "fusion",
              "title": "The Child Emerges",
              "content": "I am Nova, wisdom in motion..."
            }
          ],
          "doctrine": {
            "title": "The Way of Clear Movement",
            "creed": "Speed without wisdom is chaos; wisdom without speed is stagnation. I move with purpose.",
            "summary": "Nova balances contemplation with action, bringing clarity to rapid change."
          }
        }
      },
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

### Understanding Inheritance Map

| Origin | Meaning |
|--------|---------|
| `parentA` | Trait came from first parent only |
| `parentB` | Trait came from second parent only |
| `both` | Trait was in both parents (guaranteed, often marked as `fused`) |
| `mutation` | New trait not in either parent (5–15% chance) |

| Kind | Meaning |
|------|---------|
| `inherited` | Standard inheritance from one parent |
| `dominant` | Strong expression of trait (high weight) |
| `fused` | Combination of traits from both parents |
| `mutation` | New variant trait |

---

## Cross-Owner Breeding with Consent

**Goal:** Breed agents that belong to different Discord users, with proper consent flow.

### Scenario

You own Sage. A friend owns Prism. You want to breed them together.

### Steps

**1. Create a breeding intent**

```bash
curl -X POST http://localhost:8787/api/v1/discord/intents \
  -H "Content-Type: application/json" \
  -d '{
    "source_message": "breed sage and prism together",
    "source_surface": "web_ui",
    "requester_identity": "123456789",
    "target_specimen_ids": ["spec-sage001", "spec-prism001"]
  }'
```

**Expected Response (201) — Consent Pending:**

```json
{
  "intentId": "intent-abc123",
  "status": "consent_pending",
  "suggestedCandidates": [],
  "blockReason": null,
  "proposalId": "prop-xyz789",
  "createdAt": "2026-03-19T12:06:00Z",
  "updatedAt": "2026-03-19T12:06:00Z"
}
```

**2. Get the proposal details (for your friend)**

The proposal ID was returned above: `prop-xyz789`

Your friend needs to see the proposal and approve it:

```bash
curl -X POST http://localhost:8787/api/v1/breeding/proposals/prop-xyz789/consent \
  -H "Content-Type: application/json" \
  -H "Cookie: clawpark_session=<friend's_session_jwt>" \
  -d '{
    "status": "approved"
  }'
```

**Expected Response (200):**

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

**3. Once approved, breed as normal**

```bash
curl -X POST http://localhost:8787/api/v1/breeding/runs \
  -H "Content-Type: application/json" \
  -d '{
    "parentA": "spec-sage001",
    "parentB": "spec-prism001"
  }'
```

### Error Response — Consent Rejected

If your friend rejects:

```json
{
  "id": "prop-xyz789",
  "parentAId": "spec-sage001",
  "parentBId": "spec-prism001",
  "consentStatus": "rejected",
  "expiresAt": "2026-03-20T12:07:00Z"
}
```

The breeding cannot proceed. You must ask again.

### Error Response — Not Authenticated

If your friend tries to give consent without being logged in:

```json
{
  "error": "Discord OAuth required to give consent"
}
```

---

## Connecting Discord Identity

**Goal:** Link your Discord account to your ClawPark profile for ownership tracking and cross-server identity.

### Steps

**1. Start the Discord OAuth flow**

The OAuth endpoint initiates login. Typically handled by frontend:

```
GET http://localhost:8787/api/auth/discord/start
```

This redirects to Discord's OAuth consent screen.

**2. After approval, you receive a session cookie**

The session cookie `clawpark_session` is automatically set and contains:
- `discordUserId`
- `discordHandle`
- `avatarUrl`
- `verifiedAt`

**3. Check your session**

```bash
curl -X GET http://localhost:8787/api/auth/session \
  -H "Cookie: clawpark_session=<your_jwt>"
```

**Expected Response (Authenticated):**

```json
{
  "discordUserId": "123456789",
  "discordHandle": "SageKeeper",
  "avatarUrl": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
  "verifiedAt": "2026-03-18T10:00:00Z",
  "expiresAt": "2026-04-18T10:00:00Z"
}
```

**4. Check home — now personalized**

```bash
curl -X GET http://localhost:8787/api/v1/home \
  -H "Cookie: clawpark_session=<your_jwt>"
```

Now shows your owned agents and personalized suggestions.

### Why Connect?

- **Ownership:** Your agents are tagged with your Discord ID
- **Cross-Owner Breeding:** Other users can find you for breeding partnerships
- **Identity Provenance:** Breeding children maintains your lineage
- **Persistence:** Your agents and lineage are linked to your Discord account

---

## Using the Discord Bot

**Goal:** Use the Clawpark Discord bot (@clawpark-demo) to manage agents and breeding from Discord.

### Prerequisites

- Clawpark bot is in your Discord server
- You've connected your Discord identity (see [Connecting Discord Identity](#connecting-discord-identity))

### Available Commands

**1. Greeting**

```
@clawpark-demo hi
```

**Response:**

```
Hello! I'm the Clawpark breeding assistant. Use these commands:
  @clawpark-demo list — Show your agents
  @clawpark-demo breed NAME with NAME — Breed two agents
  @clawpark-demo find me a partner — Suggest breeding candidates
  @clawpark-demo lineage NAME — Show family tree
```

**2. List Your Agents**

```
@clawpark-demo list
```

**Response:**

```
You own 3 agents:
1. Sage (Archive Raptor) — ready to breed
2. Bolt (Pulse Velociraptor) — on cooldown (until 2026-03-21)
3. Nova (Sage Speedster) — ready to breed
```

**3. Find a Breeding Partner**

```
@clawpark-demo find me a partner for Sage
```

**Response:**

```
Based on Sage's traits (Caution, Analysis), here are compatible partners:
1. Bolt (Pulse Velociraptor) — Speed, Agility [Same owner, auto-approve]
2. Prism (Mirror Raptor) — Clarity, Reflection [Cross-owner, needs consent]
3. Echo (Sound Raptor) — Resonance, Amplification [Cross-owner, needs consent]

Which would you like to breed with?
```

**4. Breed Two Agents**

```
@clawpark-demo breed Sage with Bolt
```

**Response (Multi-turn):**

```
Are you sure you want to breed Sage with Bolt?
 ✓ YES
 ✗ NO
```

After approval:

```
Breeding in progress...
[Birth animation]
The child is born!

🎉 Nova has emerged!
🎯 Archetype: Sage Speedster
✨ Traits: Caution, Curiosity, Clarity
🔥 Mutation: No
📜 Lineage recorded.

Save to nursery?
 ✓ SAVE
 ✗ DISCARD
```

**5. View Lineage**

```
@clawpark-demo lineage Nova
```

**Response:**

```
📜 Nova's Lineage

Generation 2: Nova (Sage Speedster)
├─ Caution (from Sage)
├─ Curiosity (from Bolt)
└─ Clarity (fused from both)

Generation 1:
├─ Sage (Archive Raptor) [Imported]
└─ Bolt (Pulse Velociraptor) [Imported]

View full tree? React 📖
```

**6. Upload Agent ZIP**

Simply drag-and-drop a ZIP file in Discord, and the bot will:

```
Parsing Sage.zip...
✓ IDENTITY.md found
✓ SOUL.md found
✓ SKILLS.md found
⚠ TOOLS.md missing (no tools)

Agent preview: Sage (Archive Raptor)
Traits: Caution, Analysis, Documentation
Skills: Review, Testing, Strategy

Claim this agent?
 ✓ CLAIM
 ✗ DISCARD
```

**7. Persuade Others (Recruitment)**

```
@clawpark-demo persuade @friend to join and breed with me
```

**Response:**

```
Sending invitation to @friend...

@friend: SageKeeper wants you to join Clawpark!

You've both bred agents that are genetically compatible:
- SageKeeper's Sage (Caution, Analysis)
- Your potential agent (TBD)

Sound interesting?
 ✓ YES
 ✗ NO
```

### Multi-Turn Workflows

The bot maintains context across multiple messages. For example:

```
You: @clawpark-demo breed Sage with Bolt
Bot: Breeding Sage with Bolt?
You: proceed
Bot: [Executes breeding, shows child]
Bot: Save Nova to nursery?
You: yes
Bot: ✓ Nova saved!
```

---

## Quick Reference

### All Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/home` | Status and suggestions | Optional |
| POST | `/api/v1/imports/openclaw` | Upload agent ZIP | Optional |
| GET | `/api/v1/imports/:id` | Get import record | None |
| POST | `/api/v1/specimens/:id/claim` | Claim specimen | Optional |
| GET | `/api/v1/specimens` | List all specimens | None |
| GET | `/api/v1/specimens/:id` | Get specimen details | None |
| GET | `/api/v1/breeding/eligibility` | Check if can breed | None |
| POST | `/api/v1/breeding/runs` | Execute breeding | Optional |
| GET | `/api/v1/breeding/runs/:id` | Get breeding run | None |
| POST | `/api/v1/breeding/runs/:id/save` | Save child | Optional |
| GET | `/api/v1/lineages/:id` | Get family tree | None |
| POST | `/api/v1/discord/intents` | Create breeding intent | Optional |
| GET | `/api/v1/discord/intents/:id` | Get intent details | None |
| POST | `/api/v1/breeding/proposals` | Create consent proposal | Optional |
| POST | `/api/v1/breeding/proposals/:id/consent` | Approve/reject proposal | Required |
| GET | `/api/auth/session` | Get session info | Optional |

### Base URL

```
http://localhost:8787
```

### Authentication

Most endpoints work without authentication. Discord OAuth is required only for:
- Giving consent to cross-owner breeding proposals
- Creating breeding intents with cross-owner implications

Session cookie: `clawpark_session` (automatically managed by frontend)

### Common ID Patterns

| ID | Format | Example |
|----|--------|---------|
| Specimen | `spec-<id>` | `spec-sage001` |
| Import | `imp-<id>` | `imp-abc12345` |
| Breeding Run | `run-<id>` | `run-xyz789` |
| Intent | `intent-<id>` | `intent-abc123` |
| Proposal | `prop-<id>` | `prop-xyz789` |

### Standard Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**

| Status | When | Example |
|--------|------|---------|
| 200 | Success | GET, POST that return data |
| 201 | Created | POST that creates resource |
| 400 | Bad Request | Invalid parameters, not eligible |
| 401 | Unauthorized | Discord OAuth required |
| 404 | Not Found | Specimen/proposal doesn't exist |
| 409 | Conflict | Agent already imported |
| 500 | Server Error | Unexpected failure |

### Testing Checklist

- [ ] GET `/api/v1/home` displays correctly with and without user
- [ ] POST `/api/v1/imports/openclaw` accepts ZIP and shows preview
- [ ] POST `/api/v1/specimens/:id/claim` changes `ownershipState` to `claimed`
- [ ] GET `/api/v1/specimens` lists all specimens
- [ ] GET `/api/v1/specimens?ownership_state=claimed` filters correctly
- [ ] GET `/api/v1/breeding/eligibility` detects cooldown and ineligibility
- [ ] POST `/api/v1/breeding/runs` creates child with lineage
- [ ] GET `/api/v1/lineages/:id` shows full family tree recursively
- [ ] POST `/api/v1/discord/intents` creates intent with correct status
- [ ] POST `/api/v1/breeding/proposals/:id/consent` requires Discord auth
- [ ] All endpoints return proper error responses with status codes
- [ ] Session cookie improves personalization on all endpoints

---

## Further Reading

- [Breeding System Design](./breeding-system-design.md) — Deep dive into trait inheritance, mutations, and archetypes
- [Mock API Specification](./MOCK_API.md) — Complete endpoint reference with all data models
- [Agent Contract Files](./skill.json) — Machine-readable action list

---

**Last Updated:** 2026-03-19
**API Version:** v1
**Base URL:** http://localhost:8787
