import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { REGION_UNAVAILABLE } from '@wishbook/shared';
import type { Request } from 'express';
import { clientIp, GeoGuard } from './geo.guard';
import { GeoService } from './geo.service';

function context(path: string, realIp?: string): ExecutionContext {
  const request = {
    path,
    headers: realIp ? { 'x-real-ip': realIp } : {},
    socket: { remoteAddress: '::ffff:127.0.0.1' },
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** A GeoService whose database knows a few addresses. */
function geo(enabled = true): GeoService {
  const service = new GeoService({
    get: (key: string, fallback: string) =>
      key === 'GEO_BLOCK' ? String(enabled) : fallback,
  } as unknown as ConfigService);
  const countries: Record<string, string> = {
    '77.88.8.8': 'RU',
    '49.44.0.1': 'IN',
    '212.116.234.61': 'KZ',
  };
  jest
    .spyOn(service, 'country')
    .mockImplementation((ip) => countries[ip] ?? null);
  return service;
}

describe('GeoGuard', () => {
  it('turns away a restricted country with 451', () => {
    const guard = new GeoGuard(geo());
    try {
      guard.canActivate(context('/api/books', '77.88.8.8'));
      fail('expected a 451');
    } catch (error) {
      const http = error as { getStatus(): number; getResponse(): unknown };
      expect(http.getStatus()).toBe(451);
      expect(http.getResponse()).toMatchObject({
        code: REGION_UNAVAILABLE,
        country: 'RU',
      });
    }
  });

  it('blocks India, where Muse Image is not available', () => {
    expect(() =>
      new GeoGuard(geo()).canActivate(context('/api/templates', '49.44.0.1')),
    ).toThrow();
  });

  it('lets Kazakhstan, unknown and local addresses through', () => {
    const guard = new GeoGuard(geo());
    expect(guard.canActivate(context('/api/books', '212.116.234.61'))).toBe(
      true,
    );
    expect(guard.canActivate(context('/api/books', '10.0.0.5'))).toBe(true);
    expect(guard.canActivate(context('/api/books'))).toBe(true);
  });

  it('keeps the health check open', () => {
    expect(
      new GeoGuard(geo()).canActivate(context('/api/health', '77.88.8.8')),
    ).toBe(true);
  });

  it('lets everyone through when blocking is off', () => {
    expect(
      new GeoGuard(geo(false)).canActivate(context('/api/books', '77.88.8.8')),
    ).toBe(true);
  });
});

describe('clientIp', () => {
  it('prefers X-Real-IP from nginx over the socket address', () => {
    const request = {
      headers: { 'x-real-ip': ' 77.88.8.8 ' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;
    expect(clientIp(request)).toBe('77.88.8.8');
  });
});
