import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';
import { BooksController } from './books/books.controller';
import { BooksService } from './books/books.service';
import { MetaModule } from './meta/meta.module';
import { PrismaModule } from './prisma/prisma.service';
import { StorageModule } from './storage/storage.service';

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
    MetaModule,
  ],
  controllers: [HealthController, BooksController],
  providers: [BooksService],
})
export class AppModule {}
