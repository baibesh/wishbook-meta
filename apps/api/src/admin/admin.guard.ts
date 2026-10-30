import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminAuthService,
  readCookie,
  SESSION_COOKIE,
} from './admin-auth.service';

/** Lets through only requests with a valid admin session cookie. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (this.auth.verify(readCookie(request.headers.cookie, SESSION_COOKIE))) {
      return true;
    }
    throw new UnauthorizedException('Войдите в админку');
  }
}
