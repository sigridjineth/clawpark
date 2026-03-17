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
  const secureCookies = isSecureCookie(config);

  const server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendError(res, 400, 'Malformed request.');
        return;
      }

      const url = new URL(req.url, config.publicOrigin);
      const pathname = cleanPathname(url.pathname);

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

      if (pathname === '/api/marketplace/listings') {
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        sendJson(res, 200, store.listListings());
        return;
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
        if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
        const listing = store.getListingBySlug(decodeURIComponent(listingMatch[1]));
        if (!listing) return sendError(res, 404, 'Listing not found.');
        sendJson(res, 200, listing);
        return;
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

  return { server, config, db, store };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, config } = createMarketplaceServer();
  server.listen(config.port, config.host, () => {
    console.log(`ClawPark marketplace server listening on ${config.publicOrigin}`);
  });
}
