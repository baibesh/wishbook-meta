import { Controller, Get, Post } from '@nestjs/common';
import type { Quota } from '@fabulka/shared';
import { CurrentClient, type Client } from '../common/client';
import { QuotaService } from './quota.service';

@Controller('quota')
export class QuotaController {
  constructor(private readonly quota: QuotaService) {}

  @Get()
  get(@CurrentClient() client: Client): Promise<Quota> {
    return this.quota.quota(client.key, client.demoCode);
  }

  /** Demo checkout for one more book: nothing is charged. */
  @Post('purchase')
  purchase(@CurrentClient() client: Client): Promise<Quota> {
    return this.quota.buyBook(client.key);
  }
}
