import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { VoiceEnabledGuard } from './voice.controller';

const guard = (value?: string) =>
  new VoiceEnabledGuard({ get: () => value } as unknown as ConfigService);

describe('VoiceEnabledGuard', () => {
  it('lets the recording through only when VOICE_INPUT=true', () => {
    expect(guard('true').canActivate()).toBe(true);
    for (const value of [undefined, 'false', '1']) {
      let error: unknown;
      try {
        guard(value).canActivate();
      } catch (problem) {
        error = problem;
      }
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getResponse()).toMatchObject({
        code: 'voice_disabled',
      });
    }
  });
});
