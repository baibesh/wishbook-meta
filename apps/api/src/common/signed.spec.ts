import { cookieHeader, seal, unseal } from './signed';

describe('sealed tokens', () => {
  it('round-trips a payload until it expires', () => {
    const token = seal('s', { state: 'abc', return: '/my' }, 1000, 0);
    expect(unseal<{ state: string }>('s', token, 500)?.state).toBe('abc');
    expect(unseal('s', token, 1001)).toBeUndefined();
  });

  it('rejects another secret, a changed payload and junk', () => {
    const token = seal('s', { admin: false }, 60_000);
    expect(unseal('other', token)).toBeUndefined();
    const [, signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ admin: true, exp: Date.now() + 60_000 }),
    ).toString('base64url');
    expect(unseal('s', `${forged}.${signature}`)).toBeUndefined();
    expect(unseal('s', 'junk')).toBeUndefined();
    expect(unseal('s', `${token}.extra`)).toBeUndefined();
    expect(unseal('s', undefined)).toBeUndefined();
  });

  it('builds an httpOnly Lax cookie, Secure when asked', () => {
    const cookie = cookieHeader('fabulka_auth', 'v', {
      maxAgeSeconds: 600,
      secure: true,
      path: '/api/auth',
    });
    expect(cookie).toBe(
      'fabulka_auth=v; HttpOnly; Path=/api/auth; SameSite=Lax; Max-Age=600; Secure',
    );
  });
});
