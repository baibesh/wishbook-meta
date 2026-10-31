import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A small JSON payload with an expiry, signed with HMAC-SHA256: `<base64url json>.<signature>`.
 * Readable by whoever holds it (do not put secrets in), but not forgeable without the secret.
 */
export function seal(
  secret: string,
  payload: Record<string, unknown>,
  ttlMs: number,
  now = Date.now(),
): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: now + ttlMs }),
  ).toString('base64url');
  return `${body}.${hmac(secret, body)}`;
}

/** The payload of an unexpired token sealed with this secret, else undefined. */
export function unseal<T extends object>(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): T | undefined {
  if (!token) return undefined;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return undefined;
  if (!sameString(signature, hmac(secret, body))) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || payload.exp < now) return undefined;
    return payload as T;
  } catch {
    return undefined;
  }
}

function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/** Constant-time string comparison. */
export function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** One Set-Cookie header value; `maxAgeSeconds` 0 clears it. */
export function cookieHeader(
  name: string,
  value: string,
  options: { maxAgeSeconds: number; secure: boolean; path?: string },
): string {
  const secure = options.secure ? '; Secure' : '';
  return `${name}=${value}; HttpOnly; Path=${options.path ?? '/'}; SameSite=Lax; Max-Age=${options.maxAgeSeconds}${secure}`;
}
