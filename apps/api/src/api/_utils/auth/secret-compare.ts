import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Credential primitives, deliberately free of any `@/config/env` import.
 *
 * `env` is a large zod schema, and ts-jest type-checks the whole transitive
 * graph of every spec it compiles — a spec that reaches `env` costs enough heap
 * to push the API suite over its limit. Keeping these two functions env-free is
 * what makes them directly unit-testable; the env-aware wrappers that bind them
 * to specific tokens live in `server-token.ts`.
 */

/** The Bearer token on a request, or null if absent/blank/not a Bearer. */
export function extractBearer(req: Request): string | null {
  const header = req.headers['authorization'];
  if (typeof header !== 'string') return null;
  const [scheme, ...rest] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  const token = rest.join(' ').trim();
  return token.length > 0 ? token : null;
}

/**
 * Constant-time compare of a caller-supplied secret against the expected one.
 *
 * Length is checked first because `timingSafeEqual` throws on differing lengths;
 * that leaks only the length, which a token's secrecy does not rest on. An unset
 * or empty `expected` matches nothing (fail-closed) rather than matching every
 * request — the property every caller depends on.
 */
export function matchesSecret(
  candidate: string,
  expected: string | undefined,
): boolean {
  if (!expected) return false;

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
