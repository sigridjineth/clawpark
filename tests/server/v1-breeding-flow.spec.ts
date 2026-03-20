// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMarketplaceServer } from '../../server/index.ts';
import { buildSessionCookie } from '../../server/sessions.ts';

function createWorkspaceZip(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'clawpark-v1-'));
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

async function buildImportForm(zipPath: string, filename = 'workspace.zip') {
  const form = new FormData();
  const buffer = execFileSync('python3', ['-c', 'import pathlib,sys; sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())', zipPath]);
  form.append('file', new File([buffer], filename, { type: 'application/zip' }));
  return form;
}

describe('/api/v1 breeding flow', () => {
  let tempRoot: string;
  let serverHandle: ReturnType<typeof createMarketplaceServer>;
  let baseUrl: string;
  let cookieA: string;
  let cookieB: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-v1-server-'));
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

    const userA = serverHandle.store.upsertDiscordUser({ id: 'discord-user-a', username: 'sigrid', global_name: 'Sigrid', avatar: null });
    const userB = serverHandle.store.upsertDiscordUser({ id: 'discord-user-b', username: 'curator', global_name: 'Curator', avatar: null });
    if (!userA || !userB) throw new Error('Failed to create test users');
    cookieA = buildSessionCookie(userA, 'test-secret', false);
    cookieB = buildSessionCookie(userB, 'test-secret', false);
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => serverHandle.server.close(() => resolve()));
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('imports, claims, breeds, saves, and exposes lineage through /api/v1', async () => {
    const ridgebackZip = createWorkspaceZip({
      'IDENTITY.md': '# Ridgeback\nName: Ridgeback\nCreature: Archive Raptor\nRole: The Cartographer\nDirective: Map every boundary in the enclosure.\nVibe: Methodical · Watchful\nEmoji: 🧭\n',
      'SOUL.md': '# Soul\nAnalyze the terrain, document the route, and keep the team safe.\n',
      'TOOLS.md': '# Tools\n- search probe\n- workflow grid\n',
      'skills/mapping/SKILL.md': '---\nname: Mapping\n---\nDesign systems and monitor workflows.\n',
    });
    const orchidZip = createWorkspaceZip({
      'IDENTITY.md': '# Orchid Glass\nName: Orchid Glass\nCreature: Signal Raptor\nRole: The Park Tactician\nDirective: Coordinate the enclosure without dropping the thread.\nVibe: Calm · Exact\nEmoji: 🦖\n',
      'SOUL.md': '# Soul\nCore truths: analyze systems, document decisions, enforce boundaries.\n',
      'TOOLS.md': '# Tools\n- monitor workflow state\n- keep the sandbox safe\n',
      'skills/review/SKILL.md': '---\nname: Review\n---\nReview plans, inspect code, and challenge weak assumptions.\n',
    });

    try {
      const importAResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(ridgebackZip.zipPath, 'ridgeback.zip'),
        headers: { Cookie: cookieA },
      });
      expect(importAResponse.status).toBe(201);
      const importA = (await importAResponse.json()) as { specimenId: string; specimen: { ownershipState: string; claw: { name: string } } };
      expect(importA.specimen.claw.name).toBe('Ridgeback');
      expect(importA.specimen.ownershipState).toBe('imported');

      const importBResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(orchidZip.zipPath, 'orchid.zip'),
        headers: { Cookie: cookieA },
      });
      expect(importBResponse.status).toBe(201);
      const importB = (await importBResponse.json()) as { specimenId: string; specimen: { ownershipState: string; claw: { name: string } } };
      expect(importB.specimen.claw.name).toBe('Orchid Glass');

      const claimAResponse = await fetch(`${baseUrl}/api/v1/specimens/${importA.specimenId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({}),
      });
      expect(claimAResponse.status).toBe(200);
      const claimedA = (await claimAResponse.json()) as { ownershipState: string; discordUserId: string };
      expect(claimedA.ownershipState).toBe('claimed');
      expect(claimedA.discordUserId).toBe('discord-user-a');

      const claimBResponse = await fetch(`${baseUrl}/api/v1/specimens/${importB.specimenId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({}),
      });
      expect(claimBResponse.status).toBe(200);

      const homeResponse = await fetch(`${baseUrl}/api/v1/home`, {
        headers: { Cookie: cookieA },
      });
      expect(homeResponse.status).toBe(200);
      const home = (await homeResponse.json()) as {
        owned_claw_count: number;
        breedable_pairs: number;
        pending_claims: number;
        connected_identity: { discordUserId: string; discordHandle?: string } | null;
      };
      expect(home.owned_claw_count).toBe(2);
      expect(home.breedable_pairs).toBe(1);
      expect(home.pending_claims).toBe(0);
      expect(home.connected_identity?.discordUserId).toBe('discord-user-a');

      const listResponse = await fetch(`${baseUrl}/api/v1/specimens`);
      expect(listResponse.status).toBe(200);
      const listed = (await listResponse.json()) as { specimens: Array<{ id: string }>; total: number };
      expect(listed.total).toBe(2);

      const eligibilityResponse = await fetch(
        `${baseUrl}/api/v1/breeding/eligibility?parentA=${encodeURIComponent(importA.specimenId)}&parentB=${encodeURIComponent(importB.specimenId)}`,
      );
      expect(eligibilityResponse.status).toBe(200);
      const eligibility = (await eligibilityResponse.json()) as { eligible: boolean };
      expect(eligibility.eligible).toBe(true);

      const breedResponse = await fetch(`${baseUrl}/api/v1/breeding/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          parentA: importA.specimenId,
          parentB: importB.specimenId,
          prompt: 'Raise a resilient child who can survive the park.',
        }),
      });
      expect(breedResponse.status).toBe(201);
      const breed = (await breedResponse.json()) as {
        runId: string;
        status: string;
        child: { id: string; parentAId: string; parentBId: string; claw: { name: string } };
        inheritanceMap: unknown[];
      };
      expect(breed.status).toBe('complete');
      expect(breed.child.id).toBeTruthy();
      expect(breed.child.parentAId).toBe(importA.specimenId);
      expect(breed.child.parentBId).toBe(importB.specimenId);
      expect(breed.inheritanceMap.length).toBeGreaterThan(0);

      const runResponse = await fetch(`${baseUrl}/api/v1/breeding/runs/${breed.runId}`);
      expect(runResponse.status).toBe(200);
      const run = (await runResponse.json()) as { result_child_id: string; status: string };
      expect(run.status).toBe('complete');
      expect(run.result_child_id).toBe(breed.child.id);

      const saveResponse = await fetch(`${baseUrl}/api/v1/breeding/runs/${breed.runId}/save`, {
        method: 'POST',
      });
      expect(saveResponse.status).toBe(200);
      const saved = (await saveResponse.json()) as { saved: number; child: { id: string } };
      expect(saved.saved).toBe(1);
      expect(saved.child.id).toBe(breed.child.id);

      const lineageResponse = await fetch(`${baseUrl}/api/v1/lineages/${breed.child.id}`);
      expect(lineageResponse.status).toBe(200);
      const lineage = (await lineageResponse.json()) as {
        specimen: { id: string };
        parentA: { specimen: { id: string } } | null;
        parentB: { specimen: { id: string } } | null;
      };
      expect(lineage.specimen.id).toBe(breed.child.id);
      expect(lineage.parentA?.specimen.id).toBe(importA.specimenId);
      expect(lineage.parentB?.specimen.id).toBe(importB.specimenId);
    } finally {
      rmSync(ridgebackZip.dir, { recursive: true, force: true });
      rmSync(orchidZip.dir, { recursive: true, force: true });
    }
  });

  it('allows repeated imports without specimen-id collisions', async () => {
    const zip = createWorkspaceZip({
      'IDENTITY.md': '# khl7q5\nName: khl7q5\nCreature: Signal Raptor\nRole: The Park Tactician\nDirective: Coordinate the enclosure without dropping the thread.\nVibe: Calm · Exact\nEmoji: 🦖\n',
      'SOUL.md': '# Soul\nCore truths: analyze systems, document decisions, enforce boundaries.\n',
    });

    try {
      const firstResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(zip.zipPath, 'khl7q5.zip'),
        headers: { Cookie: cookieA },
      });
      expect(firstResponse.status).toBe(201);
      const first = (await firstResponse.json()) as { specimenId: string; specimen: { id: string; claw: { id: string } } };

      const secondResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(zip.zipPath, 'khl7q5-again.zip'),
        headers: { Cookie: cookieA },
      });
      expect(secondResponse.status).toBe(201);
      const second = (await secondResponse.json()) as { specimenId: string; specimen: { id: string; claw: { id: string } } };

      expect(first.specimenId).not.toBe(second.specimenId);
      expect(first.specimen.id).not.toBe(second.specimen.id);
      expect(first.specimen.claw.id).not.toBe(second.specimen.claw.id);
    } finally {
      rmSync(zip.dir, { recursive: true, force: true });
    }
  });

  it('creates breeding intents/proposals and accepts cross-owner consent through /api/v1', async () => {
    const parentAZip = createWorkspaceZip({
      'IDENTITY.md': '# Meridian\nName: Meridian\nCreature: Compass Parasaurolophus\nRole: The Cartographer\nDirective: Map every boundary in the enclosure.\nVibe: Methodical · Watchful\nEmoji: 🧭\n',
      'SOUL.md': '# Soul\nAnalyze the terrain and document the route.\n',
    });
    const parentBZip = createWorkspaceZip({
      'IDENTITY.md': '# Solstice Sentinel\nName: Solstice Sentinel\nCreature: Archive Raptor\nRole: The Curator\nDirective: Guard the hatchery archive.\nVibe: Precise · Reserved\nEmoji: ✨\n',
      'SOUL.md': '# Soul\nPreserve evidence and verify every change.\n',
    });

    try {
      const importAResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(parentAZip.zipPath, 'meridian.zip'),
        headers: { Cookie: cookieA },
      });
      const importA = (await importAResponse.json()) as { specimenId: string };

      const importBResponse = await fetch(`${baseUrl}/api/v1/imports/openclaw`, {
        method: 'POST',
        body: await buildImportForm(parentBZip.zipPath, 'solstice.zip'),
        headers: { Cookie: cookieB },
      });
      const importB = (await importBResponse.json()) as { specimenId: string };

      await fetch(`${baseUrl}/api/v1/specimens/${importA.specimenId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({}),
      });
      await fetch(`${baseUrl}/api/v1/specimens/${importB.specimenId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({}),
      });

      const intentResponse = await fetch(`${baseUrl}/api/v1/discord/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_message: 'breed Meridian with Solstice Sentinel',
          requester_identity: 'discord-user-a',
          target_specimen_ids: [importA.specimenId, importB.specimenId],
          source_surface: 'web_ui',
        }),
      });
      expect(intentResponse.status).toBe(201);
      const intent = (await intentResponse.json()) as { id: string };

      const fetchIntentResponse = await fetch(`${baseUrl}/api/v1/discord/intents/${intent.id}`);
      expect(fetchIntentResponse.status).toBe(200);

      const proposalResponse = await fetch(`${baseUrl}/api/v1/breeding/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          parentAId: importA.specimenId,
          parentBId: importB.specimenId,
          intentId: intent.id,
        }),
      });
      expect(proposalResponse.status).toBe(201);
      const proposal = (await proposalResponse.json()) as { id: string; consent_status: string };
      expect(proposal.consent_status).toBe('pending');
      const consentRow = serverHandle.db.prepare(
        'SELECT expires_at FROM breeding_consents WHERE proposal_id = ?',
      ).get(proposal.id) as { expires_at: string } | undefined;
      expect(consentRow).toBeTruthy();
      const expiresAt = new Date(consentRow!.expires_at).getTime();
      const now = Date.now();
      const hoursUntilExpiry = (expiresAt - now) / (60 * 60 * 1000);
      expect(hoursUntilExpiry).toBeGreaterThan(23);
      expect(hoursUntilExpiry).toBeLessThan(25);

      const consentResponse = await fetch(`${baseUrl}/api/v1/breeding/proposals/${proposal.id}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({ status: 'approved' }),
      });
      expect(consentResponse.status).toBe(200);
      const updated = (await consentResponse.json()) as { consent_status: string };
      expect(updated.consent_status).toBe('approved');
    } finally {
      rmSync(parentAZip.dir, { recursive: true, force: true });
      rmSync(parentBZip.dir, { recursive: true, force: true });
    }
  });
});
