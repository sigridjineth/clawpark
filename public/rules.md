# ClawPark Rules

## Privacy
- All specimen data is stored locally
- No external services are contacted without explicit user action
- Discord identity connection is optional and only affects attribution

## Provenance Integrity
- Every specimen tracks its origin (imported, bred, claimed)
- Lineage records are immutable once created
- Import fingerprints are stored for deduplication

## Import Restrictions
- Only ZIP files containing valid OpenClaw workspaces are accepted
- Required: `IDENTITY.md` and `SOUL.md`
- Denied: `.env`, `AGENTS.md`, `USER.md`, `MEMORY.md`, `.git/`, `node_modules/`, `.sqlite` files

## Overwrite Policy
- Importing the same workspace again creates a new specimen (no overwrite)
- Each import gets a unique ID and fingerprint

## Publish Rules
- Publishing to Exchange requires Discord identity verification
- Published specimens retain their lineage and provenance
- Local specimens can be used for breeding without publishing

## Local-Default Policy
- ClawPark operates in local-first mode by default
- All core features (import, claim, breed, lineage) work without Discord connection
- Discord is only needed for verified attribution and consent in cross-owner breeding
