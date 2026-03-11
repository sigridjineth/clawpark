import { Buffer } from 'node:buffer';
import type { IncomingMessage, ServerResponse } from 'node:http';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export async function readBody(req: IncomingMessage, maxBytes: number) {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const next = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += next.length;
    if (total > maxBytes) {
      throw new Error('Upload exceeds size limit.');
    }
    chunks.push(next);
  }

  return Buffer.concat(chunks);
}

export async function readJson<T>(req: IncomingMessage, maxBytes = 256 * 1024): Promise<T> {
  const body = await readBody(req, maxBytes);
  if (body.length === 0) {
    return {} as T;
  }
  return JSON.parse(body.toString('utf8')) as T;
}

export async function readMultipartForm(req: IncomingMessage, url: URL, maxBytes: number) {
  const body = await readBody(req, maxBytes);
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  });
  return request.formData();
}

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown, headers: Record<string, string> = {}) {
  res.writeHead(statusCode, { ...JSON_HEADERS, ...headers });
  res.end(JSON.stringify(payload));
}

export function sendError(res: ServerResponse, statusCode: number, error: string) {
  sendJson(res, statusCode, { error });
}

export function redirect(res: ServerResponse, location: string, headers: Record<string, string | string[]> = {}) {
  res.writeHead(302, {
    Location: location,
    ...headers,
  });
  res.end();
}

export function notFound(res: ServerResponse) {
  sendError(res, 404, 'Not found.');
}

export function methodNotAllowed(res: ServerResponse, allowed: string[]) {
  res.writeHead(405, { Allow: allowed.join(', ') });
  res.end();
}
