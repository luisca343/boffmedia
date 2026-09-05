import { EnvValidationError, envSchema, parseEnv } from './env';

/**
 * A12. The point of this spec is not that zod works — it is that the boot
 * failure NAMES the variable.
 *
 * Before this file existed the schema already threw on a bad environment, so
 * the finding's "no fail-fast validation" was half wrong. What was missing is
 * the half an operator actually needs: a ZodError reaches the console as a JSON
 * dump of `issues`, each carrying the variable name inside a `path` array, and
 * it arrives inside a Nest bootstrap stack trace. Every assertion below is
 * about the report, and every one of them fails if `formatIssues` is removed.
 */

/** The smallest environment the schema accepts — mirrors jest.setup.ts. */
function validEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    DB_HOST: 'localhost',
    DB_USER: 'test',
    DB_PASSWORD: 'test',
    DB_NAME: 'test',
    WINGULL_DB_NAME: 'wingull_test',
    JWT_SECRET: 'test-secret-that-is-long-enough-32chars',
    GOOGLE_CLIENT_ID: 'id',
    GOOGLE_CLIENT_SECRET: 'secret',
    MC_WORLD: 'world',
    WINGULL_API: 'http://localhost:8080',
  };
}

describe('parseEnv', () => {
  it('accepts the minimum environment and applies defaults', () => {
    const parsed = parseEnv(validEnv());
    expect(parsed.PORT).toBe(34301);
    expect(parsed.DISCORD_BOT_ENABLED).toBe(true);
    expect(parsed.WIGGLYPOP_ATOMIC_CUSTODY).toBe(false);
  });

  it('names a missing variable and says it is unset, not "expected string"', () => {
    const source = validEnv();
    delete source.JWT_SECRET;

    let thrown: unknown;
    try {
      parseEnv(source);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(EnvValidationError);
    const err = thrown as EnvValidationError;
    expect(err.problems).toEqual([
      { key: 'JWT_SECRET', message: 'is required but is not set' },
    ]);
    expect(err.message).toContain('JWT_SECRET — is required but is not set');
    // The whole reason the message exists rather than a raw ZodError.
    expect(err.message).toContain('apps/api/.env.example');
  });

  it('treats an empty string as unset — the shape a half-filled .env produces', () => {
    // A key present but blank is what an operator most often has: the line is
    // in the .env, the value never got pasted in. zod objects with a type or
    // length message; the report has to say "not set", because that is the
    // action.
    const source: NodeJS.ProcessEnv = { ...validEnv(), JWT_SECRET: '' };

    try {
      parseEnv(source);
      fail('expected parseEnv to throw');
    } catch (e) {
      expect((e as EnvValidationError).problems).toContainEqual({
        key: 'JWT_SECRET',
        message: 'is required but is not set',
      });
    }
  });

  it('keeps a value-level message when the key IS set', () => {
    const source = { ...validEnv(), JWT_SECRET: 'too-short' };
    try {
      parseEnv(source);
      fail('expected parseEnv to throw');
    } catch (e) {
      const err = e as EnvValidationError;
      expect(err.problems).toHaveLength(1);
      expect(err.problems[0].key).toBe('JWT_SECRET');
      // Not "is required": the key is present, the value is wrong.
      expect(err.problems[0].message).not.toContain('is required');
      expect(err.problems[0].message).toMatch(/32/);
    }
  });

  it('reports EVERY problem at once, not the first', () => {
    const source = validEnv();
    delete source.DB_HOST;
    delete source.DB_USER;
    delete source.MC_WORLD;
    source.JWT_SECRET = 'short';

    try {
      parseEnv(source);
      fail('expected parseEnv to throw');
    } catch (e) {
      const keys = (e as EnvValidationError).problems.map((p) => p.key).sort();
      expect(keys).toEqual(['DB_HOST', 'DB_USER', 'JWT_SECRET', 'MC_WORLD']);
      expect((e as EnvValidationError).message).toContain('4 problems');
    }
  });

  it('rejects a production boot pointed at localhost (the superRefine)', () => {
    const source = {
      ...validEnv(),
      NODE_ENV: 'production',
      WEB_URL: 'http://localhost:3000',
    };
    try {
      parseEnv(source);
      fail('expected parseEnv to throw');
    } catch (e) {
      expect((e as EnvValidationError).problems[0].key).toBe('WEB_URL');
    }
  });

  it('validates SECRET_ENCRYPTION_KEY as 64 hex characters when present', () => {
    expect(() =>
      parseEnv({ ...validEnv(), SECRET_ENCRYPTION_KEY: 'nope' }),
    ).toThrow(EnvValidationError);
    expect(() =>
      parseEnv({ ...validEnv(), SECRET_ENCRYPTION_KEY: 'a'.repeat(64) }),
    ).not.toThrow();
  });

  it('exports the schema so the .env.example gate can read its key list', () => {
    // scripts/check-env-example.mjs walks this shape. If the export shape
    // changes, that gate stops finding keys — and a gate that finds nothing
    // passes.
    const keys = Object.keys(envSchema.def.shape as Record<string, unknown>);
    expect(keys).toContain('JWT_SECRET');
    expect(keys.length).toBeGreaterThan(50);
  });
});
