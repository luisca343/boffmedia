import { scrubSentryEvent, REDACTED, ScrubbableEvent } from './sentry-scrub';

describe('scrubSentryEvent', () => {
  it('redacts an email address wherever it appears in free text', () => {
    const out = scrubSentryEvent({
      message: 'no account for luisca343@gmail.com',
    } as ScrubbableEvent);
    expect(out?.['message']).toBe(`no account for ${REDACTED}`);
  });

  // rotom_users.uuid is an FK in 27 tables, so it turns up inside ordinary
  // error messages far more often than in a field named `uuid`.
  it('redacts a Minecraft UUID in both the dashed and undashed form', () => {
    const dashed = scrubSentryEvent({
      message: 'pack denied for 069a79f4-44e9-4726-a5be-fca90e38aaf5',
    } as ScrubbableEvent);
    const undashed = scrubSentryEvent({
      message: 'pack denied for 069a79f444e94726a5befca90e38aaf5',
    } as ScrubbableEvent);
    expect(dashed?.['message']).toBe(`pack denied for ${REDACTED}`);
    expect(undashed?.['message']).toBe(`pack denied for ${REDACTED}`);
  });

  it('redacts JWTs, bearer headers and IP addresses', () => {
    const out = scrubSentryEvent({
      message:
        'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl from 203.0.113.9',
    } as ScrubbableEvent);
    expect(out?.['message']).not.toContain('eyJ');
    expect(out?.['message']).not.toContain('203.0.113.9');
  });

  // The regression this guards: an over-eager IPv6 pattern eats the time out of
  // every log line, which makes the events useless rather than unsafe.
  it('leaves an ISO timestamp alone', () => {
    const out = scrubSentryEvent({
      message: 'failed at 2026-09-04T12:34:56.789Z',
    } as ScrubbableEvent);
    expect(out?.['message']).toBe('failed at 2026-09-04T12:34:56.789Z');
  });

  it('drops the request body, cookies and query string outright', () => {
    const out = scrubSentryEvent({
      request: {
        url: 'https://api.boffmedia.es/auth/login',
        data: { email: 'a@b.c', password: 'hunter2' },
        cookies: { refresh_token: 'abc' },
        query_string: 'token=abc',
      },
    } as ScrubbableEvent);
    expect(out?.request?.data).toBeUndefined();
    expect(out?.request?.cookies).toBeUndefined();
    expect(out?.request?.query_string).toBeUndefined();
  });

  it('keeps only allowlisted request headers', () => {
    const out = scrubSentryEvent({
      request: {
        headers: {
          'User-Agent': 'curl/8',
          Authorization: 'Bearer abc',
          'X-Forwarded-For': '203.0.113.9',
        },
      },
    } as ScrubbableEvent);
    expect(Object.keys(out?.request?.headers ?? {})).toEqual(['User-Agent']);
  });

  it('redacts by key name as well as by value shape', () => {
    const out = scrubSentryEvent({
      extra: { apiKey: 'plainlooking', db_password: 'x', harmless: 'ok' },
    } as ScrubbableEvent);
    const extra = out?.['extra'] as Record<string, unknown>;
    expect(extra['apiKey']).toBe(REDACTED);
    expect(extra['db_password']).toBe(REDACTED);
    expect(extra['harmless']).toBe('ok');
  });

  it('keeps a numeric user id and drops a uuid or email in that slot', () => {
    expect(
      scrubSentryEvent({ user: { id: 42, email: 'a@b.c' } } as ScrubbableEvent)
        ?.user,
    ).toEqual({ id: 42 });
    expect(
      scrubSentryEvent({
        user: { id: '069a79f4-44e9-4726-a5be-fca90e38aaf5' },
      } as ScrubbableEvent)?.user,
    ).toEqual({});
  });

  // A self-referential `cause` is a shape this codebase actually produces —
  // see the global exception filter's spec. An infinite walk inside beforeSend
  // would hang the reporting path, the worst place to find out.
  it('survives a cyclic object graph', () => {
    const cyclic: Record<string, unknown> = { name: 'boom' };
    cyclic['self'] = cyclic;
    expect(() =>
      scrubSentryEvent({ extra: cyclic } as ScrubbableEvent),
    ).not.toThrow();
  });
});
