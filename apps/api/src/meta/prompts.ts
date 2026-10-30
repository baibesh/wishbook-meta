import {
  ageBand,
  methodology,
  talkQuestionKinds,
  type ChildProfile,
  type MethodologySlug,
} from '@wishbook/shared';

/** Art style repeated in every image prompt: Muse Image has no seed, so the words keep pages consistent. */
export const ART_STYLE =
  'warm children picture-book illustration, soft watercolor and gouache textures, ' +
  'gentle rounded shapes, cozy pastel palette, no text, no letters';

const LANGUAGE_NAMES = {
  ru: 'Russian',
  kk: 'Kazakh',
  en: 'English',
} as const;

export const STORY_INSTRUCTIONS = `You write personalized picture books for children.
The child is the hero of the story. The story is kind, safe and written for a parent to read
aloud. Each book follows the story method and the age norms the user gives: spread the pages
across the method's beats in order and keep its rules.

Return only JSON of this exact shape:
{
  "title": string,
  "hero_description": string,
  "pet_description": string | null,
  "pages": [{ "page": number, "text": string, "scene_prompt": string }],
  "talk_questions": string[]
}

- "title" and every "text" are in the language the user asks for.
- "hero_description" is in English: the child's look and outfit in one sentence
  (age, hair, eyes, clothes with colors). It must stay the same for the whole book.
- "pet_description" is in English: the pet's species, size, fur colors and markings in one
  sentence, or null when there is no pet.
- "scene_prompt" is in English: what the illustration shows on that page. Name the hero
  as "the hero", the pet as "the pet" and the favourite toy, when there is one, as "the toy";
  describe the place and action, not the style.
  Mention the pet and the toy only in scenes they are actually in.
  Any other character that appears on more than one page is described with the exact same
  words (species, colors, distinctive details) in every scene_prompt it appears in.
- "talk_questions" are 3 to 5 short questions, in the book's language, that the parent asks
  the child after reading, of the kinds the user lists. They speak to the child as "you"
  with the grammatical gender of the child (Russian "ты хотела" for a girl, "ты хотел" for a boy).`;

/** What a story is written from: the child, the method and, optionally, the parent's theme. */
export interface StoryBrief {
  child: ChildProfile;
  pageCount: number;
  methodology: MethodologySlug;
  theme?: string;
  /** The child's favourite toy from the parent's photo, described by Muse Spark. */
  toy?: { name?: string; description: string };
  /** Set for a catalog book: the author's plot and the parent's answers. */
  template?: {
    title: string;
    plot: string[];
    answers: { question: string; answer: string }[];
  };
}

export function storyPrompt(brief: StoryBrief): string {
  const { child, pageCount } = brief;
  const method = methodology(brief.methodology);
  const band = ageBand(child.age);
  const list = (items: readonly string[]) =>
    items.map((item) => `- ${item}`).join('\n');
  return [
    `Write a ${pageCount}-page book in ${LANGUAGE_NAMES[child.language]}.`,
    `Hero: ${child.name}, a ${child.age}-year-old ${child.gender}.`,
    `Interests: ${child.interests.join(', ')}.`,
    child.pet ? `Pet: ${child.pet}.` : 'No pet.',
    ...toyLines(brief),
    `Home city: ${child.city}, Kazakhstan. Let the city appear in the story.`,
    brief.theme
      ? `The book is about: ${brief.theme}.`
      : 'Choose what the book is about so it fits the method and the interests.',
    '',
    ...templateLines(brief),
    `Story method: ${method.slug} (${method.source}). Beats, in order:`,
    list(method.structure),
    'Rules:',
    list(method.rules),
    `Avoid: ${method.avoid.join('; ')}.`,
    '',
    `Age norms: each page is ${band.sentencesPerPage}, at most ${band.maxWordsPerPage} words.`,
    list(band.guidance),
    `Talk questions, one of each kind: ${talkQuestionKinds(child.age).join('; ')}.`,
  ].join('\n');
}

function toyLines({ toy }: StoryBrief): string[] {
  if (!toy) return [];
  const name = toy.name ? `, called "${toy.name}"` : '';
  return [
    `Favourite toy${name}: ${toy.description}.`,
    "The toy is the hero's companion through the story; it may come to life and help.",
  ];
}

function templateLines({ template }: StoryBrief): string[] {
  if (!template) return [];
  const answers = template.answers.length
    ? [
        "The parent's answers; weave each one into the story:",
        ...template.answers.map((a) => `- ${a.question} ${a.answer}`),
      ]
    : [];
  return [
    `This is the catalog book "${template.title}". Base the title on it.`,
    'Keep its plot, in this order, adapted to the hero:',
    ...template.plot.map((point) => `- ${point}`),
    ...answers,
    '',
  ];
}

export function heroPrompt(heroDescription: string, style = ART_STYLE): string {
  return (
    `an original children's book character sheet of the hero: ${heroDescription}, ` +
    `full body, front view, friendly expression, plain white background, centered, ${style}`
  );
}

export function petPrompt(petDescription: string, style = ART_STYLE): string {
  return (
    `an original children's book character sheet of the pet: ${petDescription}, ` +
    `full body, side view, plain white background, centered, ${style}`
  );
}

/** Which companions a page shows, so only their sheets are pointed at. */
export interface Companions {
  pet: boolean;
  toy: boolean;
}

/** Asks Muse Spark (vision) to put the toy in the photo into words an illustrator can follow. */
export const TOY_DESCRIPTION_PROMPT =
  "This is a photo of a child's favourite toy. Describe the toy in one English sentence for an " +
  'illustrator: what kind of toy it is, its material, colors, and distinctive details such as ' +
  'clothes, patches or markings. Describe only the toy, not the background. Reply with the sentence only.';

export function toyPrompt(toyDescription: string, style = ART_STYLE): string {
  return (
    `an original children's book character sheet of the toy: ${toyDescription}. ` +
    'Draw the same toy as in the reference photo, as a friendly storybook character, ' +
    `full body, front view, plain white background, centered, ${style}`
  );
}

export function pagePrompt(
  scenePrompt: string,
  companions: Companions,
  style = ART_STYLE,
): string {
  const pet = companions.pet
    ? ' The pet is the same animal as in the pet character sheet shown earlier.'
    : '';
  const toy = companions.toy
    ? ' The toy is the same toy as in the toy character sheet shown earlier.'
    : '';
  return `${scenePrompt}. The hero is the same child as in the hero character sheet shown earlier.${pet}${toy} ${style}`;
}
