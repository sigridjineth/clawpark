// @vitest-environment node
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildZipForm, createWorkspaceZip, startScenarioServer, type ScenarioServerHandle } from './scenarioTestUtils.ts';

describe('Scenario 3 — verified marketplace draft', () => {
  let handle: ScenarioServerHandle;

  beforeEach(async () => {
    handle = await startScenarioServer();
  });

  afterEach(async () => {
    await handle.close();
    handle.cleanup();
  });

  it('supports auth session check, draft create/update/publish, and listing browse/download', async () => {
    const sessionResponse = await fetch(`${handle.baseUrl}/api/auth/session`);
    expect(sessionResponse.status).toBe(200);
    const session = (await sessionResponse.json()) as { user: unknown | null; authConfigured: boolean };
    expect(session.user).toBeNull();
    expect(typeof session.authConfigured).toBe('boolean');

    const oauthStart = await fetch(`${handle.baseUrl}/api/auth/discord/start`, { redirect: 'manual' });
    expect([302, 503]).toContain(oauthStart.status);

    const workspace = createWorkspaceZip({
      'IDENTITY.md': '# Meridian\nName: Meridian\nCreature: Compass Parasaurolophus\nRole: The Cartographer\nDirective: Map every boundary in the enclosure.\nVibe: Methodical · Watchful\nEmoji: 🧭\n',
      'SOUL.md': '# Soul\nAnalyze the terrain and document the route.\n',
      'TOOLS.md': '# Tools\n- search probe\n- workflow grid\n',
      'skills/mapping/SKILL.md': '---\nname: Mapping\n---\nCreate route maps and keep orientation stable.\n',
    });

    try {
      const draftForm = await buildZipForm('bundle', workspace.zipPath);
      const createDraftResponse = await fetch(`${handle.baseUrl}/api/marketplace/drafts`, {
        method: 'POST',
        headers: { Cookie: handle.authCookie },
        body: draftForm,
      });
      expect(createDraftResponse.status).toBe(201);
      const draft = (await createDraftResponse.json()) as { id: string; title: string; summary: string };
      expect(draft.title).toBe('Meridian');

      const patchResponse = await fetch(`${handle.baseUrl}/api/marketplace/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: {
          Cookie: handle.authCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Meridian Revised',
          summary: 'Map every boundary with better sightlines.',
          toolsVisibility: 'full',
          coverStyle: 'avatar',
        }),
      });
      expect(patchResponse.status).toBe(200);
      const patched = (await patchResponse.json()) as { title: string; summary: string };
      expect(patched.title).toBe('Meridian Revised');

      const publishResponse = await fetch(`${handle.baseUrl}/api/marketplace/drafts/${draft.id}/publish`, {
        method: 'POST',
        headers: { Cookie: handle.authCookie },
      });
      expect(publishResponse.status).toBe(201);
      const listing = (await publishResponse.json()) as { slug: string; kind: string; trust: string };
      expect(listing.kind).toBe('claw');
      expect(listing.trust).toBe('verified');

      const listingsResponse = await fetch(`${handle.baseUrl}/api/marketplace/listings`);
      expect(listingsResponse.status).toBe(200);
      const listings = (await listingsResponse.json()) as Array<{ slug: string }>;
      expect(listings.some((entry) => entry.slug === listing.slug)).toBe(true);

      const listingDetailResponse = await fetch(`${handle.baseUrl}/api/marketplace/listings/${listing.slug}`);
      expect(listingDetailResponse.status).toBe(200);

      const bundleResponse = await fetch(`${handle.baseUrl}/api/marketplace/listings/${listing.slug}/bundle`);
      expect(bundleResponse.status).toBe(200);
      expect(bundleResponse.headers.get('content-type')).toContain('application/json');
    } finally {
      rmSync(workspace.dir, { recursive: true, force: true });
    }
  });
});
