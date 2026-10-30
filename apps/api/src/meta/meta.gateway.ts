import OpenAI from 'openai';
import type { Response, Tool } from 'openai/resources/responses/responses';
import { StorySchema } from '@wishbook/shared';
import type {
  GeneratedImage,
  GeneratedStory,
  ModelGateway,
} from './model-gateway';
import {
  STORY_INSTRUCTIONS,
  type StoryBrief,
  heroPrompt,
  pagePrompt,
  petPrompt,
  storyPrompt,
} from './prompts';

/** Muse Spark Standard mode, USD per 1M tokens (dev.meta.ai/docs/pricing-rate-limits). */
const SPARK_INPUT_PER_M = 1.25;
const SPARK_OUTPUT_PER_M = 4.25;
/** Muse Image is a flat price per generated image. */
const IMAGE_PRICE = 0.01;
const STORY_ATTEMPTS = 3;

export interface MetaGatewayOptions {
  apiKey: string;
  baseURL: string;
  storyModel: string;
  imageModel: string;
}

/** The Meta Model API, through the OpenAI SDK's Responses API. */
export class MetaGateway implements ModelGateway {
  private readonly client: OpenAI;

  constructor(private readonly options: MetaGatewayOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      maxRetries: 4,
      timeout: 180_000,
    });
  }

  async writeStory(brief: StoryBrief): Promise<GeneratedStory> {
    let costUsd = 0;
    let error = '';
    for (let attempt = 0; attempt < STORY_ATTEMPTS; attempt++) {
      const response = await this.client.responses.create({
        model: this.options.storyModel,
        instructions: STORY_INSTRUCTIONS,
        input:
          storyPrompt(brief) +
          (error ? `\nYour previous output was invalid: ${error}` : ''),
        text: { format: { type: 'json_object' } },
      });
      costUsd += tokenCost(response);
      try {
        const story = StorySchema.parse(JSON.parse(response.output_text));
        return { story, costUsd };
      } catch (problem) {
        error =
          problem instanceof Error
            ? problem.message.slice(0, 500)
            : String(problem);
      }
    }
    throw new Error(
      `Muse Spark returned an invalid story ${STORY_ATTEMPTS} times: ${error}`,
    );
  }

  drawHero(heroDescription: string): Promise<GeneratedImage> {
    return this.draw(heroPrompt(heroDescription), '1024x1024');
  }

  drawPet(petDescription: string, heroRef: string): Promise<GeneratedImage> {
    return this.draw(petPrompt(petDescription), '1024x1024', heroRef);
  }

  drawPage(
    scenePrompt: string,
    anchorRef: string,
    withPet: boolean,
  ): Promise<GeneratedImage> {
    return this.draw(pagePrompt(scenePrompt, withPet), '1536x1024', anchorRef);
  }

  private async draw(
    prompt: string,
    size: '1024x1024' | '1536x1024',
    previousResponseId?: string,
  ): Promise<GeneratedImage> {
    // Web and image search add latency and nothing for invented characters.
    const tool = {
      type: 'image_generation',
      size,
      // JPEG keeps a 10-page PDF small enough to download; PNG made it ~5 MB a page.
      output_format: 'jpeg',
      enable_web_search: false,
      enable_image_search: false,
    } as unknown as Tool;
    const response = await this.client.responses.create({
      model: this.options.imageModel,
      input: prompt,
      tools: [tool],
      ...(previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
    });
    const call = response.output.find(
      (item) => item.type === 'image_generation_call',
    );
    if (!call || call.type !== 'image_generation_call' || !call.result) {
      throw new Error(
        `Muse Image returned no image (response ${response.id}, status ${response.status})`,
      );
    }
    return {
      data: Buffer.from(call.result, 'base64'),
      ext: 'jpeg',
      ref: response.id,
      costUsd: IMAGE_PRICE,
    };
  }
}

function tokenCost(response: Response): number {
  const usage = response.usage;
  if (!usage) return 0;
  return (
    (usage.input_tokens * SPARK_INPUT_PER_M +
      usage.output_tokens * SPARK_OUTPUT_PER_M) /
    1_000_000
  );
}
