import OpenAI from 'openai';
import type { Response, Tool } from 'openai/resources/responses/responses';
import { StorySchema, type Language, type Story } from '@fabulka/shared';
import { z } from 'zod';
import type {
  GeneratedImage,
  GeneratedStory,
  ModelGateway,
  PrefillFields,
} from './model-gateway';
import { cutout } from '../toy/cutout';
import { sanitizePrefill } from '../voice/prefill';
import {
  LANGUAGE_NAMES,
  PREFILL_INSTRUCTIONS,
  prefillPrompt,
  type PrefillBrief,
  REVIEW_INSTRUCTIONS,
  reviewPrompt,
  STORY_INSTRUCTIONS,
  TOY_DESCRIPTION_PROMPT,
  type Companions,
  type StoryBrief,
  heroPrompt,
  toyPrompt,
  pagePrompt,
  petPrompt,
  storyPrompt,
} from './prompts';

/** Muse Spark Standard mode, USD per 1M tokens (dev.meta.ai/docs/pricing-rate-limits). */
const SPARK_INPUT_PER_M = 1.25;
const SPARK_OUTPUT_PER_M = 4.25;
/** Muse Image is a flat price per generated image. */
const IMAGE_PRICE = 0.01;
/** SAM 3.1: $2.50 per 1,000 images. */
const SAM_PRICE = 0.0025;
/** Muse Voice Transcribe: $0.18 per hour of audio, metered in whole seconds. */
const TRANSCRIBE_PER_SECOND = 0.18 / 3600;
const TRANSCRIBE_MODEL = 'muse-voice-transcribe-1.0';
/** Languages the speech model is biased toward; Kazakh speakers often switch to Russian. */
const LANGUAGE_BIAS: Record<Language, string[]> = {
  ru: [LANGUAGE_NAMES.ru],
  kk: [LANGUAGE_NAMES.kk, LANGUAGE_NAMES.ru],
  en: [LANGUAGE_NAMES.en],
};
/** What SAM is asked to find in the parent's photo. */
const TOY_CONCEPT = 'toy';
const STORY_ATTEMPTS = 3;

export interface MetaGatewayOptions {
  apiKey: string;
  baseURL: string;
  storyModel: string;
  imageModel: string;
  samModel: string;
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

  async reviewStory(
    story: Story,
    age: number,
  ): Promise<{ safe: boolean; reason: string; costUsd: number }> {
    const response = await this.client.responses.create({
      model: this.options.storyModel,
      instructions: REVIEW_INSTRUCTIONS,
      input: reviewPrompt(JSON.stringify(story), age),
      text: { format: { type: 'json_object' } },
    });
    const parsed = ReviewSchema.safeParse(
      JSON.parse(response.output_text || '{}'),
    );
    // An unreadable verdict is not a pass.
    const verdict = parsed.success
      ? parsed.data
      : { safe: false, reason: 'the safety review returned no verdict' };
    return { ...verdict, costUsd: tokenCost(response) };
  }

  async findToy(
    photo: Buffer,
  ): Promise<{ cutout: Buffer | null; costUsd: number }> {
    // ESM-only package; loaded on first use.
    const { parseImageStream, recordsOfKind, decodeMaskToRaster } =
      await import('@meta-sam/parser');
    const events = await this.client.responses.create({
      model: this.options.samModel,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: TOY_CONCEPT },
            { type: 'input_image', image_url: dataUrl(photo), detail: 'auto' },
          ],
        },
      ],
      stream: true,
      metadata: { mask_encoding: 'one_bit' },
    });
    const parsed = parseImageStream(events as never);
    for await (const snapshot of parsed) void snapshot;
    const { records } = await parsed.finalResult;
    // Several matches: the biggest one is the toy the photo is of.
    const largest = [...recordsOfKind(records, 'mask')].sort(
      (a, b) => area(b.bounds) - area(a.bounds),
    )[0];
    if (!largest) return { cutout: null, costUsd: SAM_PRICE };
    return {
      cutout: cutout(photo, {
        box: largest.bounds,
        mask: decodeMaskToRaster(largest.mask),
        maskWidth: largest.mask.width,
        maskHeight: largest.mask.height,
      }),
      costUsd: SAM_PRICE,
    };
  }

  async describeToy(
    image: Buffer,
  ): Promise<{ description: string; costUsd: number }> {
    const response = await this.client.responses.create({
      model: this.options.storyModel,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: TOY_DESCRIPTION_PROMPT },
            { type: 'input_image', image_url: dataUrl(image), detail: 'auto' },
          ],
        },
      ],
    });
    const description = response.output_text.trim().replace(/\.$/, '');
    if (!description) throw new Error('Muse Spark returned no toy description');
    return { description, costUsd: tokenCost(response) };
  }

  drawToy(
    toyDescription: string,
    reference: Buffer,
    anchorRef: string,
    style?: string,
  ): Promise<GeneratedImage> {
    return this.draw(
      toyPrompt(toyDescription, style),
      '1024x1024',
      anchorRef,
      reference,
    );
  }

  drawHero(heroDescription: string, style?: string): Promise<GeneratedImage> {
    return this.draw(heroPrompt(heroDescription, style), '1024x1024');
  }

  drawPet(
    petDescription: string,
    heroRef: string,
    style?: string,
  ): Promise<GeneratedImage> {
    return this.draw(petPrompt(petDescription, style), '1024x1024', heroRef);
  }

  drawPage(
    scenePrompt: string,
    anchorRef: string,
    companions: Companions,
    style?: string,
  ): Promise<GeneratedImage> {
    return this.draw(
      pagePrompt(scenePrompt, companions, style),
      '1536x1024',
      anchorRef,
    );
  }

  /** POST /asr/transcribe is not part of the OpenAI SDK: a multipart request of its own. */
  async transcribe(
    wav: Buffer,
    language: Language,
  ): Promise<{ text: string; costUsd: number }> {
    const form = new FormData();
    form.append(
      'request',
      new Blob(
        [
          JSON.stringify({
            model: TRANSCRIBE_MODEL,
            audioEncoding: 'WAV',
            mode: 'PUSH_TO_TALK',
            languageBias: LANGUAGE_BIAS[language],
          }),
        ],
        { type: 'application/json' },
      ),
    );
    form.append(
      'audio',
      new Blob([new Uint8Array(wav)], { type: 'audio/wav' }),
      'recording.wav',
    );
    const response = await fetch(`${this.options.baseURL}/asr/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        Accept: 'application/json',
      },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      throw new Error(
        `Muse Voice Transcribe answered ${response.status}: ${detail}`,
      );
    }
    const body = TranscribeResponseSchema.parse(await response.json());
    return {
      text: body.transcript.trim(),
      costUsd: Math.floor(body.audioDurationMs / 1000) * TRANSCRIBE_PER_SECOND,
    };
  }

  async extractPrefill(
    brief: PrefillBrief,
  ): Promise<{ fields: PrefillFields; costUsd: number }> {
    const response = await this.client.responses.create({
      model: this.options.storyModel,
      instructions: PREFILL_INSTRUCTIONS,
      input: prefillPrompt(brief),
      text: { format: { type: 'json_object' } },
    });
    let raw: unknown = {};
    try {
      raw = JSON.parse(response.output_text || '{}');
    } catch {
      // Unreadable JSON fills in nothing; the transcript is still shown.
    }
    return {
      fields: sanitizePrefill(raw, brief.questions, brief.theme),
      costUsd: tokenCost(response),
    };
  }

  private async draw(
    prompt: string,
    size: '1024x1024' | '1536x1024',
    previousResponseId?: string,
    reference?: Buffer,
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
      // A reference photo goes in as an image part next to the prompt.
      input: reference
        ? [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: prompt },
                {
                  type: 'input_image',
                  image_url: dataUrl(reference),
                  detail: 'auto',
                },
              ],
            },
          ]
        : prompt,
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

const ReviewSchema = z.object({ safe: z.boolean(), reason: z.string() });
const TranscribeResponseSchema = z.object({
  transcript: z.string(),
  audioDurationMs: z.number().default(0),
});

function dataUrl(jpeg: Buffer): string {
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

function area(box: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}) {
  return (box.right - box.left) * (box.bottom - box.top);
}
