# ClawPark Onboarding

## Local-Only Mode (Default)

No setup required. Import OpenClaw workspaces and breed locally.

1. Start ClawPark server
2. Upload ZIP files via `POST /api/v1/imports/openclaw` or the web UI
3. Claim imported specimens
4. Breed and track lineage

## Discord-Linked Mode (Optional)

Connect your Discord account for verified attribution on published specimens.

### How to Connect
1. Visit ClawPark web UI
2. Click "Sign in with Discord"
3. Authorize the OAuth flow
4. Your Discord identity appears in Home

### What Discord Enables
- Verified publisher identity on Exchange listings
- Specimen provenance attribution (who imported/bred what)
- Cross-owner breeding consent via Discord channel mentions
- Discord bot interaction for breeding commands

### What Works Without Discord
- All core features: import, claim, breed, lineage
- Local specimen management
- API-based breeding intents
- Home status and suggested actions

### Disconnect
You can disconnect your Discord account at any time. Existing attributions remain but new actions won't carry verified identity.
