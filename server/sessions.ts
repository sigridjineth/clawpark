import { createHmac, timingSafeEqual } from 'node:crypto';
import type { MarketplacePublisher } from '../src/types/marketplace.ts';

const SESSION_COOKIE = 'clawpark_session';
const STATE_COOKIE = 'clawpark_oauth_state';

interface SessionPayload {
  userId: string;
  issuedAt: number;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function encode(payload: SessionPayload, secret: string) {
  const raw = toBase64Url(JSON.stringify(payload));
  return `${raw}.${sign(raw, secret)}`;
}

function decode(token: string, secret: string): SessionPayload | null {
  const [raw, signature] = token.split('.');
  if (!raw || !signature) return null;

  const expected = sign(raw, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const chunk of header.split(/;\s*/)) {
    const [key, ...rest] = chunk.split('=');
    if (!key || rest.length === 0) continue;
    cookies.set(key, decodeURIComponent(rest.join('=')));
  }

  return cookies;
}

function buildCookie(name: string, value: string, maxAgeSeconds: number, secure: boolean, httpOnly = true) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildSessionCookie(user: MarketplacePublisher, secret: string, secure: boolean) {
  return buildCookie(
    SESSION_COOKIE,
    encode({ userId: user.id, issuedAt: Date.now() }, secret),
    60 * 60 * 24 * 30,
    secure,
  );
}

export function clearSessionCookie(secure: boolean) {
  return buildCookie(SESSION_COOKIE, '', 0, secure);
}

export function readSessionUserId(cookieHeader: string | undefined, secret: string) {
  const token = parseCookies(cookieHeader).get(SESSION_COOKIE);
  if (!token) return null;
  const payload = decode(token, secret);
  return payload?.userId ?? null;
}

export function buildOauthStateCookie(state: string, secure: boolean) {
  return buildCookie(STATE_COOKIE, state, 60 * 10, secure);
}

export function clearOauthStateCookie(secure: boolean) {
  return buildCookie(STATE_COOKIE, '', 0, secure);
}

export function readOauthState(cookieHeader: string | undefined) {
  return parseCookies(cookieHeader).get(STATE_COOKIE) ?? null;
}
