import { env } from '@/config/env';
import { scrubSentryEvent, ScrubbableEvent } from './sentry-scrub';

/**
 * Sentry for the API — error reporting only, no tracing, no profiling.
 *
 * Two properties this file exists to guarantee:
 *
 *  1. INERT WITHOUT A DSN. `SENTRY_DSN` is optional in `config/env.ts`, like
 *     TERAS_API_TOKEN and SECRET_ENCRYPTION_KEY. Unset means the SDK is never
 *     even `require()`d — not "initialised with a null transport". Dev, the
 *     test suite and any box without the variable carry no Sentry at all and
 *     print nothing about it.
 *
 *  2. NO HARD DEPENDENCY AT BUILD TIME. `@sentry/node` is loaded through
 *     `require` inside a try/catch rather than imported. The package is declared
 *     in package.json, but the API has to keep booting on a checkout where the
 *     install has not run yet, and `nest build` has to keep type-checking on
 *     one too. The cost is that we describe the two SDK calls we make ourselves
 *     (`SentryLike` below) instead of importing the SDK's types; that is a
 *     deliberate trade, not an oversight.
 */
interface SentryLike {
  init(options: Record<string, unknown>): void;
  captureException(exception: unknown, hint?: Record<string, unknown>): string;
  flush(timeout?: number): Promise<boolean>;
}

let sentry: SentryLike | null = null;

/** Extra tags attached to every event. `path`/`method` come from the exception filter. */
export interface CaptureContext {
  /** Where the throw was caught, e.g. 'http' or 'uncaughtException'. */
  mechanism: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

function resolveRelease(): string {
  if (env.SENTRY_RELEASE) return env.SENTRY_RELEASE;
  try {
    // Resolves to apps/api/package.json from both src/common/observability (jest,
    // ts-node) and dist/common/observability (production) — the depth is the same.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic load to resolve from correct directory in jest vs production
    const pkg = require('../../../package.json') as { version?: string };
    return `api@${pkg.version ?? '0.0.0'}`;
  } catch {
    return 'api@unknown';
  }
}

/**
 * Called once, first thing in `bootstrap()`. Returns whether Sentry is live so
 * the caller can log it; never throws.
 */
export function initSentry(): boolean {
  if (sentry) return true;
  if (!env.SENTRY_DSN) return false;

  let mod: SentryLike;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Lazy load Sentry only when DSN is configured
    mod = require('@sentry/node') as SentryLike;
  } catch {
    // A DSN was configured but the package is missing — that is a deployment
    // mistake worth one line on stderr, not a boot failure.
    console.warn(
      '[sentry] SENTRY_DSN is set but @sentry/node is not installed — error ' +
        'reporting is off. Run `pnpm install` in apps/api.',
    );
    return false;
  }

  mod.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: resolveRelease(),
    // Errors only. Turning this up buys performance data at the price of a
    // span on every request, and the API already has Prometheus for that.
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    // Belt to the scrubber's braces: with this off the SDK does not attach the
    // client IP, cookies or the request body in the first place. We still run
    // `beforeSend`, because the fields that leak are the ones we wrote.
    sendDefaultPii: false,
    beforeSend: (event: ScrubbableEvent) => scrubSentryEvent(event),
    beforeSendTransaction: (event: ScrubbableEvent) => scrubSentryEvent(event),
    beforeBreadcrumb: (breadcrumb: ScrubbableEvent) =>
      scrubSentryEvent(breadcrumb),
  });

  sentry = mod;
  return true;
}

/**
 * Report one exception. A no-op when Sentry is not initialised, so call sites
 * never have to ask whether it is on.
 */
export function captureApiException(
  exception: unknown,
  context: CaptureContext,
): void {
  if (!sentry) return;
  try {
    sentry.captureException(exception, {
      tags: {
        mechanism: context.mechanism,
        ...(context.method ? { method: context.method } : {}),
        ...(context.statusCode
          ? { status_code: String(context.statusCode) }
          : {}),
      },
      // The path is a route template's worth of information but can carry ids;
      // it goes through the same scrubber as everything else via beforeSend.
      extra: context.path ? { path: context.path } : {},
    });
  } catch {
    // Reporting an error must never become the error. Swallow.
  }
}

/**
 * Drain the buffer. Only meaningful on the way out of the process — everywhere
 * else Sentry's own batching is fine. Resolves immediately when Sentry is off,
 * so an exit path that awaits this is unchanged on a box with no DSN.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentry) return;
  try {
    await sentry.flush(timeoutMs);
  } catch {
    // Same reason as above.
  }
}

/** Test seam: forget the initialised client so a spec can re-init. */
export function __resetSentryForTests(): void {
  sentry = null;
}
