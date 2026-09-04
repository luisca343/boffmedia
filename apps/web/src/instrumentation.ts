import { initSentry } from "@/lib/sentry";

/**
 * Next.js's server-side entry point: `register()` runs once per server process,
 * before any request is handled, in whichever runtime that process is.
 *
 * Both branches share one module because `@sentry/nextjs` is the same package
 * everywhere; only the `runtime` tag differs, which is what lets an edge-only
 * failure be told apart from a Node one in the Sentry UI.
 *
 * Inert without `NEXT_PUBLIC_SENTRY_DSN`: `initSentry` resolves to null without
 * importing the SDK, so a dev server pays nothing for this file existing.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    await initSentry("edge");
    return;
  }
  await initSentry("server");
}

/**
 * Next.js hands every server-side render/route-handler error here, including the
 * ones a segment `error.tsx` will then display. This is the ONLY way to see a
 * server error that the client boundary shows as a bare digest — by the time
 * `error.tsx` runs in the browser, `error.message` has already been replaced by
 * Next with a generic string in production, so without this hook every
 * server-side crash arrives as "an error occurred" and nothing else.
 *
 * The SDK's own `captureRequestError` does the request/route correlation; our
 * `beforeSend` scrubber still runs on whatever it builds.
 */
export async function onRequestError(
  error: unknown,
  request: unknown,
  context: unknown,
): Promise<void> {
  const sentry = await initSentry(
    process.env.NEXT_RUNTIME === "edge" ? "edge" : "server",
  );
  sentry?.captureRequestError?.(error, request, context);
}
