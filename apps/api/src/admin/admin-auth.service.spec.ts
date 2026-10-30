import type { ConfigService } from '@nestjs/config';
import { AdminAuthService, readCookie } from './admin-auth.service';

function auth(env: Record<string, string> = {}) {
  const values: Record<string, string> = {
    ADMIN_EMAIL: 'Admin@Fabulka.com',
    ADMIN_PASSWORD: 'correct horse',
    ADMIN_SECRET: 'test-secret',
    ...env,
  };
  return new AdminAuthService({
    get: (key: string, fallback: string) => values[key] ?? fallback,
  } as unknown as ConfigService);
}

describe('AdminAuthService', () => {
  it('signs in with the configured email (any case) and password', () => {
    const service = auth();
    const token = service.login(
      'admin@fabulka.com',
      'correct horse',
      '1.1.1.1',
    );
    expect(service.verify(token)).toBe(true);
  });

  it('refuses a wrong password', () => {
    expect(() => auth().login('admin@fabulka.com', 'wrong', '1.1.1.1')).toThrow(
      'Неверная почта или пароль',
    );
  });

  it('rejects a tampered or expired token', () => {
    const service = auth();
    const token = service.login(
      'admin@fabulka.com',
      'correct horse',
      '1.1.1.1',
    );
    const [expires, signature] = token.split('.');
    expect(service.verify(`${Number(expires) + 1}.${signature}`)).toBe(false);
    expect(service.verify(`${Date.now() - 1}.${signature}`)).toBe(false);
    expect(service.verify(undefined)).toBe(false);
  });

  it('does not accept a token signed with another secret', () => {
    const token = auth().login('admin@fabulka.com', 'correct horse', '1.1.1.1');
    expect(auth({ ADMIN_SECRET: 'other' }).verify(token)).toBe(false);
  });

  it('makes an address wait after ten wrong passwords', () => {
    const service = auth();
    for (let i = 0; i < 10; i++) {
      expect(() =>
        service.login('admin@fabulka.com', 'nope', '2.2.2.2'),
      ).toThrow();
    }
    expect(() =>
      service.login('admin@fabulka.com', 'correct horse', '2.2.2.2'),
    ).toThrow('Слишком много попыток');
    expect(() =>
      service.login('admin@fabulka.com', 'correct horse', '3.3.3.3'),
    ).not.toThrow();
  });

  it('is off without credentials', () => {
    expect(() =>
      auth({ ADMIN_PASSWORD: '' }).login('admin@fabulka.com', '', '1.1.1.1'),
    ).toThrow('not configured');
  });

  it('is Secure by default in production and off there without a secret', () => {
    const prod = auth({ NODE_ENV: 'production' });
    expect(prod.cookie('t')).toContain('Secure');
    expect(() =>
      auth({ NODE_ENV: 'production', ADMIN_SECRET: '' }).login(
        'admin@fabulka.com',
        'correct horse',
        '1.1.1.1',
      ),
    ).toThrow('not configured');
  });

  it('sets an httpOnly cookie, Secure only when asked', () => {
    expect(auth().cookie('t')).toContain('HttpOnly');
    expect(auth().cookie('t')).not.toContain('Secure');
    expect(auth({ ADMIN_COOKIE_SECURE: 'true' }).cookie('t')).toContain(
      'Secure',
    );
  });
});

describe('readCookie', () => {
  it('finds one cookie among several', () => {
    expect(readCookie('a=1; admin_session=x.y; b=2', 'admin_session')).toBe(
      'x.y',
    );
    expect(readCookie(undefined, 'admin_session')).toBeUndefined();
  });
});
