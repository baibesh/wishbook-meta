import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateBookSchema,
  type Book,
  type CreateBookInput,
} from '@wishbook/shared';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { QuotaService } from '../quota/quota.service';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly books: BooksService,
    private readonly quota: QuotaService,
  ) {}

  @Post()
  async create(
    @Body(new ZodPipe(CreateBookSchema)) body: CreateBookInput,
    @CurrentClient() client: Client,
  ): Promise<Book> {
    await this.quota.assertCanCreate(client.key, client.demoCode);
    return this.books.create(
      body,
      client.key,
      this.quota.isDemo(client.demoCode),
    );
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Book> {
    return this.books.get(id);
  }
}
