import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';

import { ResponseInterceptor } from './response.interceptor';
import { METRICS_PATH } from '@/_utils/metrics/metrics.constants';

function contextFor(path: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path, body: {}, params: {}, query: {} }),
      getResponse: () => ({ statusCode: 200, headersSent: false }),
    }),
    getHandler: () => function handler() {},
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

const handlerReturning = (data: unknown): CallHandler => ({
  handle: () => of(data),
});

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue(undefined),
    };
    interceptor = new ResponseInterceptor(reflector as unknown as Reflector);
    jest.spyOn(interceptor['logger'], 'log').mockImplementation(() => undefined);
  });

  it('wraps an ordinary route in the success envelope', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('/events'), handlerReturning([1, 2])),
    );

    expect(result).toEqual({ success: true, statusCode: 200, data: [1, 2] });
  });

  // Prometheus parses a line-oriented text format. Wrapped, the payload begins
  // `{"success":true,...}` and every scrape fails — silently, because the
  // endpoint still answers 200 with the right Content-Type.
  it('passes the metrics exposition through unwrapped', async () => {
    const exposition = '# HELP http_requests_total Total HTTP requests\n';

    const result = await firstValueFrom(
      interceptor.intercept(
        contextFor(METRICS_PATH),
        handlerReturning(exposition),
      ),
    );

    expect(result).toBe(exposition);
  });
});
