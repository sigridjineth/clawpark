// @vitest-environment node
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildZipForm, createWorkspaceZip, startScenarioServer, type ScenarioServerHandle } from './scenarioTestUtils.ts';

describe('Scenario 5 — install a marketplace skill bundle', () => {
  let handle: ScenarioServerHandle;

  beforeEach(async () => {
    handle = await startScenarioServer();
  });

  afterEach(async () => {
    await handle.close();
    handle.cleanup();
  });

  it('supports install conflict flow: 200 -> 409 -> 200(overwrite)', async () => {
    const skillZip = createWorkspaceZip({
      'park-audit/SKILL.md': '---\nname: Park Audit\ndescription: Scan the enclosure for failures.\n---\nReview the park and capture evidence.\n',
      'park-audit/scripts/audit.py': 'print("audit v1")\n',
    }, 'park-audit.skill.zip');

    try {
      const ingestForm = await buildZipForm('bundle', skillZip.zipPath, 'park-audit.skill.zip');
      ingestForm.append('publisherLabel', 'Local Moltbot Publisher');
      const ingestResponse = await fetch(`${handle.baseUrl}/api/marketplace/ingest/skill`, {
        method: 'POST',
        body: ingestForm,
      });
      expect(ingestResponse.status).toBe(201);
      const skillListing = (await ingestResponse.json()) as { slug: string; skill: { slug: string } };

      const firstInstall = await fetch(`${handle.baseUrl}/api/marketplace/listings/${skillListing.slug}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: false }),
      });
      expect(firstInstall.status).toBe(200);
      const firstPayload = (await firstInstall.json()) as { installedPath: string; overwritten: boolean };
      expect(firstPayload.overwritten).toBe(false);
      expect(existsSync(join(firstPayload.installedPath, 'SKILL.md'))).toBe(true);

      writeFileSync(join(firstPayload.installedPath, 'scripts/audit.py'), 'print("mutated")\n');

      const conflict = await fetch(`${handle.baseUrl}/api/marketplace/listings/${skillListing.slug}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: false }),
      });
      expect(conflict.status).toBe(409);
      const conflictPayload = (await conflict.json()) as { overwriteRequired: boolean; installedPath: string };
      expect(conflictPayload.overwriteRequired).toBe(true);

      const overwrite = await fetch(`${handle.baseUrl}/api/marketplace/listings/${skillListing.slug}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: true }),
      });
      expect(overwrite.status).toBe(200);
      const overwritePayload = (await overwrite.json()) as { installedPath: string; overwritten: boolean };
      expect(overwritePayload.overwritten).toBe(true);
      expect(readFileSync(join(overwritePayload.installedPath, 'scripts/audit.py'), 'utf8')).toContain('audit v1');
    } finally {
      rmSync(skillZip.dir, { recursive: true, force: true });
    }
  });
});
