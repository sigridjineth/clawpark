import { loadWorkerConfig, type Env } from './config-worker.ts';
import { buildApiDocsHtml, buildOpenApiSpec } from './openapi.ts';

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

function cleanPathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = loadWorkerConfig(env);
    const url = new URL(request.url);
    const pathname = cleanPathname(url.pathname);

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
        return json(200, {
          user: null,
          authConfigured: Boolean(config.discordClientId && config.discordClientSecret && config.discordRedirectUri),
        });
      }

      if (pathname.startsWith('/api/')) {
        return error(501, 'Worker API routes are not fully ported yet. Use the Node server for full functionality.');
      }

      return new Response('Not found.', { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error.';
      return error(500, message);
    }
  },
};
