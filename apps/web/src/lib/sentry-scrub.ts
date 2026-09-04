/**
 * PII scrubbing for every event this web app sends to Sentry — browser, server
 * and edge alike.
 *
 * A deliberate near-copy of `apps/api/src/common/observability/sentry-scrub.ts`
 * rather than a shared package: the two run in different processes with
 * different leak surfaces (this one has to worry about URLs and breadcrumbs
 * from fetch/navigation, the API about request bodies), and the whole point of
 * the rule is that each platform's scrubber can be reviewed on its own in one
 * read. `@boffmedia/ui` is not an option either — it must stay host-agnostic
 * and Sentry does not belong in it.
 *
 * The two identifiers that matter most are the signed-in user's email address
 * and `rotom_users.uuid` (the Minecraft UUID). Both are caught by VALUE, not
 * only by key name, because on the client they mostly arrive inside URLs and
 * free-text error messages.
 */

/** What a Sentry event looks like from the outside — see `sentry.ts` on why we do not import the SDK's types. */
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

export const REDACTED = "[redacted]";

/** Keys whose value is dropped whole. Substring match, case-insensitive. */
const SENSITIVE_KEY =
  /authorization|cookie|token|secret|password|passwd|api[-_]?key|jwt|session|credential|dsn|email|correo|uuid|ip[-_]?address/i;

/**
 * Allowlist, not a denylist: a header added by a proxy or an auth gateway must
 * not become a leak because nobody remembered to add its name to a bad-list.
 */
const KEEP_HEADERS = new Set(["user-agent", "content-type", "accept-language"]);

const VALUE_PATTERNS: readonly RegExp[] = [
  // Email addresses.
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  // JWTs — a NextAuth session token in a breadcrumb URL looks exactly like this.
  /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  // Minecraft UUIDs: dashed and the undashed 32-hex form.
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b[0-9a-f]{32}\b/gi,
  // IPv4 with an optional port.
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g,
  // IPv6, full and compressed. The lookahead demanding a hex LETTER is what
  // keeps the `12:34:56` inside an ISO timestamp from being read as an address.
  /\b(?=[0-9a-f:]*[a-f])(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}\b/gi,
  /\b(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4}\b/gi,
];

/**
 * Query strings are dropped from any URL-looking string rather than pattern
 * matched: `?redirect=`, `?token=`, `?email=` and the OAuth callback params all
 * live there, and the path alone is what makes an event groupable.
 */
const URL_WITH_QUERY = /((?:https?:)?\/\/[^\s"'<>]+?|\/[^\s"'<>?]*)\?[^\s"'<>]*/g;

const MAX_DEPTH = 8;
const MAX_STRING = 20000;

function scrubString(value: string): string {
  let out =
    value.length > MAX_STRING ? value.slice(0, MAX_STRING) + "…" : value;
  out = out.replace(URL_WITH_QUERY, "$1?" + REDACTED);
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
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
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
 * The `beforeSend` hook. Returns the rewritten event, or `null` to drop it —
 * callers must forward `null` to Sentry unchanged, that is how the SDK is told
 * not to send.
 */
export function scrubSentryEvent<T extends ScrubbableEvent>(
  event: T,
): T | null {
  if (!event || typeof event !== "object") return null;

  if (event.request) {
    // Request bodies never go: server actions and route handlers carry
    // passwords, chat text and team payloads through here.
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.headers && typeof event.request.headers === "object") {
      const kept: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(event.request.headers)) {
        if (KEEP_HEADERS.has(name.toLowerCase())) kept[name] = value;
      }
      event.request.headers = kept;
    }
  }

  // Every identifier we could put in `event.user` is one of the two we are
  // trying not to leak. Keep only a plainly-numeric `users.id`; a UUID or an
  // email in that slot is dropped rather than hashed, because a stable hash of
  // a small user base is still an identifier.
  if (event.user) {
    const id = event.user["id"];
    const numericId =
      typeof id === "number" ||
      (typeof id === "string" && /^\d{1,12}$/.test(id))
        ? id
        : undefined;
    event.user = numericId === undefined ? {} : { id: numericId };
  }

  return scrubValue(event, 0, new WeakSet()) as T;
}
