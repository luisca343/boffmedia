/**
 * Where PrometheusModule serves the exposition format.
 *
 * Shared so `app.module.ts` and `ResponseInterceptor` cannot drift: the
 * interceptor must let this path through unwrapped, and a scraper only ever
 * sees the path the module was registered with.
 */
export const METRICS_PATH = '/metrics';
