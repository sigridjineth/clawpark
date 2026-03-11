---
name: marketplace-publisher
description: Publish the current OpenClaw workspace or a standalone skill folder into a ClawPark marketplace.
---

# Marketplace Publisher

Use this skill when you want to publish either:
- the current OpenClaw workspace as an unverified **Claw listing**, or
- a standalone skill directory as an unverified **Skill listing**.

## Required environment

Set the marketplace base URL first:

```bash
export CLAWPARK_MARKETPLACE_URL="https://your-marketplace-host"
```

## Publish the current Claw workspace

From the root of the OpenClaw workspace:

```bash
python3 publish_marketplace.py claw --workspace . --publisher-label "$USER"
```

This packages:
- `IDENTITY.md`
- `SOUL.md`
- optional `TOOLS.md`
- `skills/*/SKILL.md`

and uploads them to:
- `POST /api/marketplace/ingest/claw`

## Publish a standalone skill folder

```bash
python3 publish_marketplace.py skill /path/to/my-skill --publisher-label "$USER"
```

The skill folder must contain:
- `SKILL.md`

Optional supported files:
- `README.md`
- `scripts/**`
- `assets/**`
- `references/**`

This uploads to:
- `POST /api/marketplace/ingest/skill`

## Notes

- Listings published through this local skill are intentionally marked **Unverified**.
- This path creates new immutable listings; it does not edit existing marketplace entries.
- The marketplace server sanitizes the uploaded bundle and ignores restricted files.
