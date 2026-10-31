import { LANGUAGES, type Language } from '@fabulka/shared';
import { createHash, randomBytes } from 'node:crypto';

/**
 * Where to send the browser after sign-in: only a path on this site. Anything else (another
 * origin, a protocol-relative `//host`, a backslash trick, control characters) falls back to "/".
 */
export function safeReturn(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  // Browsers read "\" as "/", so "/\evil.com" would be protocol-relative.
  // eslint-disable-next-line no-control-regex -- control characters are exactly what is refused
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return '/';
  return value;
}

/** The return path with ?auth=<value> added, keeping its own query and hash. */
export function withAuthParam(path: string, value: string): string {
  const hashAt = path.indexOf('#');
  const base = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : path.slice(hashAt);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}auth=${encodeURIComponent(value)}${hash}`;
}

/** A language for Keycloak's ui_locales, if the web sent a known one. */
export function uiLocale(value: unknown): Language | undefined {
  return LANGUAGES.find((language) => language === value);
}

/** The anonymous visitor key the web passes on /auth/login (it cannot send headers on a redirect). */
export function clientKeyParam(value: unknown): string | undefined {
  return typeof value === 'string' && /^[\w.:-]{1,200}$/.test(value)
    ? value
    : undefined;
}

/** A random URL-safe string for state, nonce and the PKCE verifier. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** PKCE S256 code challenge of a verifier. */
export function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Keycloak realm roles from token claims: `realm_access.roles` (the access token, and the ID
 * token when a mapper adds it there) or a flat `roles` claim (a "realm roles" mapper with a
 * custom claim name).
 */
export function realmRoles(...claims: (Record<string, unknown> | undefined)[]) {
  const roles = new Set<string>();
  for (const claim of claims) {
    if (!claim) continue;
    const realm = claim.realm_access as { roles?: unknown } | undefined;
    for (const list of [realm?.roles, claim.roles]) {
      if (!Array.isArray(list)) continue;
      for (const role of list) if (typeof role === 'string') roles.add(role);
    }
  }
  return roles;
}

/** Standard claims a verified token must carry; returns what is wrong, or null. */
export function claimsProblem(
  claims: Record<string, unknown>,
  expected: {
    issuer: string;
    audience?: string;
    nonce?: string;
    now?: number;
  },
): string | null {
  const now = Math.floor((expected.now ?? Date.now()) / 1000);
  const skew = 60;
  if (claims.iss !== expected.issuer) return 'issuer';
  if (typeof claims.exp !== 'number' || claims.exp + skew < now)
    return 'expired';
  if (typeof claims.nbf === 'number' && claims.nbf - skew > now)
    return 'not yet valid';
  if (expected.audience !== undefined) {
    const aud = claims.aud;
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.includes(expected.audience)) return 'audience';
    if (
      audiences.length > 1 &&
      claims.azp !== undefined &&
      claims.azp !== expected.audience
    )
      return 'authorized party';
  }
  if (expected.nonce !== undefined && claims.nonce !== expected.nonce)
    return 'nonce';
  if (typeof claims.sub !== 'string' || !claims.sub) return 'subject';
  return null;
}
