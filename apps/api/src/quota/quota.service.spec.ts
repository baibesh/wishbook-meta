import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { QuotaService } from './quota.service';

function makeService(prisma: unknown) {
  const config = {
    get: (key: string, fallback?: unknown) =>
      key === 'FREE_BOOKS' ? 3 : fallback,
  };
  return new QuotaService(
    prisma as PrismaService,
    config as unknown as ConfigService,
  );
}

/** A visitor with two books made and the purchases recorded so far. */
function prismaWith(credits: { books: number; priceKzt: number }[] = []) {
  const create = jest.fn(({ data }: { data: (typeof credits)[number] }) => {
    credits.push(data);
    return Promise.resolve(data);
  });
  return {
    create,
    prisma: {
      book: { count: jest.fn().mockResolvedValue(2) },
      credit: {
        create,
        aggregate: jest.fn(() =>
          Promise.resolve({
            _sum: { books: credits.reduce((sum, c) => sum + c.books, 0) },
          }),
        ),
      },
    },
  };
}

describe('QuotaService.buyBook', () => {
  it('records a catalog book at the catalog price', async () => {
    const { prisma, create } = prismaWith();
    const quota = await makeService(prisma).buyBook('k', 'template');

    expect(create).toHaveBeenCalledWith({
      data: { clientKey: 'k', books: 1, priceKzt: 1900 },
    });
    expect(quota).toMatchObject({ used: 2, limit: 4, remaining: 2 });
  });

  it('records a story of your own at its higher price', async () => {
    const { prisma, create } = prismaWith();
    await makeService(prisma).buyBook('k', 'custom');

    expect(create).toHaveBeenCalledWith({
      data: { clientKey: 'k', books: 1, priceKzt: 2900 },
    });
  });
});
