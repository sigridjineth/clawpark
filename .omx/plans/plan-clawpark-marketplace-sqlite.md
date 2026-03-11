# Plan — ClawPark SQLite Marketplace Upload

## Objective
Ship a real marketplace publishing flow where a user can upload an OpenClaw workspace ZIP, review a sanitized draft, and publish a public listing backed by SQLite.

## Execution
1. Add a Node marketplace server with SQLite persistence and file-backed bundle storage.
2. Add Discord OAuth session support for publishers.
3. Accept ZIP uploads containing `IDENTITY.md`, `SOUL.md`, optional `TOOLS.md`, and `skills/*/SKILL.md`.
4. Parse the upload into a normalized `Claw` plus a public bundle manifest.
5. Reject restricted files (`AGENTS.md`, `USER.md`, `.env*`, memory/log artifacts).
6. Store marketplace drafts, listings, listing versions, and publishers in SQLite.
7. Add draft review controls for title, summary, tools visibility, and cover style.
8. Replace the static marketplace UI with API-backed browse + publish flows while keeping local seed fallback.
9. Support bundle download and in-app claim/import from published listings.
10. Add parser, API, and UI contract coverage; keep typecheck, lint, tests, and build green.
