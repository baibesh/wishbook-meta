import { generateKeyPairSync, sign } from 'node:crypto';
import { realmRoles } from './auth.util';
import { OidcClient } from './oidc';

const issuer = 'https://auth.example.com/realms/fabulka';
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', use: 'sig' };

function jwt(claims: Record<string, unknown>, kid = 'k1') {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const head = part({ alg: 'RS256', kid, typ: 'JWT' });
  const body = part({
    iss: issuer,
    exp: Math.floor(Date.now() / 1000) + 300,
    ...claims,
  });
  const signature = sign('sha256', Buffer.from(`${head}.${body}`), privateKey);
  return `${head}.${body}.${signature.toString('base64url')}`;
}

function serve(tokens: Record<string, unknown> = {}) {
  return jest.spyOn(global, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const json = (value: unknown) =>
      Promise.resolve(new Response(JSON.stringify(value)));
    if (url.endsWith('/.well-known/openid-configuration')) {
      return json({
        issuer,
        authorization_endpoint: `${issuer}/auth`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/certs`,
        end_session_endpoint: `${issuer}/logout`,
      });
    }
    if (url.endsWith('/certs')) return json({ keys: [jwk] });
    if (url.endsWith('/token')) return json(tokens);
    return Promise.resolve(new Response('', { status: 404 }));
  });
}

const client = () =>
  new OidcClient({
    issuer,
    clientId: 'fabulka-web',
    clientSecret: 's',
    redirectUri: 'https://fabulka.com/api/auth/callback',
  });

afterEach(() => jest.restoreAllMocks());

describe('OidcClient', () => {
  it('exchanges the code and reads the admin role from the access token', async () => {
    const fetchMock = serve({
      id_token: jwt({
        sub: 'u1',
        aud: 'fabulka-web',
        nonce: 'n1',
        email: 'p@x.kz',
      }),
      access_token: jwt({
        sub: 'u1',
        aud: 'account',
        azp: 'fabulka-web',
        realm_access: { roles: ['admin'] },
      }),
    });
    const { id, access } = await client().exchange('code', 'verifier', 'n1');
    expect(id.email).toBe('p@x.kz');
    expect(realmRoles(id, access).has('admin')).toBe(true);
    const tokenCall = fetchMock.mock.calls.find(
      ([url]) => typeof url === 'string' && url.endsWith('/token'),
    )!;
    const body = (tokenCall[1] as RequestInit).body as URLSearchParams;
    expect(body.get('code_verifier')).toBe('verifier');
    expect(body.get('grant_type')).toBe('authorization_code');
  });

  it('rejects an ID token with another nonce, audience or a forged signature', async () => {
    serve();
    const oidc = client();
    await expect(
      oidc.verify(jwt({ sub: 'u', aud: 'fabulka-web', nonce: 'x' }), {
        audience: 'fabulka-web',
        nonce: 'n1',
      }),
    ).rejects.toThrow('nonce');
    await expect(
      oidc.verify(jwt({ sub: 'u', aud: 'other' }), { audience: 'fabulka-web' }),
    ).rejects.toThrow('audience');
    const [head, , signature] = jwt({ sub: 'u', aud: 'fabulka-web' }).split(
      '.',
    );
    const forged = Buffer.from(
      JSON.stringify({
        iss: issuer,
        sub: 'admin',
        aud: 'fabulka-web',
        exp: 9e9,
      }),
    ).toString('base64url');
    await expect(
      oidc.verify(`${head}.${forged}.${signature}`, {
        audience: 'fabulka-web',
      }),
    ).rejects.toThrow('signature');
    await expect(oidc.verify(jwt({ sub: 'u' }, 'unknown'), {})).rejects.toThrow(
      'unknown signing key',
    );
  });

  it('builds the end-session URL with the ID token hint', async () => {
    serve();
    const url = new URL(
      (await client().endSessionUrl('idt', 'https://fabulka.com/'))!,
    );
    expect(url.searchParams.get('id_token_hint')).toBe('idt');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://fabulka.com/',
    );
  });
});
