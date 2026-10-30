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

const LANGUAGE_NAMES = { ru: 'Russian', kk: 'Kazakh' } as const;

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
  as "the hero" and the pet as "the pet"; describe the place and action, not the style.
  Mention the pet only in scenes the pet is actually in.
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
    `Home city: ${child.city}, Kazakhstan. Let the city appear in the story.`,
    brief.theme
      ? `The book is about: ${brief.theme}.`
      : 'Choose what the book is about so it fits the method and the interests.',
    '',
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

export function heroPrompt(heroDescription: string): string {
  return (
    `an original children's book character sheet of the hero: ${heroDescription}, ` +
    `full body, front view, friendly expression, plain white background, centered, ${ART_STYLE}`
  );
}

export function petPrompt(petDescription: string): string {
  return (
    `an original children's book character sheet of the pet: ${petDescription}, ` +
    `full body, side view, plain white background, centered, ${ART_STYLE}`
  );
}

export function pagePrompt(scenePrompt: string, withPet: boolean): string {
  const pet = withPet
    ? ' The pet is the same animal as in the pet character sheet shown earlier.'
    : '';
  return `${scenePrompt}. The hero is the same child as in the hero character sheet shown earlier.${pet} ${ART_STYLE}`;
}
