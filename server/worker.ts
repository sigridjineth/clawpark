import { createMarketplaceStore } from './marketplaceStore.ts';
import { createWorkerDatabase } from './db-worker.ts';
import { loadWorkerConfig, type Env } from './config-worker.ts';
import { isDiscordAuthConfigured } from './config.ts';
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

function json(status: number, body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { ...init, status, headers });
}

function error(status: number, message: string) {
  return json(status, { error: message });
}

function redirect(location: string, headers: HeadersInit = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...headers,
    },
  });
}

function isSecureCookie(publicOrigin: string) {
  return new URL(publicOrigin).protocol === 'https:';
}

function cleanPathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const config = loadWorkerConfig(env);
    const db = createWorkerDatabase(env.DB);
    const store = createMarketplaceStore(db, config.storageDir);
    const commerceStore = createMockCommerceStore();
    const secureCookies = isSecureCookie(config.publicOrigin);

    const url = new URL(request.url);
    const pathname = cleanPathname(url.pathname);

    const respondWithCommerceError = (err: unknown) => {
      if (err instanceof MockCommerceError) {
        return json(err.status, {
          error: {
            code: err.code,
            message: err.message,
            details: err.details ?? undefined,
          },
        });
      }
      return null;
    };

    try {
      if (pathname === '/api/openapi.json') {
        if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
        return json(200, buildOpenApiSpec(config));
      }

      if (pathname === '/api/docs') {
        if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
        return new Response(buildApiDocsHtml('/api/openapi.json'), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }

      if (pathname === '/api/auth/session') {
        if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
        const cookie = request.headers.get('Cookie') ?? '';
        const userId = readSessionUserId(cookie, config.sessionSecret);
        const user = userId ? store.getUserById(userId) : null;
        return json(200, { user, authConfigured: isDiscordAuthConfigured(config) });
      }

      if (pathname === '/api/auth/discord/start') {
        if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
        if (!isDiscordAuthConfigured(config)) {
          return error(503, 'Discord OAuth is not configured on this server.');
        }
        const state = crypto.randomUUID().replace(/-/g, '');
        const location = new URL(config.publicOrigin);
        const redirectUrl = location; // createDiscordAuthUrl could be adapted similarly; omitted for brevity
        const cookie = buildOauthStateCookie(state, secureCookies);
        return redirect(redirectUrl.toString(), { 'Set-Cookie': cookie });
      }

      if (pathname.startsWith('/api/')) {
        // For brevity, not all routes are fully reimplemented here.
        return error(501, 'Worker API implementation is incomplete. Extend server/worker.ts to mirror server/index.ts routes.');
      }

      // Let static assets be handled by Pages or another layer.
      return new Response('Not found.', { status: 404 });
    } catch (err) {
      const commerceError = respondWithCommerceError(err);
      if (commerceError) return commerceError;
      const message = err instanceof Error ? err.message : 'Internal server error.';
      return error(500, message);
    }
  },
};

