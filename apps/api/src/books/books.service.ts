import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Book as BookRow, BookStatus, Prisma } from '@prisma/client';
import {
  answersProblem,
  defaultMethodology,
  progressFor,
  type Book,
  type ChildProfile,
  type CreateBookInput,
  type Language,
  type MethodologySlug,
} from '@wishbook/shared';
import { basename } from 'node:path';
import { MODEL_GATEWAY, type ModelGateway } from '../meta/model-gateway';
import type { StoryBrief } from '../meta/prompts';
import { questions, TemplatesService } from '../templates/templates.service';
import { PdfService } from '../pdf/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

/** A page as stored in Book.pages. */
interface StoredPage {
  page: number;
  text: string;
  scenePrompt: string;
  imagePath: string | null;
}

/** The row with the catalog book slug the DTO needs. */
export type BookWithTemplate = BookRow & { template: { slug: string } | null };
export const withTemplate = { template: { select: { slug: true } } } as const;

/** What generation needs besides the story brief. */
interface Job {
  brief: StoryBrief;
  /** Art style of a catalog book; the default one otherwise. */
  style?: string;
}

/** Page illustrations generated at once; each chains from the hero sheet, not from each other. */
const PAGE_CONCURRENCY = 4;

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);
  private readonly pageCount: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
    private readonly templates: TemplatesService,
    @Inject(MODEL_GATEWAY) private readonly models: ModelGateway,
    config: ConfigService,
  ) {
    this.pageCount = Number(config.get('PAGE_COUNT', 10));
  }

  async create(
    input: CreateBookInput,
    clientKey: string,
    demo: boolean,
    country: string | null = null,
  ): Promise<Book> {
    const { child } = input;
    const job = input.template
      ? await this.catalogJob(input.template, input)
      : {
          brief: {
            child,
            pageCount: this.pageCount,
            methodology: input.methodology ?? defaultMethodology(child.age),
            theme: input.theme,
          },
        };
    const row = await this.prisma.book.create({
      data: {
        child,
        language: child.language,
        methodology: job.brief.methodology,
        theme: job.brief.theme,
        template: input.template
          ? { connect: { slug: input.template } }
          : undefined,
        answers: input.answers,
        clientKey,
        demo,
        country,
      },
      include: withTemplate,
    });
    // Generation runs in the background; the client polls GET /books/:id.
    void this.generate(row.id, job).catch((error: unknown) =>
      this.fail(row.id, error),
    );
    return this.toDto(row);
  }

  async get(id: string): Promise<Book> {
    const row = await this.prisma.book.findUnique({
      where: { id },
      include: withTemplate,
    });
    if (!row) throw new NotFoundException(`book ${id} not found`);
    return this.toDto(row);
  }

  /** A catalog book: its method, plot, art style and the parent's answers. */
  private async catalogJob(slug: string, input: CreateBookInput): Promise<Job> {
    const template = await this.templates.find(slug);
    const { child } = input;
    if (child.age < template.ageMin || child.age > template.ageMax) {
      throw new BadRequestException(
        `«${template.title}» — для возраста ${template.ageMin}–${template.ageMax} лет`,
      );
    }
    const asked = questions(template);
    const answers = input.answers ?? {};
    const problem = answersProblem(asked, answers);
    if (problem) throw new BadRequestException(problem);
    return {
      brief: {
        child,
        pageCount: this.pageCount,
        methodology: template.methodology as MethodologySlug,
        theme: template.theme,
        template: {
          title: template.title,
          plot: template.plot as string[],
          answers: asked
            .filter((q) => answers[q.key]?.trim())
            .map((q) => ({ question: q.label, answer: answers[q.key].trim() })),
        },
      },
      style: template.stylePrompt ?? undefined,
    };
  }

  private async generate(id: string, { brief, style }: Job): Promise<void> {
    const { child } = brief;
    let costUsd = 0;

    await this.stage(id, 'story');
    const { story, costUsd: storyCost } = await this.models.writeStory(brief);
    costUsd += storyCost;
    const pages: StoredPage[] = story.pages.map((p) => ({
      page: p.page,
      text: p.text,
      scenePrompt: p.scene_prompt,
      imagePath: null,
    }));
    await this.update(id, 'story', {
      title: story.title,
      heroDescription: story.hero_description,
      pages: json(pages),
      talkQuestions: story.talk_questions,
      costUsd,
    });

    await this.stage(id, 'hero');
    const hero = await this.models.drawHero(story.hero_description, style);
    costUsd += hero.costUsd;
    const heroImagePath = await this.storage.save(
      `books/${id}/hero.${hero.ext}`,
      hero.data,
    );
    await this.update(id, 'hero', {
      heroResponseId: hero.ref,
      heroImagePath,
      costUsd,
    });

    // The pet gets its own sheet too, or it changes breed and color between pages.
    let anchorRef = hero.ref;
    const withPet = story.pet_description !== null;
    if (story.pet_description) {
      const pet = await this.models.drawPet(
        story.pet_description,
        hero.ref,
        style,
      );
      costUsd += pet.costUsd;
      const petImagePath = await this.storage.save(
        `books/${id}/pet.${pet.ext}`,
        pet.data,
      );
      anchorRef = pet.ref;
      await this.update(id, 'hero', { petImagePath, costUsd });
    }

    await this.update(id, 'pages', {
      progress: progressFor('pages', 0, pages.length),
    });
    let done = 0;
    await eachLimit(pages, PAGE_CONCURRENCY, async (page) => {
      const image = await this.models.drawPage(
        page.scenePrompt,
        anchorRef,
        withPet && petInScene(page.scenePrompt),
        style,
      );
      costUsd += image.costUsd;
      page.imagePath = await this.storage.save(
        `books/${id}/page-${page.page}.${image.ext}`,
        image.data,
      );
      done++;
      await this.update(id, 'pages', {
        pages: json(pages),
        costUsd,
        progress: progressFor('pages', done, pages.length),
      });
    });

    await this.update(id, 'pdf', {
      pages: json(pages),
      costUsd,
      progress: progressFor('pdf'),
    });
    // Images sit next to book.html, so the template takes bare file names.
    const local = (path: string | null) => (path ? basename(path) : null);
    const pdfPath = await this.pdf.render(id, {
      title: story.title,
      childName: child.name,
      language: child.language,
      coverImage: local(heroImagePath),
      pages: pages.map((p) => ({
        page: p.page,
        text: p.text,
        image: local(p.imagePath),
      })),
      talkQuestions: story.talk_questions,
    });
    await this.update(id, 'done', { pdfPath, progress: 100 });
    this.logger.log(
      `book ${id} done: ${pages.length} pages, $${costUsd.toFixed(3)}`,
    );
  }

  private stage(id: string, status: BookStatus) {
    return this.update(id, status, { progress: progressFor(status) });
  }

  private update(id: string, status: BookStatus, data: Prisma.BookUpdateInput) {
    return this.prisma.book.update({
      where: { id },
      data: { ...data, status },
    });
  }

  /** Never throws: a background generation must not take the process down with it. */
  private async fail(id: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`book ${id} failed: ${message}`);
    try {
      // updateMany: the book may have been deleted while it was generating.
      await this.prisma.book.updateMany({
        where: { id },
        data: { status: 'failed', error: message.slice(0, 1000) },
      });
    } catch (problem) {
      this.logger.error(`book ${id}: could not record the failure`, problem);
    }
  }

  toDto(row: BookWithTemplate): Book {
    const pages = row.pages as unknown as StoredPage[];
    return {
      id: row.id,
      status: row.status,
      progress: row.progress,
      title: row.title,
      language: row.language as Language,
      childName: (row.child as unknown as ChildProfile).name,
      methodology: row.methodology as MethodologySlug,
      template: row.template?.slug ?? null,
      talkQuestions: row.talkQuestions as string[],
      heroImageUrl: this.storage.url(row.heroImagePath),
      pages: pages.map((p) => ({
        page: p.page,
        text: p.text,
        imageUrl: this.storage.url(p.imagePath),
      })),
      pdfUrl: this.storage.url(row.pdfPath),
      error: row.error,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

/** Pointing Muse Image at the pet sheet on every page draws the pet into scenes it is not in. */
export function petInScene(scenePrompt: string): boolean {
  return /\bthe pet\b/i.test(scenePrompt);
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Runs fn over items with at most `limit` in flight. */
async function eachLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}
