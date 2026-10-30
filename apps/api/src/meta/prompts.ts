import type { ChildProfile } from '@wishbook/shared';

/** Art style repeated in every image prompt: Muse Image has no seed, so the words keep pages consistent. */
export const ART_STYLE =
  'warm children picture-book illustration, soft watercolor and gouache textures, ' +
  'gentle rounded shapes, cozy pastel palette, no text, no letters';

const LANGUAGE_NAMES = { ru: 'Russian', kk: 'Kazakh' } as const;

export const STORY_INSTRUCTIONS = `You write personalized bedtime picture books for children.
The child is the hero of the story. The story is kind, safe, age-appropriate, with a clear
beginning, a small adventure and a warm ending. Use simple sentences a parent reads aloud.

Return only JSON of this exact shape:
{
  "title": string,
  "hero_description": string,
  "pet_description": string | null,
  "pages": [{ "page": number, "text": string, "scene_prompt": string }]
}

- "title" and every "text" are in the language the user asks for.
- "hero_description" is in English: the child's look and outfit in one sentence
  (age, hair, eyes, clothes with colors). It must stay the same for the whole book.
- "pet_description" is in English: the pet's species, size, fur colors and markings in one
  sentence, or null when there is no pet.
- "scene_prompt" is in English: what the illustration shows on that page. Name the hero
  as "the hero" and the pet as "the pet"; describe the place and action, not the style.
  Any other character that appears on more than one page is described with the exact same
  words (species, colors, distinctive details) in every scene_prompt it appears in.
- Each "text" is 2 to 4 sentences.`;

export function storyPrompt(child: ChildProfile, pageCount: number): string {
  const pet = child.pet ? `Pet: ${child.pet}.` : 'No pet.';
  return [
    `Write a ${pageCount}-page book in ${LANGUAGE_NAMES[child.language]}.`,
    `Hero: ${child.name}, a ${child.age}-year-old ${child.gender}.`,
    `Interests: ${child.interests.join(', ')}.`,
    pet,
    `Home city: ${child.city}, Kazakhstan. Let the city appear in the story.`,
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
