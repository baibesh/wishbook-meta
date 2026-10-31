import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailContent } from './templates';

/** A mail kept in memory when there is no RESEND_API_KEY (dev, E2E). */
export interface StoredMail extends MailContent {
  to: string;
  at: string;
}

/** Mails kept in memory at most. */
const KEEP = 50;
const SEND_TIMEOUT_MS = 10_000;

/**
 * Transactional email through Resend's HTTP API. Without RESEND_API_KEY nothing is sent: the mail
 * is logged and the last few are kept in memory (GET /api/test/mails with AUTH_MOCK=true).
 * Sending never throws: a mail that fails is logged and the request that caused it still succeeds.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly from: string;
  private readonly kept: StoredMail[] = [];
  readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY', '');
    this.from = config.get<string>(
      'MAIL_FROM',
      'Fabulka <noreply@fabulka.com>',
    );
    this.publicUrl = config
      .get<string>('PUBLIC_URL', 'http://localhost:3000')
      .replace(/\/+$/, '');
    if (!this.apiKey) {
      this.logger.log('RESEND_API_KEY is not set: emails are only logged');
    }
  }

  async send(to: string, mail: MailContent): Promise<void> {
    if (!to) return;
    if (!this.apiKey) {
      this.kept.unshift({ ...mail, to, at: new Date().toISOString() });
      this.kept.splice(KEEP);
      this.logger.log(`email not sent (no RESEND_API_KEY): "${mail.subject}"`);
      return;
    }
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      if (!response.ok) {
        const detail = (await response.text().catch(() => '')).slice(0, 200);
        throw new Error(`Resend answered ${response.status} ${detail}`);
      }
    } catch (error) {
      this.logger.error(
        `email "${mail.subject}" failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** The kept mails, newest first. */
  recent(): StoredMail[] {
    return [...this.kept];
  }
}
