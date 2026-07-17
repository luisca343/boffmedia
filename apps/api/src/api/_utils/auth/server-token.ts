import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { env } from '@/config/env';

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
 * Is this the Minecraft mod? Constant-time compare against `TERAS_API_TOKEN` —
 * the same value as the mod's `TerasConfig.apiToken`, which it sends as a Bearer.
 *
 * Length is checked first because `timingSafeEqual` throws on differing lengths;
 * that leaks only the length, which the token's secrecy does not rest on. An
 * unset `TERAS_API_TOKEN` matches nothing (fail-closed) rather than matching
 * every request.
 */
export function matchesServerToken(bearer: string): boolean {
  const expected = env.TERAS_API_TOKEN;
  if (!expected) return false;

  const a = Buffer.from(bearer, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
