import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
  Post,
} from '@nestjs/common';
import { ToyUploadSchema } from '@fabulka/shared';
import { randomBytes } from 'node:crypto';
import type { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { StorageService } from '../storage/storage.service';
import { jpegSize } from './jpeg-size';

const UPLOADS = 'uploads/toys';
/** Where a toy photo waits until the book that uses it starts generating. */
export const toyUploadPath = (upload: string) => `${UPLOADS}/${upload}.jpg`;

/** Bigger photos only cost decoding time; the browser scales them to 1600 px anyway. */
const MAX_SIDE = 4096;
/** An upload no book picked up within this time is deleted. */
const UPLOAD_TTL_MS = 60 * 60 * 1000;

@Controller('toys')
export class ToysController {
  constructor(private readonly storage: StorageService) {}

  /** Takes the toy photo (a JPEG data URL, scaled down in the browser) and returns its id. */
  @Post()
  async upload(
    @Body(new ZodPipe(ToyUploadSchema)) body: z.infer<typeof ToyUploadSchema>,
  ): Promise<{ upload: string }> {
    const photo = Buffer.from(
      body.image.slice(body.image.indexOf(',') + 1),
      'base64',
    );
    const size = jpegSize(photo);
    if (!size || size.width > MAX_SIDE || size.height > MAX_SIDE) {
      throw new BadRequestException(
        'Нужна фотография в формате JPEG, не больше 4096 точек по стороне',
      );
    }
    const upload = randomBytes(16).toString('hex');
    await this.storage.save(toyUploadPath(upload), photo);
    return { upload };
  }
}

/** Deletes toy photos that were uploaded but never used by a book (a form left half-way). */
@Injectable()
export class ToyUploadsCleaner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ToyUploadsCleaner.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly storage: StorageService) {}

  onModuleInit() {
    const sweep = () =>
      this.storage
        .removeOlderThan(UPLOADS, UPLOAD_TTL_MS)
        .then(
          (count) =>
            count && this.logger.log(`removed ${count} unused toy photos`),
        )
        .catch((error: unknown) =>
          this.logger.error('toy photo cleanup failed', error),
        );
    void sweep();
    this.timer = setInterval(() => void sweep(), UPLOAD_TTL_MS / 4);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }
}
