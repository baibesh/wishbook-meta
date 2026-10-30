import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type CountryResponse, Reader } from 'maxmind';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RESTRICTED_COUNTRIES } from './restricted';

/** Which country a visitor is in, from the DB-IP country database (`pnpm geoip`). */
@Injectable()
export class GeoService implements OnModuleInit {
  private readonly logger = new Logger(GeoService.name);
  readonly enabled: boolean;
  private readonly dbPath: string;
  private reader: Reader<CountryResponse> | null = null;

  constructor(config: ConfigService) {
    this.enabled = config.get('GEO_BLOCK', 'false') === 'true';
    this.dbPath = resolve(config.get('GEOIP_DB', './geoip/country.mmdb'));
  }

  onModuleInit() {
    if (!this.enabled) return;
    // Fails the start rather than serving everyone when blocking is on and the database is missing.
    this.reader = new Reader<CountryResponse>(readFileSync(this.dbPath));
    this.logger.log(`geo block on (${this.dbPath})`);
  }

  /** ISO country code, or null for private addresses and unknown ones. */
  country(ip: string): string | null {
    return (
      this.reader?.get(ip.replace(/^::ffff:/, ''))?.country?.iso_code ?? null
    );
  }

  /** The restricted country the IP is in, or null when the visitor may use the service. */
  restricted(ip: string): string | null {
    if (!this.enabled) return null;
    const country = this.country(ip);
    return country && country in RESTRICTED_COUNTRIES ? country : null;
  }
}
