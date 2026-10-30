import type { Story } from '@wishbook/shared';
import type { StoryBrief } from './prompts';

export const MODEL_GATEWAY = Symbol('MODEL_GATEWAY');

export interface GeneratedImage {
  data: Buffer;
  ext: 'png' | 'webp' | 'jpeg' | 'svg';
  /** Response id that later generations chain from (previous_response_id). */
  ref: string;
  costUsd: number;
}

export interface GeneratedStory {
  story: Story;
  costUsd: number;
}

/**
 * Everything WishBook asks of Meta's models. The real implementation calls the
 * Meta Model API; the mock one returns canned output so tests and CI cost nothing.
 */
export interface ModelGateway {
  writeStory(brief: StoryBrief): Promise<GeneratedStory>;
  /** The hero character sheet every page is anchored on. */
  drawHero(heroDescription: string, style?: string): Promise<GeneratedImage>;
  /** The pet character sheet, chained from the hero sheet so both stay in the conversation. */
  drawPet(
    petDescription: string,
    heroRef: string,
    style?: string,
  ): Promise<GeneratedImage>;
  /**
   * One page illustration, chained from the last character sheet (`anchorRef`) so the
   * child and the pet stay on-model. `style` replaces the default art style (catalog books).
   */
  drawPage(
    scenePrompt: string,
    anchorRef: string,
    withPet: boolean,
    style?: string,
  ): Promise<GeneratedImage>;
}
