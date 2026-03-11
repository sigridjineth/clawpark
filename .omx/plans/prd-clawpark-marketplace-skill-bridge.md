# PRD — ClawPark Marketplace Skill Bridge

## Goal
Let OpenClaw users publish either a full Claw or a standalone SKILL.md bundle into the shared ClawPark marketplace.

## Product behavior
- Verified Claw publish remains a Discord-authenticated draft flow.
- Local skill integration can publish:
  - a full OpenClaw workspace as an unverified claw listing
  - a standalone skill directory as an unverified skill listing
- Claw listings are claimable in ClawPark.
- Skill listings are downloadable/installable into an OpenClaw skills directory.

## Trust model
- Verified listings come from the managed web flow.
- Local skill publishing is public but marked `Unverified`.
- Unverified listings are create-only and do not overwrite prior listings.

## Acceptance criteria
1. Marketplace browse supports both Claws and Skills.
2. Skill listings show install/download behavior, not gallery claim.
3. Local skill publisher can upload a workspace ZIP to create a claw listing.
4. Local skill publisher can upload a skill ZIP to create a skill listing.
5. Skill bundles download as installable ZIP artifacts.
6. Verified claw publish flow still works unchanged.
