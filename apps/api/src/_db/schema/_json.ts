import { customType } from 'drizzle-orm/mysql-core';

/**
 * A JSON column that is still an object after a round-trip through MariaDB.
 *
 * MariaDB has no native JSON type: `JSON` is an alias for `LONGTEXT` plus a
 * `CHECK (json_valid(...))` constraint, so `SHOW COLUMNS` reports `longtext`.
 * mysql2 therefore has no JSON column to recognise and hands back the raw
 * string — while drizzle's built-in `json()` assumes the driver already parsed
 * it and passes the value through untouched.
 *
 * The result is silent, not loud: every read gives a string, so
 * `const { to } = row.payload` yields `undefined` instead of throwing, and the
 * failure only surfaces wherever that value finally lands. It cost us a
 * verification email that the outbox happily marked `delivered` after Resend
 * rejected it with "Missing `to` field".
 *
 * `dataType()` stays `json`, so the generated DDL is byte-identical to
 * `json()`'s and swapping a column over needs no migration. `fromDriver`
 * tolerates a non-string too, so this keeps working unchanged if the database
 * is ever moved to MySQL, where the driver *does* parse.
 */
export const jsonColumn = customType<{
  data: unknown;
  driverData: string;
}>({
  dataType() {
    return 'json';
  },
  toDriver(value): string {
    return JSON.stringify(value);
  },
  fromDriver(value): unknown {
    // Not `typeof value === 'string'` alone: MySQL and MariaDB disagree about
    // what arrives here, and only the string case needs parsing. A malformed
    // payload throws, which is what the `json_valid` CHECK makes unreachable —
    // and is still better than handing a handler a string it will destructure
    // into undefined.
    return typeof value === 'string' ? JSON.parse(value) : value;
  },
});
