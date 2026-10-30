import type { ConfigService } from '@nestjs/config';
import { MockGateway } from '../meta/mock.gateway';
import type { PdfService } from '../pdf/pdf.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import { BooksService } from './books.service';

const child = {
  name: 'Арман',
  age: 5,
  gender: 'boy' as const,
  interests: ['футбол'],
  city: 'Астана',
  language: 'ru' as const,
};

describe('BooksService', () => {
  it('survives a book deleted while it is generating', async () => {
    const row = {
      id: 'b1',
      status: 'queued',
      progress: 0,
      title: null,
      heroImagePath: null,
      pages: [],
      pdfPath: null,
      error: null,
      createdAt: new Date(),
    };
    const deleted = Object.assign(new Error('No record was found'), {
      code: 'P2025',
    });
    const updateMany = jest.fn().mockRejectedValue(deleted);
    const prisma = {
      book: {
        create: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockRejectedValue(deleted),
        updateMany,
      },
    } as unknown as PrismaService;
    const config = { get: () => 2 } as unknown as ConfigService;
    const service = new BooksService(
      prisma,
      { url: () => null } as unknown as StorageService,
      {} as PdfService,
      new MockGateway(0),
      config,
    );
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    await service.create(child, 'k', false);
    await new Promise((resolve) => setTimeout(resolve, 20));

    process.off('unhandledRejection', unhandled);
    expect(updateMany).toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });
});
