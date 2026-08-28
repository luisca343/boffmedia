/**
 * How a Minecraft username becomes a Rooker handle.
 *
 * One definition, three consumers: the runtime path that provisions a profile when a
 * SmartRotom user is created, the backfill seed for players who predate it, and the
 * generated SQL that mirrors the seed. They must agree — a handle is the identity
 * players link to, so two implementations drifting apart would mean the same player
 * getting different handles depending on which door they came through.
 */

/** `rotom_rooker_profiles.handle` is `^[a-z0-9_]{3,32}$`, enforced by the service too. */
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 32;

/**
 * The handle a username wants, before collisions are considered: lowercase, anything
 * outside `[a-z0-9_]` becomes `_`, cut to 32, padded up to 3 so a one-character name is
 * still a legal handle.
 */
export function baseHandle(username: string): string {
  const cleaned = username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, HANDLE_MAX);
  return cleaned.length >= HANDLE_MIN
    ? cleaned
    : cleaned.padEnd(HANDLE_MIN, '_');
}

/**
 * The handles to try, in order: the base first, then `base2`, `base3`, … with the base
 * trimmed so the suffix still fits inside 32 characters.
 *
 * Infinite by design — the caller decides when to stop, because the two callers stop for
 * different reasons. The seed holds every taken handle in memory and can just take the
 * first free one; the runtime has to ask the database, so it bounds the number of round
 * trips it is willing to make.
 */
export function* handleCandidates(base: string): Generator<string> {
  yield base;
  for (let n = 2; ; n++) {
    const suffix = String(n);
    yield `${base.slice(0, HANDLE_MAX - suffix.length)}${suffix}`;
  }
}

/**
 * The first candidate not already in `taken`. Two players can sanitise to the same
 * handle ("Ash!" and "ash?" both become "ash_"); the first one keeps it.
 */
export function dedupeHandle(base: string, taken: ReadonlySet<string>): string {
  for (const candidate of handleCandidates(base)) {
    if (!taken.has(candidate)) return candidate;
  }
  /* istanbul ignore next — the generator never ends. */
  throw new Error('unreachable');
}
