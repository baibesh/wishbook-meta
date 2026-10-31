import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  HttpCode,
  Injectable,
  NotFoundException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  VOICE_DISABLED,
  VoiceRequestSchema,
  type VoicePrefill,
  type VoiceRequest,
} from '@fabulka/shared';
import { CurrentClient, type Client } from '../common/client';
import { ZodPipe } from '../common/zod.pipe';
import { voiceEnabled } from '../settings/status.controller';
import { wavSeconds } from './wav';
import { VoiceService } from './voice.service';

/** 60 s of 16 kHz 16-bit mono is 1.92 MB; the rest is headroom. */
const MAX_BYTES = 2_500_000;
const MAX_SECONDS = 60;
const WAV_TYPES = ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'];

/** The part of a multer file this route reads (multer's own types are not a dependency). */
interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
}

/** Voice input is off unless VOICE_INPUT=true; checked before the upload is read. */
@Injectable()
export class VoiceEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (voiceEnabled(this.config)) return true;
    throw new NotFoundException({
      code: VOICE_DISABLED,
      message: 'Голосовой ввод выключен',
    });
  }
}

@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  /**
   * Fills in the order form from the parent's recording: multipart `audio` (a 16 kHz mono WAV, at
   * most 60 s), `language` and, on a catalog book's form, `template`. Generation being paused does
   * not stop it: nothing is generated. Multer keeps the file in memory (no `dest`), never on disk.
   */
  @Post()
  @HttpCode(200)
  @UseGuards(VoiceEnabledGuard)
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: MAX_BYTES, files: 1, fields: 4 },
    }),
  )
  prefill(
    @UploadedFile() audio: UploadedAudio | undefined,
    @Body(new ZodPipe(VoiceRequestSchema)) body: VoiceRequest,
    @CurrentClient() client: Client,
  ): Promise<VoicePrefill> {
    if (!audio || !WAV_TYPES.includes(audio.mimetype)) {
      throw new BadRequestException('Нужна запись в формате WAV');
    }
    const seconds = wavSeconds(audio.buffer);
    if (seconds === null) {
      throw new BadRequestException('Нужна запись в формате WAV');
    }
    if (seconds > MAX_SECONDS + 1) {
      throw new BadRequestException('Запись длиннее минуты');
    }
    return this.voice.prefill(audio.buffer, body, client.key);
  }
}
