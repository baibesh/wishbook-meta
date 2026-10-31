import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServiceStatus } from '@fabulka/shared';
import { SettingsService } from './settings.service';

@Controller('status')
export class StatusController {
  private readonly voice: boolean;

  constructor(
    private readonly settings: SettingsService,
    config: ConfigService,
  ) {
    this.voice = voiceEnabled(config);
  }

  /** Lets the site say up front that new books are paused, before the parent fills in the form. */
  @Get()
  async status(): Promise<ServiceStatus> {
    return { paused: await this.settings.paused(), voice: this.voice };
  }
}

/** Voice input (POST /voice) is off unless VOICE_INPUT=true. */
export function voiceEnabled(config: ConfigService): boolean {
  return config.get<string>('VOICE_INPUT') === 'true';
}
