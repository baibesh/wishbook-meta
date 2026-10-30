import type { ConfigService } from '@nestjs/config';
import { MockGateway } from '../meta/mock.gateway';
import type { PdfService } from '../pdf/pdf.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import { SEED_TEMPLATES } from '../templates/catalog';
import type { TemplatesService } from '../templates/templates.service';
import { BooksService, petInScene } from './books.service';

const child = {
  name: 'Арман',
  age: 5,
  gender: 'boy' as const,
  interests: ['футбол'],
  city: 'Астана',
  language: 'ru' as const,
};

const kindergarten = SEED_TEMPLATES.find(
  (t) => t.slug === 'first-day-kindergarten',
)!;

function makeService(prisma: unknown, models = new MockGateway(0)) {
  const templates = {
    find: jest.fn().mockResolvedValue({
      ...kindergarten,
      stylePrompt: null,
      published: true,
    }),
  } as unknown as TemplatesService;
  return new BooksService(
    prisma as PrismaService,
    { url: () => null } as unknown as StorageService,
    {} as PdfService,
    templates,
    models,
    { get: () => 2 } as unknown as ConfigService,
  );
}

describe('BooksService', () => {
  it('survives a book deleted while it is generating', async () => {
    const row = {
      id: 'b1',
      status: 'queued',
      child,
      language: 'ru',
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
    const service = makeService({
      book: {
        create: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockRejectedValue(deleted),
        updateMany,
      },
    });
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    await service.create({ child }, 'k', false);
    await new Promise((resolve) => setTimeout(resolve, 20));

    process.off('unhandledRejection', unhandled);
    expect(updateMany).toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  describe('a catalog book', () => {
    const row = {
      id: 'b2',
      status: 'queued',
      child,
      language: 'ru',
      progress: 0,
      methodology: 'social-story',
      talkQuestions: [],
      template: { slug: kindergarten.slug },
      pages: [],
      createdAt: new Date(),
    };
    const answers = { toy: 'зайка', goodbye: 'машем в окно' };

    it('writes the story from its plot, method and the answers', async () => {
      const models = new MockGateway(0);
      const writeStory = jest
        .spyOn(models, 'writeStory')
        .mockRejectedValue(new Error('stop after the story'));
      const create = jest
        .fn<Promise<typeof row>, [{ data: unknown }]>()
        .mockResolvedValue(row);
      const service = makeService(
        {
          book: {
            create,
            update: jest.fn().mockResolvedValue(row),
            updateMany: jest.fn(),
          },
        },
        models,
      );

      const book = await service.create(
        { child, template: kindergarten.slug, answers },
        'k',
        false,
      );
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(book.template).toBe(kindergarten.slug);
      expect(create.mock.calls[0][0].data).toMatchObject({
        methodology: 'social-story',
        answers,
        template: { connect: { slug: kindergarten.slug } },
      });
      const brief = writeStory.mock.calls[0][0];
      expect(brief.methodology).toBe('social-story');
      expect(brief.template?.plot).toEqual(kindergarten.plot);
      expect(brief.template?.answers).toEqual([
        { question: 'Какую игрушку возьмёт с собой?', answer: 'зайка' },
        { question: 'Как вы прощаетесь утром?', answer: 'машем в окно' },
      ]);
    });

    it('refuses a child outside its age range', async () => {
      const service = makeService({ book: {} });
      await expect(
        service.create(
          { child: { ...child, age: 9 }, template: kindergarten.slug, answers },
          'k',
          false,
        ),
      ).rejects.toThrow('для возраста 2–6 лет');
    });

    it('refuses a missing required answer or an unknown choice', async () => {
      const service = makeService({ book: {} });
      await expect(
        service.create(
          { child, template: kindergarten.slug, answers: { toy: 'зайка' } },
          'k',
          false,
        ),
      ).rejects.toThrow('Как вы прощаетесь утром?');
      await expect(
        service.create(
          {
            child,
            template: kindergarten.slug,
            answers: { ...answers, goodbye: 'кричим' },
          },
          'k',
          false,
        ),
      ).rejects.toThrow('нет такого варианта');
    });
  });
});

describe('petInScene', () => {
  it('draws the pet only where the scene names it', () => {
    expect(petInScene('the hero and the pet run in the park')).toBe(true);
    expect(petInScene('The pet sleeps at home')).toBe(true);
    expect(petInScene('the hero paints at a kindergarten table')).toBe(false);
    expect(petInScene('the hero sees a carpet')).toBe(false);
  });
});
