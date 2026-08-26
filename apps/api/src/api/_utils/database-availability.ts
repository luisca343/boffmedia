import { ServiceUnavailableException } from '@nestjs/common';
import { ApiErrorCode, userError } from '../../common/errors/user-error';

/**
 * Transport-level failures: the database was never reached, so nothing is known
 * about the row that was asked for. These are the codes mysql2 raises for a
 * socket that could not be opened, completed or kept alive — plus the two pool
 * states that mean the same thing from the caller's side.
 *
 * A query that REACHED the server and was rejected (bad SQL, constraint
 * violation, denied grant) is deliberately absent: that is a defect in this
 * application, it is not retryable, and it must keep surfacing as a 500 rather
 * than as "come back later".
 */
const TRANSPORT_ERROR_CODES: ReadonlySet<string> = new Set([
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'POOL_CLOSED',
  'POOL_ENQUEUELIMIT',
  'ER_CON_COUNT_ERROR',
]);

// Drizzle reports a failed query as a DrizzleQueryError whose `cause` carries
// the driver error, and a pool can add another wrap on top — so the code is
// never on the object that was thrown. The bound stops a self-referential
// `cause` chain from spinning.
const MAX_CAUSE_DEPTH = 5;

/**
 * True when `error` (or anything it wraps) is a failure to reach the database
 * rather than a failure of the query itself.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  let current: unknown = error;

  for (
    let depth = 0;
    current !== null && current !== undefined && depth < MAX_CAUSE_DEPTH;
    depth++
  ) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && TRANSPORT_ERROR_CODES.has(code))
      return true;
    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

/**
 * Rethrows an unreachable database as a 503 and returns otherwise, so a caller
 * can put it in front of an existing `catch` without changing what that catch
 * does for every other error:
 *
 *   } catch (error) {
 *     throwIfDatabaseUnavailable(error);
 *     return null;          // still the answer for a genuinely absent row
 *   }
 *
 * The distinction matters most on the auth path. A `catch` that answers `null`
 * for every failure tells the caller "no such user" when the truth is "nothing
 * was asked" — which reaches the client as 401 Invalid credentials, emits no
 * 5xx for monitoring to see, and (because AuthThrottlerGuard keys on the
 * submitted username) spends that account's rate-limit budget on an outage the
 * user cannot do anything about.
 */
export function throwIfDatabaseUnavailable(error: unknown): void {
  if (error instanceof ServiceUnavailableException) throw error;
  if (!isDatabaseUnavailable(error)) return;

  throw new ServiceUnavailableException(
    userError(
      ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE,
      'Database unreachable',
    ),
  );
}
