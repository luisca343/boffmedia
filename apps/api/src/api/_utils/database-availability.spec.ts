import { ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import {
  isDatabaseUnavailable,
  throwIfDatabaseUnavailable,
} from './database-availability';

/**
 * The shape drizzle actually throws — reproduced from a real login failure:
 * a DrizzleQueryError carrying the SQL, with the driver error underneath as
 * `cause`. The code is never on the thrown object itself, which is the whole
 * reason the classifier walks the chain.
 */
function drizzleQueryError(driverCode: string): Error {
  const err = new Error('Failed query: select `boffmedia_users`.`id` …') as Error & {
    cause?: unknown;
  };
  err.name = 'DrizzleQueryError';
  err.cause = Object.assign(new Error(`connect ${driverCode}`), {
    code: driverCode,
  });
  return err;
}

describe('isDatabaseUnavailable', () => {
  it('sees the driver code through a DrizzleQueryError wrap', () => {
    expect(isDatabaseUnavailable(drizzleQueryError('ETIMEDOUT'))).toBe(true);
  });

  it.each([
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'PROTOCOL_CONNECTION_LOST',
    'POOL_ENQUEUELIMIT',
  ])('treats %s as unreachable', (code) => {
    expect(isDatabaseUnavailable(Object.assign(new Error(code), { code }))).toBe(
      true,
    );
  });

  it('does NOT claim a query the server answered and rejected', () => {
    // Reached the database, was refused: an application defect, not an outage.
    // Calling this retryable would hide a real bug behind "come back later".
    const rejected = Object.assign(new Error('Unknown column'), {
      code: 'ER_BAD_FIELD_ERROR',
    });
    expect(isDatabaseUnavailable(rejected)).toBe(false);
  });

  it('does NOT claim a plain error, a null, or a rewrapped message', () => {
    expect(isDatabaseUnavailable(new Error('Invalid password'))).toBe(false);
    expect(isDatabaseUnavailable(null)).toBe(false);
    // The message mentions ETIMEDOUT but no `code` survives — the classifier
    // must key on the code, never on message text.
    expect(isDatabaseUnavailable(new Error('… connect ETIMEDOUT'))).toBe(false);
  });

  it('terminates on a self-referential cause chain', () => {
    const a = new Error('a') as Error & { cause?: unknown };
    a.cause = a;
    expect(isDatabaseUnavailable(a)).toBe(false);
  });
});

describe('throwIfDatabaseUnavailable', () => {
  it('converts an unreachable database into a 503', () => {
    let thrown: unknown;
    try {
      throwIfDatabaseUnavailable(drizzleQueryError('ETIMEDOUT'));
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(ServiceUnavailableException);
    expect((thrown as ServiceUnavailableException).getStatus()).toBe(503);
    expect((thrown as ServiceUnavailableException).getResponse()).toMatchObject({
      code: 'SERVICE_DATABASE_UNAVAILABLE',
    });
  });

  it('returns quietly for a wrong password, so the caller still answers 401', () => {
    expect(() =>
      throwIfDatabaseUnavailable(new Error('bad credentials')),
    ).not.toThrow();
  });

  it('does not upgrade an unrelated typed error', () => {
    expect(() =>
      throwIfDatabaseUnavailable(new NotFoundException('no such user')),
    ).not.toThrow();
  });

  it('passes an already-classified 503 straight through', () => {
    const original = new ServiceUnavailableException('already classified');
    expect(() => throwIfDatabaseUnavailable(original)).toThrow(original);
  });
});
