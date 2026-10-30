import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateOrderSchema,
  type CreateOrderInput,
  type Order,
} from '@fabulka/shared';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body(new ZodPipe(CreateOrderSchema)) body: CreateOrderInput,
    @CurrentClient() client: Client,
  ): Promise<Order> {
    return this.orders.create(body, client.key);
  }

  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentClient() client: Client,
  ): Promise<Order> {
    return this.orders.get(id, client.key);
  }
}
