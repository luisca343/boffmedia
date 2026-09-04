import { initSentry } from "@/lib/sentry";

/**
 * Next.js's browser-side entry point (15.3+): this module is evaluated once,
 * early, on the client — the counterpart of `instrumentation.ts`. It is loaded
 * by the framework, not imported by anything, which is why nothing here is
 * exported for our own use.
 *
 * Inert without `NEXT_PUBLIC_SENTRY_DSN`: `initSentry` resolves to null without
 * importing the SDK, so the browser bundle never pays for it either.
 */
void initSentry("browser");

/**
 * Next calls this on every client-side navigation. Sentry uses it to close the
 * previous pageload's span and open the next one; without it, errors thrown
 * after a soft navigation are still attributed to the page the user first
 * landed on, which makes them near-impossible to reproduce.
 */
export function onRouterTransitionStart(
  href: string,
  navigationType: string,
): void {
  void (async () => {
    const sentry = await initSentry("browser");
    sentry?.captureRouterTransitionStart?.(href, navigationType);
  })();
}
