import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Book as BookRow, Order as OrderRow } from '@prisma/client';
import {
  orderPrice,
  orderStatusAt,
  type CreateOrderInput,
  type Order,
} from '@wishbook/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Printed-book orders. Payment is a demo (nothing is charged) and the print and
 * delivery stages advance on a timer, ORDER_STAGE_MS per stage.
 */
@Injectable()
export class OrdersService {
  private readonly stageMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.stageMs = Number(config.get('ORDER_STAGE_MS', 20_000));
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const book = await this.prisma.book.findUnique({
      where: { id: input.bookId },
    });
    if (!book) throw new NotFoundException(`book ${input.bookId} not found`);
    if (book.status !== 'done') {
      throw new ConflictException('The book is still being made');
    }
    const price = orderPrice(input.cover, input.quantity, input.city);
    const row = await this.prisma.order.create({
      data: {
        ...input,
        booksKzt: price.books,
        deliveryKzt: price.delivery,
        totalKzt: price.total,
      },
    });
    return this.toDto(row, book);
  }

  async get(id: string): Promise<Order> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!row) throw new NotFoundException(`order ${id} not found`);
    return this.toDto(row, row.book);
  }

  private toDto(row: OrderRow, book: BookRow): Order {
    return {
      id: row.id,
      bookId: row.bookId,
      bookTitle: book.title,
      status: orderStatusAt(Date.now() - row.createdAt.getTime(), this.stageMs),
      recipientName: row.recipientName,
      city: row.city,
      address: row.address,
      cover: row.cover,
      quantity: row.quantity,
      booksKzt: row.booksKzt,
      deliveryKzt: row.deliveryKzt,
      totalKzt: row.totalKzt,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
