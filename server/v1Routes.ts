import { createHash, randomUUID } from 'node:crypto';
import { rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { MarketplaceServerConfig } from './config.ts';
import type { SpecimenStore } from './specimenStore.ts';
import { readMultipartForm, sendJson, sendError, readJson } from './http.ts';
import { buildHomePayload } from './homePayload.ts';
import { parseOpenClawWorkspaceZip } from './openclawParser.ts';
import { readSessionUserId } from './sessions.ts';
import { breed } from '../src/engine/breed.ts';

function extractParam(pathname: string, pattern: string): string | null {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return null;
  }
  const paramIndex = patternParts.findIndex(p => p.startsWith(':'));
  return paramIndex >= 0 ? pathParts[paramIndex] : null;
}

function matchRoute(pathname: string, method: string, targetPath: string, targetMethod: string): string | boolean {
  if (method !== targetMethod) return false;
  if (!targetPath.includes(':')) return pathname === targetPath;
  const param = extractParam(pathname, targetPath);
  return param || false;
}

export function registerV1Routes(
  handler: (req: IncomingMessage, res: ServerResponse, url: URL) => Promise<boolean>,
  config: MarketplaceServerConfig,
  store: SpecimenStore,
) {
  return async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> => {
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const method = req.method ?? 'GET';

    // GET /api/v1/home
    if (pathname === '/api/v1/home' && method === 'GET') {
      const userId = readSessionUserId(req.headers.cookie, config.sessionSecret);
      const payload = buildHomePayload(store, userId ?? undefined);
      sendJson(res, 200, payload);
      return true;
    }

    // POST /api/v1/imports/openclaw
    if (pathname === '/api/v1/imports/openclaw' && method === 'POST') {
      try {
        const formData = await readMultipartForm(req, url, config.maxUploadBytes);
        const file = formData.get('file') as File | null;
        if (!file) {
          sendError(res, 400, 'Missing file field in multipart form.');
          return true;
        }

        const bodyFields = formData.get('discord_user_id') as string | null;
        const discordUserId = bodyFields || readSessionUserId(req.headers.cookie, config.sessionSecret) || undefined;

        const tempDir = join(tmpdir(), `clawpark-import-${randomUUID().slice(0, 8)}`);
        await mkdir(tempDir, { recursive: true });
        const tempPath = join(tempDir, file.name || 'upload.zip');
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(tempPath, buffer);

        const fingerprint = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
        const { claw, manifest } = await parseOpenClawWorkspaceZip(tempPath);

        const result = store.importSpecimen(claw, manifest, fingerprint, discordUserId);

        await rm(tempDir, { recursive: true, force: true }).catch(() => {});

        sendJson(res, 201, {
          importId: result.importId,
          specimenId: result.specimenId,
          specimen: result.specimen,
          importRecord: result.importRecord,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Import failed';
        sendError(res, 400, message);
      }
      return true;
    }

    // GET /api/v1/imports/:id
    const importId = matchRoute(pathname, method, '/api/v1/imports/:id', 'GET');
    if (importId && typeof importId === 'string') {
      const record = store.getImportRecord(importId);
      if (!record) { sendError(res, 404, 'Import record not found.'); return true; }
      sendJson(res, 200, record);
      return true;
    }

    // POST /api/v1/specimens/:id/claim
    const claimId = extractParam(pathname, '/api/v1/specimens/:id/claim');
    if (claimId && method === 'POST') {
      const body = await readJson<{ discord_user_id?: string }>(req).catch(() => ({}));
      const discordUserId = (body as { discord_user_id?: string }).discord_user_id
        || readSessionUserId(req.headers.cookie, config.sessionSecret)
        || undefined;
      const result = store.claimSpecimen(claimId, discordUserId);
      if (!result) { sendError(res, 404, 'Specimen not found.'); return true; }
      if ('error' in result) { sendError(res, 400, (result as { error: string }).error); return true; }
      sendJson(res, 200, result.specimen);
      return true;
    }

    // GET /api/v1/specimens
    if (pathname === '/api/v1/specimens' && method === 'GET') {
      const ownershipState = url.searchParams.get('ownership_state') ?? undefined;
      const discordUserId = url.searchParams.get('discord_user_id') ?? undefined;
      const specimens = store.listSpecimens({ ownershipState, discordUserId });
      sendJson(res, 200, { specimens, total: specimens.length });
      return true;
    }

    // GET /api/v1/specimens/:id
    const specId = matchRoute(pathname, method, '/api/v1/specimens/:id', 'GET');
    if (specId && typeof specId === 'string' && pathname.startsWith('/api/v1/specimens/') && !pathname.includes('/claim') && !pathname.includes('/lineages')) {
      const specimen = store.getSpecimen(specId);
      if (!specimen) { sendError(res, 404, 'Specimen not found.'); return true; }
      sendJson(res, 200, specimen);
      return true;
    }

    // GET /api/v1/lineages/:id
    const lineageId = matchRoute(pathname, method, '/api/v1/lineages/:id', 'GET');
    if (lineageId && typeof lineageId === 'string') {
      const lineage = store.getLineage(lineageId);
      if (!lineage) { sendError(res, 404, 'Specimen not found.'); return true; }
      sendJson(res, 200, lineage);
      return true;
    }

    // GET /api/v1/breeding/eligibility
    if (pathname === '/api/v1/breeding/eligibility' && method === 'GET') {
      const parentA = url.searchParams.get('parentA');
      const parentB = url.searchParams.get('parentB');
      if (!parentA || !parentB) { sendError(res, 400, 'parentA and parentB query params required.'); return true; }
      const result = store.checkEligibility(parentA, parentB);
      sendJson(res, 200, result);
      return true;
    }

    // POST /api/v1/breeding/runs
    if (pathname === '/api/v1/breeding/runs' && method === 'POST') {
      try {
        const body = await readJson<{ parentA: string; parentB: string; prompt?: string }>(req);
        const { parentA: parentAId, parentB: parentBId, prompt } = body;
        if (!parentAId || !parentBId) { sendError(res, 400, 'parentA and parentB required.'); return true; }

        const eligibility = store.checkEligibility(parentAId, parentBId);
        if (!eligibility.eligible) { sendError(res, 400, eligibility.reason ?? 'Not eligible'); return true; }

        const parentA = store.getSpecimen(parentAId);
        const parentB = store.getSpecimen(parentBId);
        if (!parentA || !parentB) { sendError(res, 400, 'Specimens not found.'); return true; }

        const run = store.createBreedingRun(parentAId, parentBId, prompt);

        const breedResult = breed({
          parentA: parentA.claw,
          parentB: parentB.claw,
          breedPrompt: prompt,
          seed: Date.now(),
        });

        const discordUserId = readSessionUserId(req.headers.cookie, config.sessionSecret) || undefined;
        const completed = store.completeBreedingRun(run.id, breedResult.child, discordUserId);

        sendJson(res, 201, {
          runId: run.id,
          status: 'complete',
          child: completed?.child,
          inheritanceMap: breedResult.inheritanceMap,
          mutationOccurred: breedResult.mutationOccurred,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Breeding failed';
        sendError(res, 500, message);
      }
      return true;
    }

    // GET /api/v1/breeding/runs/:id
    const runId = matchRoute(pathname, method, '/api/v1/breeding/runs/:id', 'GET');
    if (runId && typeof runId === 'string' && !pathname.includes('/save')) {
      const run = store.getBreedingRun(runId);
      if (!run) { sendError(res, 404, 'Breeding run not found.'); return true; }
      sendJson(res, 200, run);
      return true;
    }

    // POST /api/v1/breeding/runs/:id/save
    const saveRunId = extractParam(pathname, '/api/v1/breeding/runs/:id/save');
    if (saveRunId && method === 'POST') {
      const saved = store.saveBreedingRun(saveRunId);
      if (!saved) { sendError(res, 404, 'Breeding run not found.'); return true; }
      sendJson(res, 200, saved);
      return true;
    }

    // POST /api/v1/discord/intents
    if (pathname === '/api/v1/discord/intents' && method === 'POST') {
      const body = await readJson<{ source_message?: string; requester_identity?: string; target_specimen_ids?: string[]; source_surface?: string }>(req);
      if (!body.source_message) { sendError(res, 400, 'source_message required.'); return true; }
      const intent = store.createBreedingIntent({
        sourceSurface: body.source_surface ?? 'web_ui',
        sourceMessage: body.source_message,
        requesterIdentity: body.requester_identity ?? 'anonymous',
        targetSpecimenIds: body.target_specimen_ids ?? [],
      });
      sendJson(res, 201, intent);
      return true;
    }

    // GET /api/v1/discord/intents/:id
    const intentId = matchRoute(pathname, method, '/api/v1/discord/intents/:id', 'GET');
    if (intentId && typeof intentId === 'string') {
      const intent = store.getBreedingIntent(intentId);
      if (!intent) { sendError(res, 404, 'Intent not found.'); return true; }
      sendJson(res, 200, intent);
      return true;
    }

    // POST /api/v1/breeding/proposals
    if (pathname === '/api/v1/breeding/proposals' && method === 'POST') {
      const body = await readJson<{ parentAId: string; parentBId: string; requesterId?: string; intentId?: string }>(req);
      if (!body.parentAId || !body.parentBId) { sendError(res, 400, 'parentAId and parentBId required.'); return true; }
      const discordUserId = readSessionUserId(req.headers.cookie, config.sessionSecret) ?? undefined;
      const proposal = store.createBreedingProposal({
        parentAId: body.parentAId,
        parentBId: body.parentBId,
        requesterId: body.requesterId ?? discordUserId ?? 'anonymous',
        intentId: body.intentId,
      });
      sendJson(res, 201, proposal);
      return true;
    }

    // POST /api/v1/breeding/proposals/:id/consent
    const consentProposalId = extractParam(pathname, '/api/v1/breeding/proposals/:id/consent');
    if (consentProposalId && method === 'POST') {
      const userId = readSessionUserId(req.headers.cookie, config.sessionSecret);
      if (!userId) { sendError(res, 401, 'Discord OAuth required to give consent.'); return true; }
      const body = await readJson<{ status?: string }>(req);
      if (!body.status || !['approved', 'rejected'].includes(body.status)) {
        sendError(res, 400, 'status must be approved or rejected.');
        return true;
      }
      const updated = store.updateProposalConsent(consentProposalId, body.status);
      if (!updated) { sendError(res, 404, 'Proposal not found.'); return true; }
      sendJson(res, 200, updated);
      return true;
    }

    return false;
  };
}
