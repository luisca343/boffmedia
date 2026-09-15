import { ToolApiError } from "./host";

/** Delays between attempts. A timeout gets one retry; immediate transport and
 * transient gateway failures get two, while keeping the normal path instant. */
const RETRY_DELAYS_MS = [250, 750] as const;

const RETRYABLE_CODES = new Set([
  "dns_failed",
  "connection_refused",
  "connection_timeout",
  "server_unreachable",
  "server_down",
  "server_5xx_error",
]);

const RETRYABLE_STATUS = new Set([408, 425, 429, 502, 503, 504]);

function methodOf(method: string | undefined): string {
  return (method ?? "GET").toUpperCase();
}

/** A safe retry is restricted to reads. 401/403 and other ordinary 4xx
 * responses are caller/auth/data errors and must be surfaced immediately. */
export function isRetryableToolApiError(
  error: unknown,
  method = "GET",
): error is ToolApiError {
  if (!(error instanceof ToolApiError)) return false;
  if (methodOf(method) !== "GET" && methodOf(method) !== "HEAD") return false;
  if (error.needsSignin) return false;
  if (RETRYABLE_STATUS.has(error.status)) return true;
  return error.code ? RETRYABLE_CODES.has(error.code) : false;
}

export interface ToolApiRetryOptions {
  /** Safe path/method label for host diagnostics; never includes credentials. */
  label?: string;
  onRetry?: (error: ToolApiError, attempt: number) => void;
}

/** Run one idempotent API operation with bounded transient recovery. */
export async function retryToolApiRequest<T>(
  method: string | undefined,
  operation: () => Promise<T>,
  options: ToolApiRetryOptions = {},
): Promise<T> {
  let retry = 0;
  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableToolApiError(error, method)) throw error;
      const timeout = error.code === "connection_timeout";
      // A full control-plane timeout already consumed 20 seconds in the
      // desktop proxy. One retry is enough to cover startup races without
      // stacking three long waits; refused/DNS/5xx failures get two.
      const maxRetries = timeout ? 1 : 2;
      if (retry >= maxRetries) throw error;

      retry += 1;
      options.onRetry?.(error, retry);
      const delay = RETRY_DELAYS_MS[retry - 1] ?? RETRY_DELAYS_MS.at(-1)!;
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
}
