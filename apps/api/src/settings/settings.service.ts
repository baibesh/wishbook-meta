import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PAUSED = 'generation_paused';

/** Service-wide switches the admin changes, kept in the Setting table. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async paused(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({
      where: { key: PAUSED },
    });
    return row?.value === true;
  }

  async setPaused(paused: boolean): Promise<void> {
    const value = paused as Prisma.InputJsonValue;
    await this.prisma.setting.upsert({
      where: { key: PAUSED },
      create: { key: PAUSED, value },
      update: { value },
    });
  }
}
