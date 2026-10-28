import { StorySchema } from '@wishbook/shared';
import { MockGateway } from './mock.gateway';
import { heroPrompt, pagePrompt, storyPrompt } from './prompts';

const child = {
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
    const { story } = await gateway.writeStory(child, 4);
    expect(StorySchema.parse(story).pages).toHaveLength(4);
    expect(story.title).toContain('Айгерим');
  });

  it('writes in Kazakh when asked', async () => {
    const { story } = await gateway.writeStory({ ...child, language: 'kk' }, 1);
    expect(story.title).toContain('сапар');
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
    const prompt = storyPrompt(child, 10);
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

  it('repeats the art style in hero and page prompts', () => {
    expect(heroPrompt('a girl')).toContain('watercolor');
    expect(pagePrompt('the hero in a park')).toContain('watercolor');
  });
});
