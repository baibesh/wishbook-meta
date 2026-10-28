import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
} from '@nestjs/common';
import {
  CreateBookSchema,
  type Book,
  type CreateBookInput,
} from '@wishbook/shared';
import { ZodPipe } from '../common/zod.pipe';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Post()
  create(
    @Body(new ZodPipe(CreateBookSchema)) body: CreateBookInput,
    @Headers('x-client-key') clientKey: string | undefined,
    @Ip() ip: string,
  ): Promise<Book> {
    return this.books.create(body.child, clientKey || ip);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Book> {
    return this.books.get(id);
  }
}
