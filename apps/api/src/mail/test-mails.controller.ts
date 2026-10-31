import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MailService, type StoredMail } from './mail.service';

/** For E2E flows only (AUTH_MOCK=true, never in production): the mails that were not sent. */
@Controller('test')
export class TestMailsController {
  constructor(
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  @Get('mails')
  mails(@Query('to') to?: string): StoredMail[] {
    if (!this.auth.mock) throw new NotFoundException();
    const mails = this.mail.recent();
    return to
      ? mails.filter((m) => m.to.toLowerCase() === to.trim().toLowerCase())
      : mails;
  }
}
