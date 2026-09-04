import { env } from "@/config/env.public";
import { scrubSentryEvent, type ScrubbableEvent } from "./sentry-scrub";

/**
 * Sentry for the web app — one module for all three runtimes (browser, Node
 * server, edge). `@sentry/nextjs` is the same package in all of them, so the
 * only thing that differs is who calls `initSentry` and with what tag.
 *
 * Two properties this file exists to guarantee:
 *
 *  1. INERT WITHOUT A DSN. `NEXT_PUBLIC_SENTRY_DSN` defaults to '' in
 *     `config/env.public.ts`. Empty means the SDK is never imported at all —
 *     not "imported and given a null transport". A dev box, a preview build and
 *     the test suite carry no Sentry and log nothing about it.
 *
 *  2. NO HARD DEPENDENCY AT BUILD TIME. The package is declared in
 *     package.json, but `pnpm type-check` has to stay green on a checkout where
 *     the install has not run yet — hence the guarded dynamic import and the
 *     single `@ts-ignore` below, which is the only way to say "this specifier
 *     may not resolve yet" without shadowing the real types once it does.
 *     `@ts-expect-error` would be wrong here: it inverts into an error the
 *     moment the package IS installed.
 */
interface SentryLike {
  init(options: Record<string, unknown>): void;
  captureException(exception: unknown, hint?: Record<string, unknown>): string;
  captureRequestError?(
    error: unknown,
    request: unknown,
    context: unknown,
  ): void;
  captureRouterTransitionStart?(href: string, navigationType: string): void;
}

let sentry: SentryLike | null = null;
let loading: Promise<SentryLike | null> | null = null;

/** Which runtime is reporting. Becomes the `runtime` tag on every event. */
export type SentryRuntime = "browser" | "server" | "edge";

function options(runtime: SentryRuntime): Record<string, unknown> {
  return {
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || env.NODE_ENV,
    release: env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    initialScope: { tags: { runtime } },
    // Errors only. Replays and tracing are both opt-in purchases of user data
    // and bundle weight that this finding did not ask for.
    tracesSampleRate: 0,
    // With this off the SDK does not attach the client IP, cookies or headers
    // in the first place. `beforeSend` still runs, because the fields that leak
    // are the ones we wrote.
    sendDefaultPii: false,
    beforeSend: (event: ScrubbableEvent) => scrubSentryEvent(event),
    beforeSendTransaction: (event: ScrubbableEvent) => scrubSentryEvent(event),
    beforeBreadcrumb: (breadcrumb: ScrubbableEvent) =>
      scrubSentryEvent(breadcrumb),
  };
}

/**
 * Load and initialise the SDK once. Resolves to `null` — never throws — when
 * there is no DSN or the package is missing, so every call site can await it
 * without asking whether Sentry is on.
 */
export function initSentry(
  runtime: SentryRuntime,
): Promise<SentryLike | null> {
  if (loading) return loading;
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return Promise.resolve(null);

  loading = (async () => {
    try {
      // @ts-ignore -- see the note at the top of this file.
      const mod = (await import("@sentry/nextjs")) as SentryLike;
      mod.init(options(runtime));
      sentry = mod;
      return mod;
    } catch {
      // A DSN is configured but the package is missing: a deployment mistake,
      // not a reason to blank the page we are in the middle of rendering.
      console.warn(
        "[sentry] NEXT_PUBLIC_SENTRY_DSN is set but @sentry/nextjs is not " +
          "installed — error reporting is off.",
      );
      return null;
    }
  })();

  return loading;
}

/** Where the error was caught. Becomes the `boundary` tag, which is what makes the 26 error.tsx files tellable apart. */
export interface ReportContext {
  boundary: string;
  /** Next.js's server-side error digest, when the boundary was handed one. */
  digest?: string;
}

/**
 * Report one error from a React error boundary. Named `reportBoundaryError`
 * rather than `reportError` on purpose: the browser has a global of that name
 * with different semantics (it re-raises to `window.onerror`), and a reader
 * hitting a bare `reportError(...)` in a boundary should not have to check
 * which one it is. Fire-and-forget and a no-op
 * when Sentry is off, so a boundary never has to branch on configuration —
 * which matters most in `global-error.tsx`, the one file that cannot assume any
 * provider mounted successfully.
 */
export function reportBoundaryError(error: unknown, context: ReportContext): void {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return;
  void (async () => {
    try {
      const mod = sentry ?? (await initSentry("browser"));
      mod?.captureException(error, {
        tags: { boundary: context.boundary },
        extra: context.digest ? { digest: context.digest } : {},
      });
    } catch {
      // Reporting an error must never become the error.
    }
  })();
}
