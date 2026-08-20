import { extractBearer, matchesSecret } from './secret-compare';

// extractBearer only ever reads `headers`.
const req = (authorization?: string): any => ({
  headers: authorization ? { authorization } : {},
});

describe('extractBearer', () => {
  it('reads a Bearer token', () => {
    expect(extractBearer(req('Bearer abc123'))).toBe('abc123');
  });

  it('is case-insensitive on the scheme', () => {
    expect(extractBearer(req('bearer abc123'))).toBe('abc123');
  });

  it('returns null for a missing, blank or non-Bearer header', () => {
    expect(extractBearer(req())).toBeNull();
    expect(extractBearer(req('Bearer    '))).toBeNull();
    expect(extractBearer(req('Basic abc123'))).toBeNull();
  });
});

describe('matchesSecret', () => {
  it('matches an identical secret', () => {
    expect(matchesSecret('s3cret', 's3cret')).toBe(true);
  });

  it('rejects a different secret of the same length', () => {
    expect(matchesSecret('s3cret', 's3cr3t')).toBe(false);
  });

  // timingSafeEqual throws on differing lengths; the length guard must catch
  // that rather than letting it escape as a 500.
  it('rejects a different length without throwing', () => {
    expect(() => matchesSecret('short', 'much-longer-secret')).not.toThrow();
    expect(matchesSecret('short', 'much-longer-secret')).toBe(false);
  });

  // Every caller depends on this: an unconfigured token must reject everything,
  // never accept everything. POST /sharex is @Public(), so for that route this
  // is the only thing standing between the disk and an anonymous caller.
  it('fails CLOSED when the expected secret is unset or empty', () => {
    expect(matchesSecret('anything', undefined)).toBe(false);
    expect(matchesSecret('anything', '')).toBe(false);
    expect(matchesSecret('', '')).toBe(false);
  });
});
