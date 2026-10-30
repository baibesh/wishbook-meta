import { Controller, Get } from '@nestjs/common';
import { CurrentClient, type Client } from '../common/client';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  /** The visitor's country, so the site can preselect it; null when it is not known. */
  @Get()
  where(@CurrentClient() client: Client): { country: string | null } {
    return { country: this.geo.country(client.ip) };
  }
}
