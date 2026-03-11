// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMarketplaceServer } from '../../server/index.ts';
import { buildSessionCookie } from '../../server/sessions.ts';

function createWorkspaceZip(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'clawpark-api-'));
  const zipPath = join(dir, 'workspace.zip');
  const payload = JSON.stringify(files);
  execFileSync('python3', ['-c', `
import json, pathlib, sys, zipfile
base = pathlib.Path(sys.argv[1])
zip_path = pathlib.Path(sys.argv[2])
files = json.loads(sys.argv[3])
for name, content in files.items():
    path = base / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')
with zipfile.ZipFile(zip_path, 'w') as zf:
    for name in files.keys():
        zf.write(base / name, arcname=name)
`, dir, zipPath, payload]);
  return { dir, zipPath };
}

describe('marketplace API', () => {
  let tempRoot: string;
  let serverHandle: ReturnType<typeof createMarketplaceServer>;
  let baseUrl: string;
  let cookie: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-marketplace-'));
    serverHandle = createMarketplaceServer({
      publicOrigin: 'http://127.0.0.1:8787',
      clientOrigin: 'http://127.0.0.1:5173',
      sqlitePath: join(tempRoot, 'marketplace.sqlite'),
      storageDir: join(tempRoot, 'storage'),
      sessionSecret: 'test-secret',
      serveDist: false,
    });
    await new Promise<void>((resolve) => serverHandle.server.listen(0, '127.0.0.1', resolve));
    const address = serverHandle.server.address();
    if (!address || typeof address === 'string') throw new Error('Unexpected server address');
    baseUrl = `http://127.0.0.1:${address.port}`;
    const user = serverHandle.store.upsertDiscordUser({ id: 'discord-user-1', username: 'sigrid', global_name: 'Sigrid', avatar: null });
    if (!user) throw new Error('Failed to create test user');
    cookie = buildSessionCookie(user, 'test-secret', false);
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => serverHandle.server.close(() => resolve()));
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('creates a draft, publishes it, lists it, and downloads a normalized bundle', async () => {
    const { dir, zipPath } = createWorkspaceZip({
      'IDENTITY.md': '# Meridian\nName: Meridian\nCreature: Compass Parasaurolophus\nRole: The Cartographer\nDirective: Map every boundary in the enclosure.\nVibe: Methodical · Watchful\nEmoji: 🧭\n',
      'SOUL.md': '# Soul\nAnalyze the terrain, document the route, and keep the team safe.\n',
      'TOOLS.md': '# Tools\n- search probe\n- workflow grid\n- radar array\n',
      'skills/mapping/SKILL.md': '---\nname: Mapping\n---\nDesign systems and monitor workflows.',
    });

    try {
      const form = new FormData();
      const buffer = execFileSync('python3', ['-c', 'import pathlib,sys; sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())', zipPath]);
      form.append('bundle', new File([buffer], 'workspace.zip', { type: 'application/zip' }));

      const draftResponse = await fetch(`${baseUrl}/api/marketplace/drafts`, {
        method: 'POST',
        body: form,
        headers: { Cookie: cookie },
      });
      expect(draftResponse.status).toBe(201);
      const draft = await draftResponse.json() as { id: string; title: string };
      expect(draft.title).toBe('Meridian');

      const patchResponse = await fetch(`${baseUrl}/api/marketplace/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: 'Maps safe routes for the park.', toolsVisibility: 'summary' }),
      });
      expect(patchResponse.status).toBe(200);

      const publishResponse = await fetch(`${baseUrl}/api/marketplace/drafts/${draft.id}/publish`, {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      expect(publishResponse.status).toBe(201);
      const listing = await publishResponse.json() as { slug: string; title: string };
      expect(listing.title).toBe('Meridian');

      const listingsResponse = await fetch(`${baseUrl}/api/marketplace/listings`);
      expect(listingsResponse.status).toBe(200);
      const listings = await listingsResponse.json() as Array<{ slug: string }>;
      expect(listings.some((entry) => entry.slug === listing.slug)).toBe(true);

      const bundleResponse = await fetch(`${baseUrl}/api/marketplace/listings/${listing.slug}/bundle`);
      expect(bundleResponse.status).toBe(200);
      const bundle = await bundleResponse.json() as { claw: { name: string }; manifest: { source: string } };
      expect(bundle.claw.name).toBe('Meridian');
      expect(bundle.manifest.source).toBe('openclaw-workspace-zip');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
