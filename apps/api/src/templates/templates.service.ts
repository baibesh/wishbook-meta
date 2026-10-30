import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import type { BookTemplate, Prisma } from '@prisma/client';
import {
  LANGUAGES,
  type MethodologySlug,
  Template,
  TemplateQuestion,
  TemplateSummary,
} from '@wishbook/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SEED_TEMPLATES } from './catalog';

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Adds catalog books that are missing; never touches ones that exist. */
  async onModuleInit() {
    const { count } = await this.prisma.bookTemplate.createMany({
      data: SEED_TEMPLATES.map((t, i): Prisma.BookTemplateCreateManyInput => ({
        slug: t.slug,
        title: t.title,
        summary: t.summary,
        ageMin: t.ageMin,
        ageMax: t.ageMax,
        methodology: t.methodology,
        languages: [...LANGUAGES],
        theme: t.theme,
        plot: t.plot,
        questions: t.questions,
        stylePrompt: t.stylePrompt,
        // Covers ship with the web app (apps/web/public/catalog).
        coverUrl: `/catalog/${t.slug}.jpg`,
        sortOrder: i,
      })),
      skipDuplicates: true,
    });
    if (count) this.logger.log(`added ${count} catalog books`);
  }

  async list(): Promise<TemplateSummary[]> {
    const rows = await this.prisma.bookTemplate.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(summary);
  }

  async get(slug: string): Promise<Template> {
    const row = await this.find(slug);
    return { ...summary(row), questions: questions(row) };
  }

  /** The published catalog book, or a 404. */
  async find(slug: string): Promise<BookTemplate> {
    const row = await this.prisma.bookTemplate.findUnique({ where: { slug } });
    if (!row?.published)
      throw new NotFoundException(`книги «${slug}» нет в каталоге`);
    return row;
  }
}

export function questions(row: BookTemplate): TemplateQuestion[] {
  return row.questions as unknown as TemplateQuestion[];
}

function summary(row: BookTemplate): TemplateSummary {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    methodology: row.methodology as MethodologySlug,
    languages: row.languages as TemplateSummary['languages'],
    coverUrl: row.coverUrl,
  };
}
