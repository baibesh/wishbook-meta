import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/** Generated files on local disk, served at /files. Swap for R2 when deploying. */
@Injectable()
export class StorageService {
  readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get('STORAGE_DIR', './storage'));
  }

  /** Saves a file and returns its path relative to the storage root. */
  async save(relativePath: string, data: Buffer): Promise<string> {
    const full = join(this.root, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
    return relativePath;
  }

  url(relativePath: string | null): string | null {
    return relativePath ? `/files/${relativePath}` : null;
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
