/**
 * Draws a cover for every catalog book that has none yet, with Muse Image, into
 * apps/web/public/catalog/<slug>.jpg. Run: pnpm --filter @wishbook/api covers
 */
import OpenAI from 'openai';
import type { Tool } from 'openai/resources/responses/responses';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ART_STYLE } from '../src/meta/prompts';
import { SEED_TEMPLATES } from '../src/templates/catalog';

const OUT = resolve(__dirname, '../../web/public/catalog');

async function main() {
  process.loadEnvFile(resolve(__dirname, '../.env'));
  const client = new OpenAI({
    apiKey: process.env.MODEL_API_KEY,
    baseURL: process.env.MODEL_API_BASE_URL ?? 'https://api.meta.ai/v1',
    timeout: 180_000,
  });
  const tool = {
    type: 'image_generation',
    size: '1024x1024',
    output_format: 'jpeg',
    enable_web_search: false,
    enable_image_search: false,
  } as unknown as Tool;

  await Promise.all(
    SEED_TEMPLATES.map(async (t) => {
      const file = resolve(OUT, `${t.slug}.jpg`);
      if (existsSync(file)) return;
      const response = await client.responses.create({
        model: process.env.IMAGE_MODEL ?? 'muse-image-1.0',
        input: `a children's picture-book cover illustration: ${t.coverPrompt}, square composition, ${t.stylePrompt ?? ART_STYLE}`,
        tools: [tool],
      });
      const call = response.output.find((o) => o.type === 'image_generation_call');
      if (call?.type !== 'image_generation_call' || !call.result) {
        throw new Error(`no image for ${t.slug} (response ${response.id})`);
      }
      writeFileSync(file, Buffer.from(call.result, 'base64'));
      console.log(`${t.slug}.jpg`);
    }),
  );
}

void main();
