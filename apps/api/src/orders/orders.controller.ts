import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateOrderSchema,
  type CreateOrderInput,
  type Order,
} from '@wishbook/shared';
import { ZodPipe } from '../common/zod.pipe';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body(new ZodPipe(CreateOrderSchema)) body: CreateOrderInput,
  ): Promise<Order> {
    return this.orders.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Order> {
    return this.orders.get(id);
  }
}
