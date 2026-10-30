import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';
import { AdminAuthService } from './admin/admin-auth.service';
import { AdminAuthController, AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { BooksController } from './books/books.controller';
import { BooksService } from './books/books.service';
import { GeoController } from './geo/geo.controller';
import { GeoGuard } from './geo/geo.guard';
import { GeoService } from './geo/geo.service';
import { MetaModule } from './meta/meta.module';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { PdfModule } from './pdf/pdf.service';
import { PrismaModule } from './prisma/prisma.service';
import { QuotaController } from './quota/quota.controller';
import { QuotaService } from './quota/quota.service';
import { SettingsService } from './settings/settings.service';
import { StorageModule } from './storage/storage.service';
import { TemplatesController } from './templates/templates.controller';
import { ToysController } from './toy/toys.controller';
import { TemplatesService } from './templates/templates.service';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: resolve(process.env.STORAGE_DIR ?? './storage'),
      serveRoot: '/files',
      serveStaticOptions: { fallthrough: false },
    }),
    PrismaModule,
    StorageModule,
    PdfModule,
    MetaModule,
  ],
  controllers: [
    HealthController,
    BooksController,
    QuotaController,
    OrdersController,
    TemplatesController,
    GeoController,
    ToysController,
    AdminAuthController,
    AdminController,
  ],
  providers: [
    GeoService,
    { provide: APP_GUARD, useClass: GeoGuard },
    BooksService,
    QuotaService,
    OrdersService,
    TemplatesService,
    SettingsService,
    AdminAuthService,
    AdminService,
  ],
})
export class AppModule {}
