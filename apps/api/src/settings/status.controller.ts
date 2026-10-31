import { Controller, Get } from '@nestjs/common';
import type { ServiceStatus } from '@fabulka/shared';
import { SettingsService } from './settings.service';

@Controller('status')
export class StatusController {
  constructor(private readonly settings: SettingsService) {}

  /** Lets the site say up front that new books are paused, before the parent fills in the form. */
  @Get()
  async status(): Promise<ServiceStatus> {
    return { paused: await this.settings.paused() };
  }
}
