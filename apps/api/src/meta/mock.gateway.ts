import type { Language, Story } from '@wishbook/shared';
import type {
  GeneratedImage,
  GeneratedStory,
  ModelGateway,
} from './model-gateway';
import type { StoryBrief } from './prompts';

const COLORS = [
  '#F9D9A8',
  '#BFE3D0',
  '#C9D7F2',
  '#F5C6D6',
  '#E2D4F0',
  '#FCE9A4',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function placeholder(label: string, color: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">` +
      `<rect width="768" height="768" fill="${color}"/>` +
      `<circle cx="384" cy="330" r="120" fill="#ffffff" opacity="0.7"/>` +
      `<text x="384" y="560" font-family="sans-serif" font-size="44" text-anchor="middle" fill="#3b3b3b">${escapeXml(label)}</text>` +
      `</svg>`,
  );
}

const MOCK_TEXT: Record<
  Language,
  {
    title: (name: string) => string;
    page: (n: number, name: string, city: string) => string;
    questions: string[];
  }
> = {
  ru: {
    title: (name) => `${name} и звёздное путешествие`,
    page: (n, name, city) =>
      `Страница ${n}. ${name} отправляется в новое приключение в городе ${city}.`,
    questions: [
      'Что случилось в книге?',
      'Кого ты видишь на картинке?',
      'А что бы сделал ты?',
    ],
  },
  kk: {
    title: (name) => `${name} және жұлдызды сапар`,
    page: (n, name, city) =>
      `${n}-бет. ${name} ${city} қаласында жаңа шытырман оқиғаны бастайды.`,
    questions: [
      'Кітапта не болды?',
      'Суретте кімді көріп тұрсың?',
      'Сен не істер едің?',
    ],
  },
  en: {
    title: (name) => `${name} and the Starry Journey`,
    page: (n, name, city) =>
      `Page ${n}. ${name} sets off on a new adventure in ${city}.`,
    questions: [
      'What happened in the book?',
      'Who do you see in the picture?',
      'What would you do?',
    ],
  },
};

/** Canned model output: no network, no cost, same result every run. */
export class MockGateway implements ModelGateway {
  constructor(private readonly delayMs: number) {}

  async writeStory({
    child,
    pageCount,
    template,
  }: StoryBrief): Promise<GeneratedStory> {
    await sleep(this.delayMs);
    const text = MOCK_TEXT[child.language];
    const story: Story = {
      title: template
        ? `${child.name}: ${template.title}`
        : text.title(child.name),
      hero_description: `a ${child.age}-year-old ${child.gender} with dark hair, yellow raincoat, red boots`,
      pet_description: child.pet ? 'a small ginger cat with white paws' : null,
      pages: Array.from({ length: pageCount }, (_, i) => ({
        page: i + 1,
        text: text.page(i + 1, child.name, child.city),
        scene_prompt: `the hero exploring ${child.city}, scene ${i + 1}`,
      })),
      talk_questions: text.questions,
    };
    return { story, costUsd: 0 };
  }

  async drawHero(): Promise<GeneratedImage> {
    await sleep(this.delayMs);
    return {
      data: placeholder('hero', '#FFFFFF'),
      ext: 'svg',
      ref: 'mock-hero',
      costUsd: 0,
    };
  }

  async drawPet(): Promise<GeneratedImage> {
    await sleep(this.delayMs);
    return {
      data: placeholder('pet', '#FFFFFF'),
      ext: 'svg',
      ref: 'mock-pet',
      costUsd: 0,
    };
  }

  async drawPage(scenePrompt: string): Promise<GeneratedImage> {
    await sleep(this.delayMs);
    const n = Number(/scene (\d+)/.exec(scenePrompt)?.[1] ?? 1);
    return {
      data: placeholder(`page ${n}`, COLORS[(n - 1) % COLORS.length]),
      ext: 'svg',
      ref: `mock-page-${n}`,
      costUsd: 0,
    };
  }
}
