// @vitest-environment node
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildZipForm, createWorkspaceZip, startScenarioServer, type ScenarioServerHandle } from './scenarioTestUtils.ts';

describe('Scenario 4 — unsigned ingest', () => {
  let handle: ScenarioServerHandle;

  beforeEach(async () => {
    handle = await startScenarioServer();
  });

  afterEach(async () => {
    await handle.close();
    handle.cleanup();
  });

  it('ingests unsigned claw and skill bundles and exposes immutable public listings', async () => {
    const clawZip = createWorkspaceZip({
      'IDENTITY.md': '# Apex\nName: Apex\nCreature: Rex Imperator\nRole: The Apex Predator\nDirective: Dominate the enclosure.\nEmoji: 👑\n',
      'SOUL.md': '# Soul\nReview every weak assumption and protect hatchlings.\n',
    });
    const skillZip = createWorkspaceZip({
      'park-audit/SKILL.md': '---\nname: Park Audit\ndescription: Scan the enclosure for failures.\n---\nReview the park and capture evidence.\n',
      'park-audit/scripts/audit.py': 'print("audit")\n',
    }, 'park-audit.skill.zip');

    try {
      const clawForm = await buildZipForm('bundle', clawZip.zipPath, 'workspace.zip');
      clawForm.append('publisherLabel', 'Local Moltbot Publisher');
      const clawResponse = await fetch(`${handle.baseUrl}/api/marketplace/ingest/claw`, {
        method: 'POST',
        body: clawForm,
      });
      expect(clawResponse.status).toBe(201);
      const clawListing = (await clawResponse.json()) as { slug: string; kind: string; trust: string };
      expect(clawListing.kind).toBe('claw');
      expect(clawListing.trust).toBe('unsigned');

      const skillForm = await buildZipForm('bundle', skillZip.zipPath, 'park-audit.skill.zip');
      skillForm.append('publisherLabel', 'Local Moltbot Publisher');
      const skillResponse = await fetch(`${handle.baseUrl}/api/marketplace/ingest/skill`, {
        method: 'POST',
        body: skillForm,
      });
      expect(skillResponse.status).toBe(201);
      const skillListing = (await skillResponse.json()) as { slug: string; kind: string; trust: string };
      expect(skillListing.kind).toBe('skill');
      expect(skillListing.trust).toBe('unsigned');

      const listingsResponse = await fetch(`${handle.baseUrl}/api/marketplace/listings`);
      expect(listingsResponse.status).toBe(200);
      const listings = (await listingsResponse.json()) as Array<{ slug: string }>;
      expect(listings.some((entry) => entry.slug === clawListing.slug)).toBe(true);
      expect(listings.some((entry) => entry.slug === skillListing.slug)).toBe(true);
    } finally {
      rmSync(clawZip.dir, { recursive: true, force: true });
      rmSync(skillZip.dir, { recursive: true, force: true });
    }
  });
});
