// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

async function buildUploadForm(zipPath: string) {
  const form = new FormData();
  const buffer = execFileSync('python3', ['-c', 'import pathlib,sys; sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())', zipPath]);
  form.append('bundle', new File([buffer], 'workspace.zip', { type: 'application/zip' }));
  return form;
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

  it('creates a verified claw draft, publishes it, lists it, and downloads the normalized bundle', async () => {
    const { dir, zipPath } = createWorkspaceZip({
      'IDENTITY.md': '# Meridian\nName: Meridian\nCreature: Compass Parasaurolophus\nRole: The Cartographer\nDirective: Map every boundary in the enclosure.\nVibe: Methodical · Watchful\nEmoji: 🧭\n',
      'SOUL.md': '# Soul\nAnalyze the terrain, document the route, and keep the team safe.\n',
      'TOOLS.md': '# Tools\n- search probe\n- workflow grid\n- radar array\n',
      'skills/mapping/SKILL.md': '---\nname: Mapping\n---\nDesign systems and monitor workflows.',
    });

    try {
      const form = await buildUploadForm(zipPath);
      const draftResponse = await fetch(`${baseUrl}/api/marketplace/drafts`, {
        method: 'POST',
        body: form,
        headers: { Cookie: cookie },
      });
      expect(draftResponse.status).toBe(201);
      const draft = (await draftResponse.json()) as { id: string; title: string };
      expect(draft.title).toBe('Meridian');

      const publishResponse = await fetch(`${baseUrl}/api/marketplace/drafts/${draft.id}/publish`, {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      expect(publishResponse.status).toBe(201);
      const listing = (await publishResponse.json()) as { slug: string; trust: string; kind: string };
      expect(listing.kind).toBe('claw');
      expect(listing.trust).toBe('verified');

      const bundleResponse = await fetch(`${baseUrl}/api/marketplace/listings/${listing.slug}/bundle`);
      expect(bundleResponse.status).toBe(200);
      expect(bundleResponse.headers.get('content-type')).toContain('application/json');
      const bundle = (await bundleResponse.json()) as { kind: string; claw: { name: string } };
      expect(bundle.kind).toBe('claw');
      expect(bundle.claw.name).toBe('Meridian');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts unsigned claw ingest and unsigned skill ingest as immutable public listings', async () => {
    const clawZip = createWorkspaceZip({
      'IDENTITY.md': '# Apex\nName: Apex\nCreature: Rex Imperator\nRole: The Apex Predator\nDirective: Dominate the enclosure.\nEmoji: 👑\n',
      'SOUL.md': '# Soul\nReview every weak assumption and keep the park safe.\n',
    });
    const skillZip = createWorkspaceZip({
      'park-audit/SKILL.md': '---\nname: Park Audit\ndescription: Scan the enclosure for failures.\n---\nReview the park and capture evidence.\n',
      'park-audit/scripts/audit.py': 'print("audit")\n',
    });

    try {
      const clawForm = await buildUploadForm(clawZip.zipPath);
      clawForm.append('publisherLabel', 'Local Moltbot Publisher');
      const clawResponse = await fetch(`${baseUrl}/api/marketplace/ingest/claw`, {
        method: 'POST',
        body: clawForm,
      });
      expect(clawResponse.status).toBe(201);
      const clawListing = (await clawResponse.json()) as { kind: string; trust: string; publisherMode: string; slug: string };
      expect(clawListing.kind).toBe('claw');
      expect(clawListing.trust).toBe('unsigned');
      expect(clawListing.publisherMode).toBe('local-skill');

      const skillForm = await buildUploadForm(skillZip.zipPath);
      skillForm.append('publisherLabel', 'Local Moltbot Publisher');
      const skillResponse = await fetch(`${baseUrl}/api/marketplace/ingest/skill`, {
        method: 'POST',
        body: skillForm,
      });
      expect(skillResponse.status).toBe(201);
      const skillListing = (await skillResponse.json()) as { kind: string; trust: string; bundleDownloadUrl: string; slug: string };
      expect(skillListing.kind).toBe('skill');
      expect(skillListing.trust).toBe('unsigned');

      const listingsResponse = await fetch(`${baseUrl}/api/marketplace/listings`);
      const listings = (await listingsResponse.json()) as Array<{ kind: string }>;
      expect(listings.some((entry) => entry.kind === 'claw')).toBe(true);
      expect(listings.some((entry) => entry.kind === 'skill')).toBe(true);

      const skillBundleResponse = await fetch(`${baseUrl}/api/marketplace/listings/${skillListing.slug}/bundle`);
      expect(skillBundleResponse.status).toBe(200);
      expect(skillBundleResponse.headers.get('content-type')).toContain('application/zip');
      const bytes = new Uint8Array(await skillBundleResponse.arrayBuffer());
      expect(bytes[0]).toBe(80); // PK zip header
      expect(bytes[1]).toBe(75);
    } finally {
      rmSync(clawZip.dir, { recursive: true, force: true });
      rmSync(skillZip.dir, { recursive: true, force: true });
    }
  });
});
