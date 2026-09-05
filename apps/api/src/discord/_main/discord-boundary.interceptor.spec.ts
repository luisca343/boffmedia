import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { NecordBaseDiscovery } from 'necord';
import { DiscordBoundaryInterceptor } from './discord-boundary.interceptor';
import { fakeExecutionContext } from '@/_testing/nest-context';

jest.mock('@/common/observability/sentry', () => ({
  captureApiException: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic require after jest.mock setup
const { captureApiException } = require('@/common/observability/sentry') as {
  captureApiException: jest.Mock;
};

/** Necord calls a bound handler as `(eventArgs, discovery)`. Anything else in
 *  slot 1 must be left alone — the API's three WebSocket gateways go through
 *  the same global interceptor chain. */
function necordContext(eventArgs: unknown[], name = 'ping'): ExecutionContext {
  const discovery = Object.create(
    NecordBaseDiscovery.prototype,
  ) as NecordBaseDiscovery;
  (discovery as unknown as { getName: () => string }).getName = () => name;

  return {
    getType: () => 'necord',
    getArgs: () => [eventArgs, discovery],
    getArgByIndex: (i: number) => [eventArgs, discovery][i],
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

const boom = new Error('command exploded');
const throwingHandler: CallHandler = { handle: () => throwError(() => boom) };

describe('DiscordBoundaryInterceptor', () => {
  let interceptor: DiscordBoundaryInterceptor;
  let logger: { error: jest.Mock; warn: jest.Mock; log: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn() };
    interceptor = new DiscordBoundaryInterceptor(logger as never);
  });

  it('swallows a throwing command instead of letting it escape the process', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(necordContext([]), throwingHandler),
      { defaultValue: 'no-emission' },
    );

    expect(result).toBe('no-emission');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ discord: 'command ping' }),
      'Discord command ping failed',
    );
    expect(captureApiException).toHaveBeenCalledWith(
      boom,
      expect.objectContaining({ mechanism: 'discord', path: 'command ping' }),
    );
  });

  it('tells the user, without letting a failed reply resurrect the error', async () => {
    const interaction = {
      isRepliable: () => true,
      deferred: false,
      replied: false,
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn(),
    };

    await lastValueFrom(
      interceptor.intercept(necordContext([interaction]), throwingHandler),
      { defaultValue: undefined },
    );

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('reported') }),
    );
  });

  it('edits the reply when the handler had already deferred', async () => {
    const interaction = {
      isRepliable: () => true,
      deferred: true,
      replied: false,
      reply: jest.fn(),
      editReply: jest.fn().mockResolvedValue(undefined),
    };

    await lastValueFrom(
      interceptor.intercept(necordContext([interaction]), throwingHandler),
      { defaultValue: undefined },
    );

    expect(interaction.editReply).toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it('still swallows when the courtesy reply itself fails', async () => {
    const interaction = {
      isRepliable: () => true,
      deferred: false,
      replied: false,
      // The 15-minute interaction token expired while the handler was running.
      reply: jest.fn().mockRejectedValue(new Error('Unknown interaction')),
      editReply: jest.fn(),
    };

    await expect(
      lastValueFrom(
        interceptor.intercept(necordContext([interaction]), throwingHandler),
        { defaultValue: undefined },
      ),
    ).resolves.toBeUndefined();
  });

  it('passes non-Discord contexts straight through', async () => {
    const http = fakeExecutionContext();
    const handler: CallHandler = { handle: () => of('untouched') };

    await expect(
      lastValueFrom(interceptor.intercept(http, handler)),
    ).resolves.toBe('untouched');

    // And an error in an HTTP context must still reach GlobalExceptionFilter.
    await expect(
      lastValueFrom(interceptor.intercept(http, throwingHandler)),
    ).rejects.toBe(boom);
    expect(captureApiException).not.toHaveBeenCalled();
  });

  it('lets a successful command return its value', async () => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    await expect(
      lastValueFrom(interceptor.intercept(necordContext([]), handler)),
    ).resolves.toEqual({ ok: true });
  });
});
