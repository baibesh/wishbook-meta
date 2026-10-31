import {
  constants,
  createPublicKey,
  verify as verifySignature,
  type JsonWebKey,
  type KeyObject,
} from 'node:crypto';
import { claimsProblem } from './auth.util';

export interface OidcSettings {
  issuer: string;
  clientId: string;
  clientSecret: string;
  /** PUBLIC_URL/api/auth/callback, registered in Keycloak. */
  redirectUri: string;
}

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

export type Claims = Record<string, unknown> & { sub: string };

/** Signature algorithms accepted on tokens, as node:crypto needs them. */
const ALGORITHMS: Record<
  string,
  { hash: string; pss?: boolean; ec?: boolean }
> = {
  RS256: { hash: 'sha256' },
  RS384: { hash: 'sha384' },
  RS512: { hash: 'sha512' },
  PS256: { hash: 'sha256', pss: true },
  PS384: { hash: 'sha384', pss: true },
  ES256: { hash: 'sha256', ec: true },
  ES384: { hash: 'sha384', ec: true },
};

/** Fetching the signing keys again for an unknown key id waits at least this long. */
const JWKS_REFRESH_MS = 60_000;
const HTTP_TIMEOUT_MS = 10_000;

/**
 * The OpenID Connect authorization code flow with PKCE against one issuer (Keycloak), with
 * node:crypto verifying token signatures from the issuer's JWKS: discovery, token exchange,
 * ID/access token checks and the end-session URL.
 */
export class OidcClient {
  private discovered?: Promise<Discovery>;
  private keys = new Map<string, KeyObject>();
  private keysFetchedAt = 0;

  constructor(readonly settings: OidcSettings) {}

  async authorizationUrl(params: {
    state: string;
    nonce: string;
    challenge: string;
    locale?: string;
  }): Promise<string> {
    const { authorization_endpoint } = await this.discovery();
    const url = new URL(authorization_endpoint);
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: this.settings.clientId,
      redirect_uri: this.settings.redirectUri,
      scope: 'openid email profile',
      state: params.state,
      nonce: params.nonce,
      code_challenge: params.challenge,
      code_challenge_method: 'S256',
      ...(params.locale ? { ui_locales: params.locale } : {}),
    }).toString();
    return url.toString();
  }

  /** Trades the code for tokens and checks them; the access token is optional for roles. */
  async exchange(
    code: string,
    verifier: string,
    nonce: string,
  ): Promise<{ id: Claims; idToken: string; access?: Claims }> {
    const { token_endpoint } = await this.discovery();
    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.settings.redirectUri,
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`token endpoint answered ${response.status}`);
    }
    const tokens = (await response.json()) as {
      id_token?: string;
      access_token?: string;
    };
    if (!tokens.id_token) throw new Error('no id_token in the token response');
    const id = await this.verify(tokens.id_token, {
      audience: this.settings.clientId,
      nonce,
    });
    let access: Claims | undefined;
    if (tokens.access_token) {
      // Keycloak access tokens are JWTs for the "account" audience; only roles are read from them.
      access = await this.verify(tokens.access_token, {}).catch(
        () => undefined,
      );
      if (access && access.azp !== this.settings.clientId) access = undefined;
    }
    return { id, idToken: tokens.id_token, access };
  }

  /** Keycloak's logout URL that also ends its session, then comes back to `postLogout`. */
  async endSessionUrl(
    idTokenHint: string | undefined,
    postLogout: string,
  ): Promise<string | undefined> {
    const { end_session_endpoint } = await this.discovery();
    if (!end_session_endpoint) return undefined;
    const url = new URL(end_session_endpoint);
    url.search = new URLSearchParams({
      client_id: this.settings.clientId,
      post_logout_redirect_uri: postLogout,
      ...(idTokenHint ? { id_token_hint: idTokenHint } : {}),
    }).toString();
    return url.toString();
  }

  /** Checks a compact JWS signed by the issuer and its standard claims. */
  async verify(
    token: string,
    expected: { audience?: string; nonce?: string },
  ): Promise<Claims> {
    const [head, body, signature, extra] = token.split('.');
    if (!head || !body || !signature || extra !== undefined) {
      throw new Error('malformed token');
    }
    const header = decodePart(head) as { alg?: string; kid?: string };
    const algorithm = header.alg ? ALGORITHMS[header.alg] : undefined;
    if (!algorithm)
      throw new Error(`unsupported token algorithm ${header.alg}`);
    const key = await this.key(header.kid);
    const valid = verifySignature(
      algorithm.hash,
      Buffer.from(`${head}.${body}`),
      {
        key,
        ...(algorithm.pss
          ? {
              padding: constants.RSA_PKCS1_PSS_PADDING,
              saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
            }
          : {}),
        ...(algorithm.ec ? { dsaEncoding: 'ieee-p1363' as const } : {}),
      },
      Buffer.from(signature, 'base64url'),
    );
    if (!valid) throw new Error('bad token signature');
    const claims = decodePart(body);
    const problem = claimsProblem(claims, {
      issuer: this.settings.issuer,
      ...expected,
    });
    if (problem) throw new Error(`token rejected: ${problem}`);
    return claims as Claims;
  }

  private discovery(): Promise<Discovery> {
    this.discovered ??= getJson<Discovery>(
      `${this.settings.issuer}/.well-known/openid-configuration`,
    ).then((doc) => {
      if (doc.issuer !== this.settings.issuer) {
        throw new Error(`discovery issuer ${doc.issuer} does not match`);
      }
      return doc;
    });
    // A failed fetch (Keycloak restarting) is tried again on the next sign-in.
    this.discovered.catch(() => (this.discovered = undefined));
    return this.discovered;
  }

  private async key(kid: string | undefined): Promise<KeyObject> {
    const lookup = () =>
      kid ? this.keys.get(kid) : [...this.keys.values()][0];
    let key = lookup();
    if (!key && Date.now() - this.keysFetchedAt > JWKS_REFRESH_MS) {
      const { jwks_uri } = await this.discovery();
      const { keys } = await getJson<{ keys: (JsonWebKey & Jwk)[] }>(jwks_uri);
      this.keysFetchedAt = Date.now();
      this.keys = new Map(
        keys
          .filter((jwk) => jwk.use !== 'enc' && jwk.kid)
          .map((jwk) => [
            jwk.kid!,
            createPublicKey({ key: jwk, format: 'jwk' }),
          ]),
      );
      key = lookup();
    }
    if (!key) throw new Error(`unknown signing key ${kid}`);
    return key;
  }
}

interface Jwk {
  kid?: string;
  use?: string;
}

function decodePart(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(
    Buffer.from(part, 'base64url').toString('utf8'),
  );
  if (!value || typeof value !== 'object') throw new Error('malformed token');
  return value as Record<string, unknown>;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return (await response.json()) as T;
}
