import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VOICE_FAILED,
  VOICE_RATE_LIMITED,
  type VoicePrefill,
  type VoiceRequest,
} from '@fabulka/shared';
import { MODEL_GATEWAY, type ModelGateway } from '../meta/model-gateway';
import { TemplatesService } from '../templates/templates.service';

const HOUR_MS = 60 * 60 * 1000;

/** Turns the parent's recording into form fields. The audio lives only in this request's memory. */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly limiter: HourlyLimiter;

  constructor(
    @Inject(MODEL_GATEWAY) private readonly models: ModelGateway,
    private readonly templates: TemplatesService,
    config: ConfigService,
  ) {
    this.limiter = new HourlyLimiter(
      Number(config.get('VOICE_HOURLY_LIMIT', 20)),
    );
  }

  async prefill(
    wav: Buffer,
    { language, template }: VoiceRequest,
    clientKey: string,
  ): Promise<VoicePrefill> {
    // A 404 for an unknown book comes before the recording counts against the visitor.
    const questions = template
      ? (await this.templates.get(template, language)).questions
      : undefined;
    if (!this.limiter.take(clientKey)) {
      throw new HttpException(
        {
          code: VOICE_RATE_LIMITED,
          message: 'Слишком много записей подряд, попробуйте через час',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    try {
      const heard = await this.models.transcribe(wav, language);
      if (!heard.text) return { transcript: '', child: {} };
      const { fields, costUsd } = await this.models.extractPrefill({
        transcript: heard.text,
        language,
        questions,
        theme: !template,
      });
      this.logger.log(
        `voice prefill: $${(heard.costUsd + costUsd).toFixed(4)}`,
      );
      return { transcript: heard.text, ...fields };
    } catch (error) {
      this.logger.error('voice prefill failed', error);
      throw new HttpException(
        {
          code: VOICE_FAILED,
          message: 'Не получилось распознать запись, попробуйте ещё раз',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

/** At most `limit` uses per key in any sliding hour; kept in memory, so it resets on restart. */
export class HourlyLimiter {
  private readonly uses = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly now = () => Date.now(),
  ) {}

  take(key: string): boolean {
    const now = this.now();
    const recent = (this.uses.get(key) ?? []).filter((t) => now - t < HOUR_MS);
    if (recent.length >= this.limit) {
      this.uses.set(key, recent);
      return false;
    }
    recent.push(now);
    this.uses.set(key, recent);
    if (this.uses.size > 10_000) this.forgetIdle(now);
    return true;
  }

  /** Drops keys with no use in the last hour, so the map does not grow without bound. */
  private forgetIdle(now: number) {
    for (const [key, times] of this.uses) {
      if (times.every((t) => now - t >= HOUR_MS)) this.uses.delete(key);
    }
  }
}
