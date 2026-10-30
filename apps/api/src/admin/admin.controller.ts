import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  AdminLoginSchema,
  PauseSchema,
  UpdateOrderStatusSchema,
  UpdateTemplateSchema,
  type AdminLogin,
  type UpdateTemplate,
} from '@wishbook/shared';
import type { Response } from 'express';
import type { z } from 'zod';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { OrdersService } from '../orders/orders.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @HttpCode(204)
  login(
    @Body(new ZodPipe(AdminLoginSchema)) body: AdminLogin,
    @CurrentClient() client: Client,
    @Res({ passthrough: true }) response: Response,
  ): void {
    const token = this.auth.login(body.email, body.password, client.ip);
    response.setHeader('Set-Cookie', this.auth.cookie(token));
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.setHeader('Set-Cookie', this.auth.clearedCookie());
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly orders: OrdersService,
  ) {}

  @Get('me')
  me() {
    return { ok: true };
  }

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Post('pause')
  @HttpCode(204)
  pause(@Body(new ZodPipe(PauseSchema)) body: z.infer<typeof PauseSchema>) {
    return this.admin.setPaused(body.paused);
  }

  @Get('books')
  books(@Query('status') status?: string) {
    return this.admin.listBooks(status);
  }

  @Get('books/:id')
  book(@Param('id') id: string) {
    return this.admin.book(id);
  }

  @Delete('books/:id')
  @HttpCode(204)
  deleteBook(@Param('id') id: string) {
    return this.admin.deleteBook(id);
  }

  @Get('orders')
  listOrders() {
    return this.orders.list();
  }

  @Patch('orders/:id')
  setOrderStatus(
    @Param('id') id: string,
    @Body(new ZodPipe(UpdateOrderStatusSchema))
    body: z.infer<typeof UpdateOrderStatusSchema>,
  ) {
    return this.orders.setStatus(id, body.status);
  }

  @Get('templates')
  templates() {
    return this.admin.listTemplates();
  }

  @Get('templates/:slug')
  template(@Param('slug') slug: string) {
    return this.admin.template(slug);
  }

  @Patch('templates/:slug')
  updateTemplate(
    @Param('slug') slug: string,
    @Body(new ZodPipe(UpdateTemplateSchema)) body: UpdateTemplate,
  ) {
    return this.admin.updateTemplate(slug, body);
  }
}
