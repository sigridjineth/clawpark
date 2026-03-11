# PRD — ClawPark SQLite Marketplace Upload

## Goal
Let a real OpenClaw user publish a Claw from a workspace ZIP into the ClawPark marketplace and let other users preview, download, and claim that specimen.

## Product behavior
- Publisher signs in with Discord.
- Publisher uploads an OpenClaw workspace ZIP.
- Server extracts only public, allowlisted workspace files.
- Server creates a draft preview as a normalized `Claw`.
- Publisher edits title/summary and explicitly publishes.
- Marketplace exposes a public listing with bundle download and claim-in-app actions.

## Required source files
- `IDENTITY.md`
- `SOUL.md`
- optional `TOOLS.md`
- optional `skills/*/SKILL.md`

## Required safeguards
- Never publish raw uploads directly.
- Reject or ignore restricted files like `AGENTS.md`, `USER.md`, `.env*`, logs, memory artifacts, and path traversal entries.
- Public downloads must be sanitized normalized bundles only.

## Acceptance criteria
1. Marketplace data is persisted in SQLite.
2. Publishing requires Discord-authenticated user identity.
3. ZIP upload produces a draft preview or a clear parser error.
4. Draft can be updated and then published.
5. Published listing appears in browse results.
6. Listing bundle can be downloaded as normalized JSON.
7. Listing can be claimed/imported into the ClawPark gallery.
8. Existing breed, lineage, and gallery flows continue to work.
