import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'admin_session';
const SESSION_MS = 12 * 60 * 60 * 1000;
/** Failed logins allowed per address in a window before it has to wait. */
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

/**
 * One admin, configured by ADMIN_EMAIL and ADMIN_PASSWORD. A session is a signed, expiring token
 * in an httpOnly cookie; ADMIN_SECRET signs it (without one, sessions end when the API restarts).
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly email: string;
  private readonly password: string;
  private readonly secret: string;
  readonly secureCookie: boolean;
  private readonly failures = new Map<
    string,
    { count: number; since: number }
  >();

  constructor(config: ConfigService) {
    this.email = config.get<string>('ADMIN_EMAIL', '').trim().toLowerCase();
    this.password = config.get('ADMIN_PASSWORD', '');
    this.secret =
      config.get('ADMIN_SECRET', '') || randomBytes(32).toString('hex');
    this.secureCookie = config.get('ADMIN_COOKIE_SECURE', 'false') === 'true';
    if (!this.email || !this.password) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD is not set: the admin is off',
      );
    }
  }

  /** Checks the credentials and returns a session token. */
  login(email: string, password: string, ip: string): string {
    if (!this.email || !this.password) {
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
      this.failures.set(ip, {
        count: fresh ? 1 : failed.count + 1,
        since: fresh ? now : failed.since,
      });
      throw new UnauthorizedException('Неверная почта или пароль');
    }
    this.failures.delete(ip);
    const expires = now + SESSION_MS;
    return `${expires}.${this.sign(expires)}`;
  }

  /** True for an unexpired token this service signed. */
  verify(token: string | undefined): boolean {
    if (!token || !this.email) return false;
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
    const secure = this.secureCookie ? '; Secure' : '';
    return `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
  }

  private sign(expires: number): string {
    return createHmac('sha256', this.secret)
      .update(`${this.email}.${expires}`)
      .digest('base64url');
  }
}

/** Constant-time string comparison. */
function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
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
