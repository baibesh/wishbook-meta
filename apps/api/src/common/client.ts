import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { clientIp } from '../geo/geo.guard';

/** Who is asking: the anonymous key the web app keeps in localStorage, else the IP. */
export interface Client {
  key: string;
  demoCode: string | undefined;
  ip: string;
}

export const CurrentClient = createParamDecorator(
  (_: unknown, context: ExecutionContext): Client => {
    const request = context.switchToHttp().getRequest<Request>();
    const header = (name: string) => {
      const value = request.headers[name];
      return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
    };
    return {
      key: header('x-client-key') ?? request.ip ?? 'unknown',
      demoCode: header('x-demo-code'),
      ip: clientIp(request),
    };
  },
);
