import { NecordModule } from 'necord';
import {
  ResilientNecordModule,
  resilientNecord,
} from './necord-resilient.module';

jest.mock('@/common/observability/sentry', () => ({
  captureApiException: jest.fn(),
}));

/**
 * Build the subclass without Nest: `NecordModule`'s constructor takes
 * `(client, options)`, and every test here cares only about what the bootstrap
 * hook does with `client.login`.
 */
function buildModule(login: jest.Mock): ResilientNecordModule {
  return new ResilientNecordModule(
    { login, destroy: jest.fn().mockResolvedValue(undefined) } as never,
    { token: 'test-token', intents: [] } as never,
  );
}

describe('ResilientNecordModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('does not block boot on the Discord login', async () => {
    // A login that never settles is the shape of "Discord is unreachable".
    const login = jest.fn().mockReturnValue(new Promise(() => {}));
    const mod = buildModule(login);

    // Nest awaits this hook. It has to resolve anyway, or app.listen() is never
    // reached and the API serves no HTTP and no websockets.
    await expect(mod.onApplicationBootstrap()).resolves.toBeDefined();
    expect(login).toHaveBeenCalledWith('test-token');
  });

  it('survives a rejected login and retries on a backoff ladder', async () => {
    const login = jest.fn().mockRejectedValue(new Error('TokenInvalid'));
    const mod = buildModule(login);

    await mod.onApplicationBootstrap();
    // Let the rejection settle before the timer is asserted on.
    await Promise.resolve();
    await Promise.resolve();

    expect(login).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(5_000);
    await Promise.resolve();
    expect(login).toHaveBeenCalledTimes(2);
  });

  it('clears a pending retry on shutdown so the process can exit', async () => {
    const login = jest.fn().mockRejectedValue(new Error('down'));
    const mod = buildModule(login);

    await mod.onApplicationBootstrap();
    await Promise.resolve();
    await Promise.resolve();

    await mod.onApplicationShutdown('SIGTERM');
    jest.advanceTimersByTime(600_000);
    await Promise.resolve();
    expect(login).toHaveBeenCalledTimes(1);
  });
});

describe('resilientNecord()', () => {
  it('keeps Necord’s providers but swaps the module token', () => {
    const dynamic = resilientNecord({ token: 't', intents: [] } as never);

    expect(dynamic.module).toBe(ResilientNecordModule);
    expect(dynamic.providers).toEqual(
      NecordModule.forRoot({ token: 't', intents: [] } as never).providers,
    );
  });

  it('inherits Necord’s @Module metadata through the prototype chain', () => {
    // The whole reason subclassing works instead of monkey-patching: Nest reads
    // imports/providers/exports with Reflect.getMetadata, which walks up.
    for (const key of ['imports', 'providers', 'exports']) {
      expect(Reflect.getMetadata(key, ResilientNecordModule)).toEqual(
        Reflect.getMetadata(key, NecordModule),
      );
    }
    expect(
      Reflect.getMetadata('design:paramtypes', ResilientNecordModule),
    ).toEqual(Reflect.getMetadata('design:paramtypes', NecordModule));
  });
});
