import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import {
  DomainError,
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors/domain-error';
import { fakeArgumentsHost } from '@/_testing/nest-context';

/**
 * The shape drizzle actually throws: its own Error whose message is only the
 * failed SQL, with the mysql2 error (the one carrying ER_DUP_ENTRY) on `cause`.
 * A transaction adds a second wrapper on top of that.
 */
function drizzleWrapped(depth: number): Error {
  const driver = Object.assign(
    new Error("Duplicate entry 'verify:1:a@b.c' for key 'outbox_dedupe_uq'"),
    { code: 'ER_DUP_ENTRY', errno: 1062 },
  );
  let err: Error = driver;
  for (let i = 0; i < depth; i++) {
    err = Object.assign(
      new Error('Failed query: insert into `boffmedia_outbox` ...'),
      { cause: err },
    );
  }
  return err;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter({
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    } as never);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = fakeArgumentsHost({
      request: { url: '/auth/resend-verification', method: 'POST' },
      response: { status },
    });
  });

  describe('unique-key collisions', () => {
    it('answers 409 for a bare mysql2 duplicate-entry error', () => {
      filter.catch(drizzleWrapped(0), host);
      expect(status).toHaveBeenCalledWith(409);
    });

    // The regression: drizzle's wrapper has no `code` and its message is only
    // the SQL, so checking the outermost error alone let this escape as a 500.
    it('answers 409 when drizzle has wrapped the driver error', () => {
      filter.catch(drizzleWrapped(1), host);
      expect(status).toHaveBeenCalledWith(409);
    });

    it('answers 409 through a transaction wrapper on top of that', () => {
      filter.catch(drizzleWrapped(2), host);
      expect(status).toHaveBeenCalledWith(409);
    });
  });

  it('does not mistake an unrelated failure for a conflict', () => {
    filter.catch(new Error('connection lost'), host);
    expect(status).toHaveBeenCalledWith(500);
  });

  it('leaves ordinary HttpExceptions alone', () => {
    filter.catch(new BadRequestException('nope'), host);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('survives a self-referential cause chain', () => {
    const err = new Error('boom') as Error & { cause?: unknown };
    err.cause = err;
    expect(() => filter.catch(err, host)).not.toThrow();
    expect(status).toHaveBeenCalledWith(500);
  });

  describe('domain errors', () => {
    it('maps each kind to its status and keeps the catalogued code', () => {
      const cases: Array<[DomainError, number, string]> = [
        [new ValidationError('ACTOR_NOT_SELF', 'bad input'), 400, 'BAD_REQUEST'],
        [
          new UnauthorizedError('AUTH_INVALID_CREDENTIALS', 'no'),
          401,
          'UNAUTHORIZED',
        ],
        [new ForbiddenError('ACTOR_NOT_SELF', 'nope'), 403, 'FORBIDDEN'],
        [new NotFoundError('ACTOR_NOT_SELF', 'gone'), 404, 'NOT_FOUND'],
        [new ConflictError('ACTOR_NOT_SELF', 'taken'), 409, 'CONFLICT'],
      ];

      for (const [err, expectedStatus, expectedLabel] of cases) {
        status.mockClear();
        json.mockClear();
        filter.catch(err, host);
        expect(status).toHaveBeenCalledWith(expectedStatus);
        expect(json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: expectedStatus,
            error: expectedLabel,
            code: err.code,
          }),
        );
      }
    });

    // The regression this guards: domain errors first shipped with their own
    // @Catch filter, whose body had no `error`, `timestamp` or `path`. Migrating
    // a service from HttpException to DomainError therefore dropped three fields
    // from its responses, and no test noticed.
    it('returns the same body shape as every other error', () => {
      filter.catch(new BadRequestException('nope'), host);
      const httpBody = json.mock.calls[0][0] as Record<string, unknown>;

      json.mockClear();
      status.mockClear();
      filter.catch(new ValidationError('ACTOR_NOT_SELF', 'nope'), host);
      const domainBody = json.mock.calls[0][0] as Record<string, unknown>;

      expect(Object.keys(domainBody).sort()).toEqual(
        Object.keys(httpBody).sort(),
      );
      expect(domainBody['path']).toBe(httpBody['path']);
      expect(typeof domainBody['timestamp']).toBe('string');
    });

    it('falls back to the catalogued Spanish text as the user message', () => {
      const err = new ConflictError('ACTOR_NOT_SELF', 'internal detail');
      filter.catch(err, host);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'internal detail',
          userMessage: err.userMessage(),
        }),
      );
    });

  });

});
