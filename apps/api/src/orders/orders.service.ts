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
  type AdminOrder,
  type CreateOrderInput,
  type Order,
  type OrderStatus,
} from '@fabulka/shared';
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

  /** Only the browser that made the book can order it. */
  async create(input: CreateOrderInput, clientKey: string): Promise<Order> {
    const book = await this.prisma.book.findUnique({
      where: { id: input.bookId },
    });
    if (book?.clientKey !== clientKey) {
      throw new NotFoundException(`book ${input.bookId} not found`);
    }
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

  /** An order carries a name and address: only the browser that placed it can see it. */
  async get(id: string, clientKey: string): Promise<Order> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { book: true },
    });
    if (row?.book.clientKey !== clientKey) {
      throw new NotFoundException(`order ${id} not found`);
    }
    return this.toDto(row, row.book);
  }

  /** All orders, newest first, with what the admin needs to ship them. */
  async list(): Promise<AdminOrder[]> {
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { book: true },
      take: 200,
    });
    return rows.map((row) => this.adminDto(row, row.book));
  }

  /** Sets the stage by hand; from then on the demo timer no longer moves it. */
  async setStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
    const row = await this.prisma.order
      .update({ where: { id }, data: { status }, include: { book: true } })
      .catch(() => {
        throw new NotFoundException(`order ${id} not found`);
      });
    return this.adminDto(row, row.book);
  }

  private adminDto(row: OrderRow, book: BookRow): AdminOrder {
    return {
      ...this.toDto(row, book),
      phone: row.phone,
      manual: row.status !== null,
    };
  }

  private toDto(row: OrderRow, book: BookRow): Order {
    return {
      id: row.id,
      bookId: row.bookId,
      bookTitle: book.title,
      status:
        (row.status as OrderStatus | null) ??
        orderStatusAt(Date.now() - row.createdAt.getTime(), this.stageMs),
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
