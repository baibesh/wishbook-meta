import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import type { BookTemplate, Prisma } from '@prisma/client';
import {
  LANGUAGES,
  type Language,
  type MethodologySlug,
  type Template,
  type TemplateQuestion,
  type TemplateSummary,
  type TemplateTranslation,
} from '@fabulka/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SEED_TEMPLATES } from './catalog';
import { SEED_TRANSLATIONS } from './catalog-i18n';

type Translations = Partial<Record<Language, TemplateTranslation>>;

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds catalog books that are missing and translations to books that have none; never
   * overwrites what the admin has changed.
   */
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
        translations: SEED_TRANSLATIONS[t.slug] ?? {},
        sortOrder: i,
      })),
      skipDuplicates: true,
    });
    if (count) this.logger.log(`added ${count} catalog books`);
    for (const [slug, translations] of Object.entries(SEED_TRANSLATIONS)) {
      await this.prisma.bookTemplate.updateMany({
        where: { slug, translations: { equals: {} } },
        data: { translations },
      });
    }
  }

  async list(lang: Language = 'ru'): Promise<TemplateSummary[]> {
    const rows = await this.prisma.bookTemplate.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => summary(row, lang));
  }

  async get(slug: string, lang: Language = 'ru'): Promise<Template> {
    const row = await this.find(slug);
    return { ...summary(row, lang), questions: localizedQuestions(row, lang) };
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

function translation(
  row: BookTemplate,
  lang: Language,
): TemplateTranslation | undefined {
  return lang === 'ru' ? undefined : (row.translations as Translations)[lang];
}

function localizedQuestions(
  row: BookTemplate,
  lang: Language,
): TemplateQuestion[] {
  const text = translation(row, lang)?.questions ?? {};
  return questions(row).map((q) => ({
    ...q,
    label: text[q.key]?.label ?? q.label,
    placeholder: text[q.key]?.placeholder ?? q.placeholder,
    options: text[q.key]?.options ?? q.options,
  }));
}

/**
 * The questions with every language's options allowed, so an answer picked in the Kazakh or
 * English interface passes the same check as a Russian one.
 */
export function questionsInAnyLanguage(row: BookTemplate): TemplateQuestion[] {
  const translations = Object.values(row.translations as Translations);
  return questions(row).map((q) => ({
    ...q,
    options: q.options && [
      ...q.options,
      ...translations.flatMap((t) => t?.questions[q.key]?.options ?? []),
    ],
  }));
}

function summary(row: BookTemplate, lang: Language): TemplateSummary {
  const text = translation(row, lang);
  return {
    slug: row.slug,
    title: text?.title ?? row.title,
    summary: text?.summary ?? row.summary,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    methodology: row.methodology as MethodologySlug,
    languages: row.languages as TemplateSummary['languages'],
    coverUrl: row.coverUrl,
  };
}
