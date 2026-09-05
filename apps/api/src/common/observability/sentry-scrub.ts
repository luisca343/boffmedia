/**
 * PII scrubbing for every event this API sends to Sentry.
 *
 * Deliberately ONE function rather than a spread of `denyUrls` / `sendDefaultPii`
 * / `ignoreErrors` options: what leaves this process has to be reviewable in a
 * single read, and Sentry's own options only cover the fields Sentry knows
 * about. Ours end up in exception messages, breadcrumb strings and `extra`
 * blobs, which no SDK option touches.
 *
 * The two identifiers that matter most here are the user's email address and
 * `rotom_users.uuid` (the Minecraft UUID) — the latter is an FK in 27 tables,
 * so it turns up in half the error messages this API can produce. Both are
 * caught by VALUE, not only by key name, because they arrive most often inside
 * free text ("no pack access for 0a1b...").
 */

/** What a Sentry event looks like from the outside — see the note in `sentry.ts` on why we do not import the SDK's types. */
export interface ScrubbableEvent {
  request?: {
    data?: unknown;
    cookies?: unknown;
    query_string?: unknown;
    headers?: Record<string, unknown>;
    url?: unknown;
    [k: string]: unknown;
  };
  user?: Record<string, unknown>;
  [k: string]: unknown;
}

export const REDACTED = '[redacted]';

/**
 * Keys whose VALUE is dropped whole, whatever it looks like. Substring match,
 * case-insensitive, so `X-Refresh-Token`, `userEmail` and `db_password` all hit.
 */
const SENSITIVE_KEY =
  /authorization|cookie|token|secret|password|passwd|api[-_]?key|jwt|session|credential|dsn|email|correo|uuid|ip[-_]?address|remote[-_]?addr/i;

/**
 * The only request headers worth keeping. An allowlist rather than a denylist:
 * a header added upstream (a proxy stamping the real IP, an auth gateway
 * forwarding a subject claim) must not become a leak because nobody remembered
 * to add it to a list of bad names.
 */
const KEEP_HEADERS = new Set(['user-agent', 'content-type', 'accept-language']);

/** Patterns redacted anywhere inside a string value. Order is irrelevant; all are applied. */
const VALUE_PATTERNS: readonly RegExp[] = [
  // Email addresses.
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  // JWTs and anything else shaped like `xxx.yyy.zzz` in base64url.
  /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
  // `Bearer <anything>` / `Basic <anything>`.
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  // Minecraft UUIDs: dashed and the undashed 32-hex form the mod sends.
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b[0-9a-f]{32}\b/gi,
  // IPv4 (with an optional port).
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g,
  // IPv6, full and compressed. The lookahead demanding a hex LETTER is what
  // keeps the `12:34:56` inside an ISO timestamp from being read as an address —
  // an over-eager IPv6 pattern redacts every log line that mentions a time.
  /\b(?=[0-9a-f:]*[a-f])(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}\b/gi,
  /\b(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4}\b/gi,
];

/**
 * Recursion is bounded twice over: `MAX_DEPTH` for deep object graphs and a
 * `seen` set for cycles. An error object with a self-referential `cause` is a
 * shape this codebase actually produces (see the global exception filter's
 * spec), and an infinite walk inside `beforeSend` would hang the reporting path
 * rather than the request — the worst possible place to discover it.
 */
const MAX_DEPTH = 8;
// Generous, but bounded: `beforeSend` runs on the error path, so a pathological
// string must not turn one 500 into a stalled worker. Stack frames arrive as
// structured `exception.values[].stacktrace.frames`, not as one long string, so
// this cap does not cost us the trace.
const MAX_STRING = 20000;

function scrubString(value: string): string {
  let out =
    value.length > MAX_STRING ? value.slice(0, MAX_STRING) + '…' : value;
  for (const pattern of VALUE_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

function scrubValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === 'string') return scrubString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return REDACTED;
  if (seen.has(value)) return REDACTED;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key)
      ? REDACTED
      : scrubValue(item, depth + 1, seen);
  }
  return out;
}

/**
 * The `beforeSend` hook. Returns the event with every string in it rewritten,
 * or `null` to drop the event entirely — callers must forward `null` to Sentry
 * unchanged, that is how the SDK is told not to send.
 */
export function scrubSentryEvent<T extends ScrubbableEvent>(
  event: T,
): T | null {
  if (!event || typeof event !== 'object') return null;

  // Request bodies never go: they carry passwords on /auth/login, team
  // payloads, chat text. There is no version of this we want in a SaaS.
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    // The query string is where our own redirect/token params live, and it is
    // already duplicated in `request.url` — which the generic walk below cleans.
    delete event.request.query_string;
    if (event.request.headers && typeof event.request.headers === 'object') {
      const kept: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(event.request.headers)) {
        if (KEEP_HEADERS.has(name.toLowerCase())) kept[name] = value;
      }
      event.request.headers = kept;
    }
  }

  // `event.user` is the field Sentry itself fills, and every identifier we
  // could put in it is one of the two we are trying not to leak. Keep only an
  // id that is plainly our own numeric `users.id` — a UUID or an email in that
  // slot is dropped rather than hashed, because a stable hash of a small user
  // base is still an identifier.
  if (event.user) {
    const id = event.user['id'];
    const numericId =
      typeof id === 'number' ||
      (typeof id === 'string' && /^\d{1,12}$/.test(id))
        ? id
        : undefined;
    event.user = numericId === undefined ? {} : { id: numericId };
  }

  return scrubValue(event, 0, new WeakSet()) as T;
}
