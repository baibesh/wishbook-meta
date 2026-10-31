import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  CreateBookSchema,
  GENERATION_PAUSED,
  type Book,
  type CreateBookInput,
  type ExampleBook,
  type MyBook,
} from '@fabulka/shared';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { GeoService } from '../geo/geo.service';
import { QuotaService } from '../quota/quota.service';
import { SettingsService } from '../settings/settings.service';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly books: BooksService,
    private readonly quota: QuotaService,
    private readonly settings: SettingsService,
    private readonly geo: GeoService,
  ) {}

  @Post()
  async create(
    @Body(new ZodPipe(CreateBookSchema)) body: CreateBookInput,
    @CurrentClient() client: Client,
  ): Promise<Book> {
    if (await this.settings.paused()) {
      throw new HttpException(
        {
          code: GENERATION_PAUSED,
          message:
            'Создание книг временно приостановлено, загляните чуть позже',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    await this.quota.assertCanCreate(client.key, client.demoCode);
    return this.books.create(
      body,
      client.key,
      this.quota.isDemo(client.demoCode),
      this.geo.country(client.ip),
    );
  }

  /** "My books": everything made from this browser (its anonymous key). */
  @Get()
  mine(@CurrentClient() client: Client): Promise<MyBook[]> {
    return this.books.listMine(client.key);
  }

  /** Books for every visitor to open; declared before :id so "examples" is not taken for an id. */
  @Get('examples')
  examples(): Promise<ExampleBook[]> {
    return this.books.listExamples();
  }

  @Post(':id/print-interest')
  @HttpCode(204)
  printInterest(
    @Param('id') id: string,
    @CurrentClient() client: Client,
  ): Promise<void> {
    return this.books.recordPrintInterest(id, this.geo.country(client.ip));
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Book> {
    return this.books.get(id);
  }
}
