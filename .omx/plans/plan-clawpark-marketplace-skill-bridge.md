# Plan — ClawPark Marketplace Skill Bridge

## Objective
Extend the SQLite marketplace so it can publish both full Claws and standalone skill bundles, including a Moltbot-style local skill publisher for direct upload.

## Execution
1. Add dual marketplace listing kinds: `claw` and `skill`.
2. Add listing trust and publisher mode metadata.
3. Keep verified claw publishing through Discord-authenticated draft flow.
4. Add unsigned ingest endpoints for local skill-based publishing.
5. Parse standalone skill ZIP uploads rooted at `SKILL.md`.
6. Preserve skill bundle structure as downloadable installable ZIP artifacts.
7. Add an installable OpenClaw local skill that packages and uploads either a workspace or skill folder.
8. Split marketplace browse into Claws and Skills tabs.
9. Surface unverified badges and install instructions for skill listings.
10. Add parser/API/UI contract coverage and keep build/test/lint green.
