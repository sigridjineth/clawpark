# Local OpenClaw marketplace example bundles

These checked-in fixture directories provide three sanitized, template-inspired examples for the marketplace bundle flows:

1. `meridian-claw/` — workspace-style Claw example
2. `park-audit-skill/` — standalone skill example
3. `containment-launch-skill/` — standalone skill example with both script and asset files

Use them by zipping the contents of a directory and uploading that ZIP through the relevant ClawPark marketplace flow.

Notes:
- The content is intentionally public-safe and synthetic.
- The layouts mirror the parser contract in `server/openclawParser.ts`.
- These fixtures exist so tests and docs can point at real checked-in examples instead of inline-only seed metadata.
