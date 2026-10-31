import { Body, Controller, Get, Post } from '@nestjs/common';
import { PurchaseSchema, type Purchase, type Quota } from '@fabulka/shared';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { QuotaService } from './quota.service';

@Controller('quota')
export class QuotaController {
  constructor(private readonly quota: QuotaService) {}

  @Get()
  get(@CurrentClient() client: Client): Promise<Quota> {
    return this.quota.quota(client.key, client.demoCode);
  }

  /** Demo checkout for one more book of the given kind: nothing is charged. */
  @Post('purchase')
  purchase(
    @CurrentClient() client: Client,
    @Body(new ZodPipe(PurchaseSchema)) body: Purchase,
  ): Promise<Quota> {
    return this.quota.buyBook(client.key, body.kind);
  }
}
