/**
 * This package's one HTTP door, on top of `@boffmedia/tool-kit`'s `api`
 * capability.
 *
 * The `ApiResponse` envelope and the NON-throwing contract are kept exactly as
 * apps/web's `@/services/boffAPI` had them, so every ported call site moved
 * across unchanged: a failed request is a `success: false` envelope, never a
 * rejection.
 *
 * Auth is the host's problem, not a parameter. The web services took a bearer
 * `token` argument threaded down from `useSession`; here `auth: "required"`
 * tells the host to attach whatever it has — a next-auth session on the web,
 * the keyring token in the desktop app — because the desktop side never exposes
 * its token to the webview at all.
 */

import { toolApi, ToolApiError } from "@boffmedia/tool-kit";

export interface ApiResponse<T = unknown> {
  statusCode: number;
  /** Machine text (English) for logs — never render it to users. */
  message?: string;
  /** Explicitly user-facing, when a service set one on purpose. */
  userMessage?: string;
  /** Stable machine code (see @boffmedia/shared/error-codes). */
  code?: string;
  data?: T;
  error?: string;
  success: boolean;
}

export interface RequestInit_ {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: "optional" | "required";
}

export async function request<T>(path: string, init?: RequestInit_): Promise<ApiResponse<T>> {
  try {
    return await toolApi().request<ApiResponse<T>>(path, init);
  } catch (err) {
    if (err instanceof ToolApiError) {
      return {
        success: false,
        statusCode: err.status,
        error: err.message,
        userMessage: err.message,
        code: err.code,
      };
    }
    throw err;
  }
}
