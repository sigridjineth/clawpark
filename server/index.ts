import { randomBytes, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { createDatabase } from './db.ts';
import { loadConfig, isDiscordAuthConfigured, type MarketplaceServerConfig } from './config.ts';
import { createDiscordAuthUrl, exchangeDiscordCode, fetchDiscordUser } from './discord.ts';
import { methodNotAllowed, notFound, readJson, readMultipartForm, redirect, sendError, sendJson } from './http.ts';
import { createMarketplaceStore } from './marketplaceStore.ts';
import { buildApiDocsHtml, buildOpenApiSpec } from './openapi.ts';
import { createMockCommerceStore, MockCommerceError } from './mockCommerceStore.ts';
import { parseOpenClawSkillZip, parseOpenClawWorkspaceZip } from './openclawParser.ts';
import { formatSkillInstallHint, installMarketplaceSkillBundle, SkillInstallConflictError } from './skillInstaller.ts';
import {
  buildOauthStateCookie,
  buildSessionCookie,
  clearOauthStateCookie,
  clearSessionCookie,
  readOauthState,
  readSessionUserId,
} from './sessions.ts';
import { createSpecimenStore } from './specimenStore.ts';
import { registerV1Routes } from './v1Routes.ts';
import { startDiscordBot } from './discord-bot.ts';
import { breed } from '../src/engine/breed.ts';
import type { ClawBundle } from '../src/types/marketplace.ts';

function isSecureCookie(config: MarketplaceServerConfig) {
  return new URL(config.publicOrigin).protocol === 'https:';
}

function cleanPathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

async function saveUploadedFile(file: File, dir: string) {
  await mkdir(dir, { recursive: true });
  const tempPath = join(dir, `${randomUUID()}-${file.name || 'bundle.zip'}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(tempPath, buffer);
  return tempPath;
}

async function serveStaticFile(config: MarketplaceServerConfig, pathname: string, res: ServerResponse) {
  if (!config.serveDist || !existsSync(config.distDir)) {
    notFound(res);
    return;
  }

  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const normalized = normalize(relativePath).replace(/^([.][.][/\\])+/, '');
  const filePath = resolve(config.distDir, `.${normalized}`);

  try {
    await access(filePath);
    const ext = extname(filePath);
    const contentType =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.js'
          ? 'application/javascript; charset=utf-8'
          : ext === '.css'
            ? 'text/css; charset=utf-8'
            : ext === '.json'
              ? 'application/json; charset=utf-8'
              : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(res);
  } catch {
    try {
      const indexHtml = await readFile(join(config.distDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(indexHtml);
    } catch {
      notFound(res);
    }
  }
}

async function requireUser(req: IncomingMessage, res: ServerResponse, config: MarketplaceServerConfig, store: ReturnType<typeof createMarketplaceStore>) {
  const userId = readSessionUserId(req.headers.cookie, config.sessionSecret);
  if (!userId) {
    sendError(res, 401, 'Sign in with Discord first.');
    return null;
  }

  const user = store.getUserById(userId);
  if (!user) {
    sendError(res, 401, 'Session expired.');
    return null;
  }

  return user;
}

export function createMarketplaceServer(configOverrides: Partial<MarketplaceServerConfig> = {}) {
  const config = loadConfig(configOverrides);
  mkdirSync(config.storageDir, { recursive: true });
  const db = createDatabase(config.sqlitePath);
  const store = createMarketplaceStore(db, config.storageDir);
  const commerceStore = createMockCommerceStore();
  const specimenStore = createSpecimenStore(db);
  const resolveSessionIdentity = (cookieHeader: string | undefined) => {
    const sessionUserId = readSessionUserId(cookieHeader, config.sessionSecret);
    if (!sessionUserId) return null;
    const user = store.getUserById(sessionUserId);
    if (!user) return { discordUserId: sessionUserId };
    return {
      discordUserId: user.discordUserId ?? sessionUserId,
      discordHandle: user.discordHandle ?? undefined,
    };
  };
  const v1Handler = registerV1Routes(
    async () => false,
    config,
    specimenStore,
    resolveSessionIdentity,
  );
  const secureCookies = isSecureCookie(config);

  const server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendError(res, 400, 'Malformed request.');
        return;
      }

      const url = new URL(req.url, config.publicOrigin);
      const pathname = cleanPathname(url.pathname);
      const respondWithCommerceError = (error: unknown) => {
        if (error instanceof MockCommerceError) {
          sendJson(res, error.status, {
            error: {
              code: error.code,
              message: error.message,
              details: error.details ?? undefined,
            },
          });
          return true;
        }
        return false;
      };

      // Serve contract files at root (skill.md, heartbeat.md, etc.)
      const contractFiles = ['skill.md', 'heartbeat.md', 'breeding.md', 'rules.md', 'skill.json', 'discord.md', 'onboarding.md'];
      const contractName = pathname.replace(/^\//, '');
      if (contractFiles.includes(contractName) && req.method === 'GET') {
        try {
          const { readFile: rf } = await import('node:fs/promises');
          const contractPath = join(process.cwd(), 'public', contractName);
          const content = await rf(contractPath, 'utf8');
          const ct = contractName.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/markdown; charset=utf-8';
          res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=300' });
          res.end(content);
          return;
        } catch { /* fall through */ }
      }

      // ClawPark v1 API routes
      const handled = await v1Handler(req, res, url);
      if (handled) return;

      if (pathname === '/api/openapi.json') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        sendJson(res, 200, buildOpenApiSpec(config));
        return;
      }

      if (pathname === '/api/docs') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(buildApiDocsHtml('/api/openapi.json'));
        return;
      }

      if (pathname === '/api/auth/session') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        const userId = readSessionUserId(req.headers.cookie, config.sessionSecret);
        const user = userId ? store.getUserById(userId) : null;
        sendJson(res, 200, { user, authConfigured: isDiscordAuthConfigured(config) });
        return;
      }

      if (pathname === '/api/auth/discord/start') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        if (!isDiscordAuthConfigured(config)) {
          sendError(res, 503, 'Discord OAuth is not configured on this server.');
          return;
        }

        const state = randomBytes(16).toString('hex');
        redirect(res, createDiscordAuthUrl(config, state), {
          'Set-Cookie': buildOauthStateCookie(state, secureCookies),
        });
        return;
      }

      if (pathname === '/api/auth/discord/callback') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        if (!isDiscordAuthConfigured(config)) {
          sendError(res, 503, 'Discord OAuth is not configured on this server.');
          return;
        }

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const expectedState = readOauthState(req.headers.cookie);
        if (!code || !state || !expectedState || state !== expectedState) {
          sendError(res, 400, 'Discord OAuth state mismatch.');
          return;
        }

        const token = await exchangeDiscordCode(config, code);
        const discordUser = await fetchDiscordUser(token.access_token);
        const user = store.upsertDiscordUser(discordUser);
        if (!user) {
          sendError(res, 500, 'Failed to create marketplace user.');
          return;
        }

        redirect(res, `${config.clientOrigin}/?marketplace=publish`, {
          'Set-Cookie': [buildSessionCookie(user, config.sessionSecret, secureCookies), clearOauthStateCookie(secureCookies)],
        });
        return;
      }

      if (pathname === '/api/auth/logout') {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie(secureCookies) });
        return;
      }

      if (pathname === '/api/me') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.getMe());
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/me/summary') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.getSummary());
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/my/claws') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(
            res,
            200,
            commerceStore.listMyClaws({
              inventoryState: url.searchParams.get('inventoryState'),
              breedable: url.searchParams.get('breedable'),
              sourceKind: url.searchParams.get('sourceKind'),
            }),
          );
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      const specimenActivityMatch = pathname.match(/^\/api\/my\/claws\/([^/]+)\/activity$/);
      if (specimenActivityMatch) {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          const specimenId = decodeURIComponent(specimenActivityMatch[1]);
          sendJson(res, 200, commerceStore.getSpecimenActivity(specimenId));
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      const specimenMatch = pathname.match(/^\/api\/my\/claws\/([^/]+)$/);
      if (specimenMatch) {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.getSpecimenDetail(decodeURIComponent(specimenMatch[1])));
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/my/transactions') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.listTransactions());
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/breeding/eligibility') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        const specimenId = url.searchParams.get('specimenId');
        if (!specimenId) {
          sendError(res, 400, 'specimenId is required.');
          return;
        }
        try {
          sendJson(res, 200, commerceStore.getBreedingEligibility(specimenId));
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/breeding/runs') {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        try {
          const payload = await readJson<{ parentASpecimenId: string; parentBSpecimenId: string; preferredTraitId?: string; breedPrompt?: string }>(req);
          sendJson(res, 200, commerceStore.runBreed(payload));
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      const provenanceMatch = pathname.match(/^\/api\/claws\/([^/]+)\/provenance$/);
      if (provenanceMatch) {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.getProvenance(decodeURIComponent(provenanceMatch[1])));
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/marketplace/drafts') {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const user = await requireUser(req, res, config, store);
        if (!user) return;

        const formData = await readMultipartForm(req, url, config.maxUploadBytes);
        const bundle = formData.get('bundle');
        if (!(bundle instanceof File)) {
          sendError(res, 400, 'Upload must include a ZIP bundle under the bundle field.');
          return;
        }
        if (!bundle.name.toLowerCase().endsWith('.zip')) {
          sendError(res, 400, 'Upload must be a .zip OpenClaw workspace bundle.');
          return;
        }

        const uploadPath = await saveUploadedFile(bundle, join(config.storageDir, 'incoming'));
        try {
          const parsed = await parseOpenClawWorkspaceZip(uploadPath);
          const draft = store.createDraft({ userId: user.id, claw: parsed.claw, manifest: parsed.manifest });
          sendJson(res, 201, draft);
        } finally {
          await rm(uploadPath, { force: true }).catch(() => undefined);
        }
        return;
      }

      if (pathname === '/api/marketplace/ingest/claw') {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const formData = await readMultipartForm(req, url, config.maxUploadBytes);
        const bundle = formData.get('bundle');
        const publisherLabel = String(formData.get('publisherLabel') ?? '').trim() || 'Unsigned Publisher';
        const title = String(formData.get('title') ?? '').trim() || undefined;
        const summary = String(formData.get('summary') ?? '').trim() || undefined;
        if (!(bundle instanceof File) || !bundle.name.toLowerCase().endsWith('.zip')) {
          sendError(res, 400, 'Unsigned claw ingest requires a .zip bundle.');
          return;
        }

        const uploadPath = await saveUploadedFile(bundle, join(config.storageDir, 'incoming'));
        try {
          const parsed = await parseOpenClawWorkspaceZip(uploadPath);
          const listing = store.createUnsignedListing({
            publisherLabel,
            title,
            summary,
            listing: { kind: 'claw', value: parsed.claw, manifest: parsed.manifest },
          });
          sendJson(res, 201, listing);
        } finally {
          await rm(uploadPath, { force: true }).catch(() => undefined);
        }
        return;
      }

      if (pathname === '/api/marketplace/ingest/skill') {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const formData = await readMultipartForm(req, url, config.maxUploadBytes);
        const bundle = formData.get('bundle');
        const publisherLabel = String(formData.get('publisherLabel') ?? '').trim() || 'Unsigned Publisher';
        const title = String(formData.get('title') ?? '').trim() || undefined;
        const summary = String(formData.get('summary') ?? '').trim() || undefined;
        if (!(bundle instanceof File) || !bundle.name.toLowerCase().endsWith('.zip')) {
          sendError(res, 400, 'Unsigned skill ingest requires a .zip bundle.');
          return;
        }

        const uploadPath = await saveUploadedFile(bundle, join(config.storageDir, 'incoming'));
        try {
          const parsed = await parseOpenClawSkillZip(uploadPath);
          const listing = store.createUnsignedListing({
            publisherLabel,
            title,
            summary,
            artifact: {
              bytes: parsed.bundleBytes,
              extension: '.skill.zip',
              contentType: 'application/zip',
            },
            listing: {
              kind: 'skill',
              value: parsed.skill,
              manifest: parsed.manifest,
              installHint: formatSkillInstallHint(config.skillInstallRoot, parsed.skill.slug),
            },
          });
          sendJson(res, 201, listing);
        } finally {
          await rm(uploadPath, { force: true }).catch(() => undefined);
        }
        return;
      }

      const draftMatch = pathname.match(/^\/api\/marketplace\/drafts\/([^/]+)$/);
      if (draftMatch) {
        const draftId = decodeURIComponent(draftMatch[1]);
        if (req.method === 'GET') {
          const user = await requireUser(req, res, config, store);
          if (!user) return;
          const draft = store.getDraftForUser(draftId, user.id);
          if (!draft) return sendError(res, 404, 'Draft not found.');
          sendJson(res, 200, draft);
          return;
        }

        if (req.method === 'PATCH') {
          const user = await requireUser(req, res, config, store);
          if (!user) return;
          const payload = await readJson<{
            title?: string;
            summary?: string;
            toolsVisibility?: 'full' | 'summary';
            coverStyle?: 'avatar' | 'containment-card';
          }>(req);
          const draft = store.updateDraft({ id: draftId, userId: user.id, ...payload });
          sendJson(res, 200, draft);
          return;
        }

        return methodNotAllowed(res, ['GET', 'PATCH']);
      }

      const draftPublishMatch = pathname.match(/^\/api\/marketplace\/drafts\/([^/]+)\/publish$/);
      if (draftPublishMatch) {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const user = await requireUser(req, res, config, store);
        if (!user) return;
        const listing = store.publishDraft({ id: decodeURIComponent(draftPublishMatch[1]), userId: user.id });
        sendJson(res, 201, listing);
        return;
      }

      if (pathname === '/api/marketplace/mock-listings') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        try {
          sendJson(res, 200, commerceStore.listMarketplaceListings());
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
        return;
      }

      if (pathname === '/api/marketplace/listings') {
        if (req.method === 'GET') {
          sendJson(res, 200, store.listListings());
          return;
        }

        if (req.method === 'POST') {
          try {
            const payload = await readJson<{ specimenId: string; price: { amount: number; currency?: string } }>(req);
            const listing = commerceStore.createListing(payload);
            sendJson(res, 201, listing);
          } catch (error) {
            if (respondWithCommerceError(error)) return;
            throw error;
          }
          return;
        }

        return methodNotAllowed(res, ['GET', 'POST']);
      }

      const listingActionMatch = pathname.match(/^\/api\/marketplace\/listings\/([^/]+)\/(delist|relist|purchase)$/);
      if (listingActionMatch) {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const slug = decodeURIComponent(listingActionMatch[1]);
        const action = listingActionMatch[2];
        try {
          if (action === 'delist') {
            sendJson(res, 200, commerceStore.delistListing(slug));
            return;
          }
          if (action === 'relist') {
            sendJson(res, 200, commerceStore.relistListing(slug));
            return;
          }
          sendJson(res, 200, commerceStore.purchaseListing(slug));
          return;
        } catch (error) {
          if (respondWithCommerceError(error)) return;
          throw error;
        }
      }

      const bundleMatch = pathname.match(/^\/api\/marketplace\/listings\/([^/]+)\/bundle$/);
      if (bundleMatch) {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        const slug = decodeURIComponent(bundleMatch[1]);
        const artifact = store.getListingArtifact(slug);
        if (!artifact) return sendError(res, 404, 'Listing bundle not found.');
        const contents = await readFile(artifact.path);
        res.writeHead(200, {
          'Content-Type': artifact.contentType,
          'Content-Disposition': `attachment; filename="${artifact.filename}"`,
        });
        res.end(contents);
        return;
      }

      const installMatch = pathname.match(/^\/api\/marketplace\/listings\/([^/]+)\/install$/);
      if (installMatch) {
        if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
        const slug = decodeURIComponent(installMatch[1]);
        const payload = await readJson<{ overwrite?: boolean }>(req);
        const listing = store.getListingBySlug(slug);
        if (!listing) return sendError(res, 404, 'Listing not found.');
        if (listing.kind !== 'skill') return sendError(res, 400, 'Only skill listings can be installed.');

        const artifact = store.getListingArtifact(slug);
        if (!artifact) return sendError(res, 404, 'Listing bundle not found.');

        try {
          const result = await installMarketplaceSkillBundle({
            zipPath: artifact.path,
            skillSlug: listing.skill.slug,
            installRoot: config.skillInstallRoot,
            overwrite: payload.overwrite,
          });
          sendJson(res, 200, { ok: true, slug, skillSlug: listing.skill.slug, ...result });
        } catch (error) {
          if (error instanceof SkillInstallConflictError) {
            sendJson(res, 409, {
              error: error.message,
              code: error.code,
              installedPath: error.installedPath,
              overwriteRequired: error.overwriteRequired,
            });
            return;
          }
          throw error;
        }
        return;
      }

      const listingMatch = pathname.match(/^\/api\/marketplace\/listings\/([^/]+)$/);
      if (listingMatch) {
        const slug = decodeURIComponent(listingMatch[1]);
        if (req.method === 'PATCH') {
          try {
            const payload = await readJson<{ price: { amount: number; currency?: string } }>(req);
            sendJson(res, 200, commerceStore.updateListingPrice(slug, payload));
          } catch (error) {
            if (respondWithCommerceError(error)) return;
            throw error;
          }
          return;
        }

        if (req.method === 'GET') {
          const listing = store.getListingBySlug(slug);
          if (!listing) return sendError(res, 404, 'Listing not found.');
          sendJson(res, 200, listing);
          return;
        }

        return methodNotAllowed(res, ['GET', 'PATCH']);
      }

      if (pathname.startsWith('/api/')) {
        notFound(res);
        return;
      }

      if (req.method === 'GET') {
        await serveStaticFile(config, pathname, res);
        return;
      }

      notFound(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error.';
      sendError(res, 500, message);
    }
  });

  return { server, config, db, store, specimenStore };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, config, specimenStore: sStore } = createMarketplaceServer() as ReturnType<typeof createMarketplaceServer>;
  server.listen(config.port, config.host, () => {
    console.log(`ClawPark marketplace server listening on ${config.publicOrigin}`);

    // Start Discord bot if token is configured
    if (config.discordBotToken) {
      try {
        startDiscordBot({
          token: config.discordBotToken,
          allowLocalZipPathImport: config.discordAllowLocalZipPathImport,
          importSpecimen: async (zipPath: string, discordUserId: string) => {
            const { parseOpenClawWorkspaceZip } = await import('./openclawParser.ts');
            const { createHash } = await import('node:crypto');
            const { readFile } = await import('node:fs/promises');
            const buffer = await readFile(zipPath);
            const fingerprint = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
            const { claw, manifest } = await parseOpenClawWorkspaceZip(zipPath);
            const result = sStore.importSpecimen(claw, manifest, fingerprint, discordUserId);
            sStore.claimSpecimen(result.specimenId, discordUserId);
            return { specimenName: claw.name, specimenId: result.specimenId };
          },
          orchestratorDeps: {
            resolveSpecimenByName: (name: string) => {
              const all = sStore.listSpecimens();
              const match = all.find((s: { name: string }) => s.name.toLowerCase() === name.toLowerCase());
              if (!match) return null;
              return {
                id: match.id,
                name: match.name,
                ownerId: match.discordUserId,
                breedable: match.ownershipState === 'claimed' && match.breedState === 'ready',
                ownershipState: match.ownershipState,
                breedState: match.breedState,
              };
            },
            resolveSpecimenById: (id: string) => {
              const s = sStore.getSpecimen(id);
              if (!s) return null;
              return {
                id: s.id,
                name: s.name,
                ownerId: s.discordUserId,
                breedable: s.ownershipState === 'claimed' && s.breedState === 'ready',
                ownershipState: s.ownershipState,
                breedState: s.breedState,
              };
            },
            listBreedableSpecimens: () => {
              return sStore.listSpecimens()
                .filter((s: { ownershipState: string; breedState: string }) => s.ownershipState === 'claimed' && s.breedState === 'ready')
                .map((s: { id: string; name: string; discordUserId: string | null; ownershipState: string; breedState: string }) => ({
                  id: s.id,
                  name: s.name,
                  ownerId: s.discordUserId,
                  breedable: true,
                  ownershipState: s.ownershipState,
                  breedState: s.breedState,
                }));
            },
            listAllSpecimens: () => {
              return sStore.listSpecimens().map((s: { id: string; name: string; discordUserId: string | null; ownershipState: string; breedState: string }) => ({
                id: s.id,
                name: s.name,
                ownerId: s.discordUserId,
                breedable: s.ownershipState === 'claimed' && s.breedState === 'ready',
                ownershipState: s.ownershipState,
                breedState: s.breedState,
              }));
            },
            getSpecimenProfile: (id: string) => {
              const specimen = sStore.getSpecimen(id);
              if (!specimen) return null;
              return {
                id: specimen.id,
                name: specimen.name,
                ownerId: specimen.discordUserId,
                breedable: specimen.ownershipState === 'claimed' && specimen.breedState === 'ready',
                ownershipState: specimen.ownershipState,
                breedState: specimen.breedState,
                parentAId: specimen.parentAId,
                parentBId: specimen.parentBId,
                claw: specimen.claw,
              };
            },
            runBreed: async (parentAId: string, parentBId: string, prompt?: string) => {
              const parentA = sStore.getSpecimen(parentAId);
              const parentB = sStore.getSpecimen(parentBId);
              if (!parentA || !parentB) throw new Error('Specimens not found');
              const run = sStore.createBreedingRun(parentAId, parentBId, prompt);
              const result = breed({ parentA: parentA.claw, parentB: parentB.claw, breedPrompt: prompt, seed: Date.now() });
              const completed = sStore.completeBreedingRun(run.id, result.child);
              return {
                runId: run.id,
                childId: completed?.child?.id ?? result.child.id,
                childName: result.child.name,
                lineageSummary: `${parentA.name} + ${parentB.name} → ${result.child.name} (${result.child.archetype})`,
              };
            },
          },
          exportSpecimenBundle: async (specimenId: string) => {
            const specimen = sStore.getSpecimen(specimenId);
            if (!specimen) return null;
            const bundle: ClawBundle = {
              kind: 'claw',
              manifest: {
                kind: 'claw',
                bundleVersion: 1,
                source: 'openclaw-workspace-zip',
                includedFiles: ['IDENTITY.md', 'SOUL.md'],
                ignoredFiles: [],
                warnings: [],
                generatedAt: new Date().toISOString(),
                toolsVisibility: 'full',
                coverStyle: 'avatar',
              },
              claw: specimen.claw,
            };
            return {
              filename: `${specimen.name || specimen.id}.bundle.json`,
              buffer: Buffer.from(JSON.stringify(bundle, null, 2), 'utf8'),
            };
          },
        });
        console.log('Discord bot started successfully.');
      } catch (err) {
        console.error('Failed to start Discord bot:', err);
      }
    } else {
      console.log('DISCORD_BOT_TOKEN not set — bot disabled.');
    }
  });
}
