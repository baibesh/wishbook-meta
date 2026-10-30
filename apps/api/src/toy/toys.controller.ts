import { Body, Controller, Post } from '@nestjs/common';
import { ToyUploadSchema } from '@fabulka/shared';
import { randomBytes } from 'node:crypto';
import type { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { StorageService } from '../storage/storage.service';

/** Where a toy photo waits until the book that uses it starts generating. */
export const toyUploadPath = (upload: string) => `uploads/toys/${upload}.jpg`;

@Controller('toys')
export class ToysController {
  constructor(private readonly storage: StorageService) {}

  /** Takes the toy photo (a JPEG data URL, scaled down in the browser) and returns its id. */
  @Post()
  async upload(
    @Body(new ZodPipe(ToyUploadSchema)) body: z.infer<typeof ToyUploadSchema>,
  ): Promise<{ upload: string }> {
    const upload = randomBytes(16).toString('hex');
    const photo = Buffer.from(
      body.image.slice(body.image.indexOf(',') + 1),
      'base64',
    );
    await this.storage.save(toyUploadPath(upload), photo);
    return { upload };
  }
}
