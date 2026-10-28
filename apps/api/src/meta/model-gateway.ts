import type { ChildProfile, Story } from '@wishbook/shared';

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
  writeStory(child: ChildProfile, pageCount: number): Promise<GeneratedStory>;
  /** The hero character sheet every page is anchored on. */
  drawHero(heroDescription: string): Promise<GeneratedImage>;
  /** One page illustration, chained from the hero sheet so the child stays on-model. */
  drawPage(scenePrompt: string, heroRef: string): Promise<GeneratedImage>;
}
