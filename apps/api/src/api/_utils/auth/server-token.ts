import { env } from '@/config/env';
import { matchesSecret } from './secret-compare';

// Re-exported so the many existing importers of `server-token` keep working;
// the implementations live in `secret-compare.ts`, which stays free of `env`
// so it can be unit-tested without dragging the config schema into the spec.
export { extractBearer, matchesSecret } from './secret-compare';

/**
 * Is this the Minecraft mod? Constant-time compare against `TERAS_API_TOKEN` —
 * the same value as the mod's `TerasConfig.apiToken`, which it sends as a Bearer.
 *
 * An unset `TERAS_API_TOKEN` matches nothing (fail-closed) rather than matching
 * every request.
 */
export function matchesServerToken(bearer: string): boolean {
  return matchesSecret(bearer, env.TERAS_API_TOKEN);
}
