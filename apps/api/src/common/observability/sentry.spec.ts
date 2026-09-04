import {
  initSentry,
  captureApiException,
  flushSentry,
  __resetSentryForTests,
} from './sentry';

// jest.setup.ts stubs the required env vars and deliberately does NOT set
// SENTRY_DSN, so this suite runs in exactly the configuration a dev box and CI
// are in: no DSN.
describe('sentry (no DSN configured)', () => {
  afterEach(() => __resetSentryForTests());

  it('does not initialise', () => {
    expect(initSentry()).toBe(false);
  });

  it('never loads the SDK', () => {
    initSentry();
    expect(Object.keys(require.cache).some((k) => k.includes('@sentry'))).toBe(
      false,
    );
  });

  it('captures and flushes as no-ops instead of throwing', async () => {
    expect(() =>
      captureApiException(new Error('boom'), { mechanism: 'http' }),
    ).not.toThrow();
    await expect(flushSentry(1)).resolves.toBeUndefined();
  });
});
