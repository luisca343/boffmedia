import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

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
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/auth/resend-verification', method: 'POST' }),
      }),
    } as never;
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
});
