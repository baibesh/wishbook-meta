import { StorySchema, type ChildProfile } from '@wishbook/shared';
import { MockGateway } from './mock.gateway';
import { heroPrompt, pagePrompt, storyPrompt } from './prompts';

const brief = (overrides: Partial<ChildProfile> = {}, pageCount = 4) => ({
  child: { ...child, ...overrides },
  pageCount,
  methodology: 'growth-mindset' as const,
});

const child: ChildProfile = {
  name: 'Айгерим',
  age: 6,
  gender: 'girl' as const,
  interests: ['космос', 'лошади'],
  pet: 'кот Барсик',
  city: 'Алматы',
  language: 'ru' as const,
};

describe('MockGateway', () => {
  const gateway = new MockGateway(0);

  it('writes a valid story with the requested page count', async () => {
    const { story } = await gateway.writeStory(brief());
    expect(StorySchema.parse(story).pages).toHaveLength(4);
    expect(story.title).toContain('Айгерим');
  });

  it('writes in Kazakh when asked', async () => {
    const { story } = await gateway.writeStory(brief({ language: 'kk' }, 1));
    expect(story.title).toContain('сапар');
  });

  it('writes in English when asked', async () => {
    const { story } = await gateway.writeStory(brief({ language: 'en' }, 1));
    expect(story.title).toBe('Айгерим and the Starry Journey');
    expect(story.talk_questions[0]).toBe('What happened in the book?');
  });

  it('draws a distinct placeholder per page', async () => {
    const one = await gateway.drawPage('the hero, scene 1');
    const two = await gateway.drawPage('the hero, scene 2');
    expect(one.ext).toBe('svg');
    expect(one.data.equals(two.data)).toBe(false);
  });
});

describe('prompts', () => {
  it('puts every profile detail into the story prompt', () => {
    const prompt = storyPrompt(brief({}, 10));
    expect(storyPrompt(brief({ language: 'en' }))).toContain('in English');
    for (const part of [
      '10-page',
      'Russian',
      'Айгерим',
      'космос',
      'кот Барсик',
      'Алматы',
    ]) {
      expect(prompt).toContain(part);
    }
  });

  it('puts the method beats, the age norms and the theme into the story prompt', () => {
    const prompt = storyPrompt({
      ...brief({ age: 3 }),
      methodology: 'social-story',
      theme: 'первый день в детском саду',
    });
    expect(prompt).toContain('Social Stories by Carol Gray');
    expect(prompt).toContain('step by step');
    expect(prompt).toContain('at most 25 words');
    expect(prompt).toContain('первый день в детском саду');
    expect(prompt).toContain('finish a sentence');
  });

  it('repeats the art style in hero and page prompts', () => {
    expect(heroPrompt('a girl')).toContain('watercolor');
    expect(pagePrompt('the hero in a park', false)).toContain('watercolor');
    expect(pagePrompt('the hero in a park', true)).toContain(
      'pet character sheet',
    );
    expect(pagePrompt('the hero in a park', false)).not.toContain('pet');
  });
});
