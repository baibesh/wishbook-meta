import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PASSWORD_LOGIN_DISABLED } from '@fabulka/shared';
import { createHmac, randomBytes } from 'node:crypto';
import { cookieHeader, sameString as same } from '../common/signed';

export const SESSION_COOKIE = 'admin_session';
const SESSION_MS = 12 * 60 * 60 * 1000;
/** Failed logins allowed per address in a window before it has to wait. */
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED = 10_000;

/**
 * Who may open the admin. The usual way in is Keycloak (realm role `admin`, see AuthService), which
 * calls issue(). The ADMIN_EMAIL / ADMIN_PASSWORD sign-in is an emergency fallback, on only with
 * ADMIN_PASSWORD_LOGIN=true. A session is a signed, expiring token in an httpOnly cookie;
 * ADMIN_SECRET (else AUTH_SECRET) signs it (without one, sessions end when the API restarts, and
 * in production there are no sessions at all).
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly email: string;
  private readonly password: string;
  private readonly secret: string;
  /** False in production without a secret: no admin sessions can be made or accepted. */
  private readonly sessions: boolean;
  /** The email/password sign-in is on (ADMIN_PASSWORD_LOGIN=true). */
  readonly passwordLogin: boolean;
  readonly secureCookie: boolean;
  private readonly failures = new Map<
    string,
    { count: number; since: number }
  >();

  constructor(config: ConfigService) {
    this.email = config.get<string>('ADMIN_EMAIL', '').trim().toLowerCase();
    this.password = config.get('ADMIN_PASSWORD', '');
    const production = config.get('NODE_ENV') === 'production';
    const secret =
      config.get<string>('ADMIN_SECRET', '') ||
      config.get<string>('AUTH_SECRET', '');
    this.secret = secret || randomBytes(32).toString('hex');
    // Without a fixed secret every restart signs the admin out, and a guessable default is worse.
    this.sessions = !production || Boolean(secret);
    // Production runs behind HTTPS; ADMIN_COOKIE_SECURE=false is for a plain-HTTP local run.
    this.secureCookie =
      config.get('ADMIN_COOKIE_SECURE', production ? 'true' : 'false') ===
      'true';
    this.passwordLogin = config.get('ADMIN_PASSWORD_LOGIN', 'false') === 'true';
    if (!this.sessions) {
      this.logger.error(
        'ADMIN_SECRET (or AUTH_SECRET) is not set in production: the admin is off',
      );
    } else if (this.passwordLogin && (!this.email || !this.password)) {
      this.logger.warn(
        'ADMIN_PASSWORD_LOGIN is on but ADMIN_EMAIL or ADMIN_PASSWORD is not set',
      );
    }
  }

  /** The email/password sign-in can be used now. */
  get passwordLoginReady(): boolean {
    return (
      this.passwordLogin &&
      this.sessions &&
      Boolean(this.email && this.password)
    );
  }

  /** Checks the credentials and returns a session token. */
  login(email: string, password: string, ip: string): string {
    if (!this.passwordLogin) {
      throw new NotFoundException({
        code: PASSWORD_LOGIN_DISABLED,
        message: 'Вход по паролю выключен, войдите через Fabulka ID',
      });
    }
    if (!this.passwordLoginReady) {
      throw new ServiceUnavailableException('The admin is not configured');
    }
    const now = Date.now();
    const failed = this.failures.get(ip);
    if (
      failed &&
      now - failed.since < FAILURE_WINDOW_MS &&
      failed.count >= MAX_FAILURES
    ) {
      throw new HttpException(
        'Слишком много попыток, попробуйте позже',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const ok =
      same(email.trim().toLowerCase(), this.email) &&
      same(password, this.password);
    if (!ok) {
      const fresh = !failed || now - failed.since >= FAILURE_WINDOW_MS;
      // Old entries go first, so a flood of addresses cannot grow the map without bound.
      if (this.failures.size >= MAX_TRACKED) {
        for (const [key, entry] of this.failures) {
          if (now - entry.since >= FAILURE_WINDOW_MS) this.failures.delete(key);
        }
        if (this.failures.size >= MAX_TRACKED) this.failures.clear();
      }
      this.failures.set(ip, {
        count: fresh ? 1 : failed.count + 1,
        since: fresh ? now : failed.since,
      });
      throw new UnauthorizedException('Неверная почта или пароль');
    }
    this.failures.delete(ip);
    return this.issue(now);
  }

  /** A session token for someone already checked elsewhere (Keycloak realm role `admin`). */
  issue(now = Date.now()): string {
    if (!this.sessions) {
      throw new ServiceUnavailableException('The admin is not configured');
    }
    const expires = now + SESSION_MS;
    return `${expires}.${this.sign(expires)}`;
  }

  /** True for an unexpired token this service signed. */
  verify(token: string | undefined): boolean {
    if (!token || !this.sessions) return false;
    const [expires, signature] = token.split('.');
    const at = Number(expires);
    if (!signature || !Number.isFinite(at) || at < Date.now()) return false;
    return same(signature, this.sign(at));
  }

  cookie(token: string): string {
    return this.cookieWith(token, SESSION_MS / 1000);
  }

  clearedCookie(): string {
    return this.cookieWith('', 0);
  }

  private cookieWith(value: string, maxAgeSeconds: number): string {
    return cookieHeader(SESSION_COOKIE, value, {
      maxAgeSeconds,
      secure: this.secureCookie,
    });
  }

  private sign(expires: number): string {
    return createHmac('sha256', this.secret)
      .update(`admin.${expires}`)
      .digest('base64url');
  }
}

/** The value of one cookie from a Cookie header. */
export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}
