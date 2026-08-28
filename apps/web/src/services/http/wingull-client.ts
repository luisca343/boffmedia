// Wingull domain client. Prefixed `/wingull`.
//
// Reads are anonymous: the GET routes are world state (weather, towns, regions,
// plots, taxi stops) and the controller leaves them `@Public()`.
//
// Writes carry the session Bearer. They sit behind `GameOrUserAuthGuard`, which
// accepts either the mod's opaque server token or a signed-in user's JWT — the
// web is the second caller, so it must actually send one. It previously sent
// neither a Bearer nor a `server` field, so every write 401'd: the guard's
// transitional `body.server` tripwire had nothing to match.
import { ApiResponse, orThrow, authedRequest, getApiUrl, sessionToken } from "./core";
import { apiGET } from "./boff-client";

export async function wingullGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/wingull${url}`);
}

// `/wingull/performance` is the one read on this controller that is role-gated
// (Administracion > Rendimiento). Anonymous `wingullGET` 401s there, so admin
// reads need the session Bearer.
export async function wingullAuthedGET<T>(url: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("GET", `${getApiUrl()}/wingull${url}`, await sessionToken());
}

export async function wingullPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("POST", `${getApiUrl()}/wingull${url}`, await sessionToken(), data);
}

export async function wingullGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(wingullGET<T>(url));
}

export async function wingullAuthedGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(wingullAuthedGET<T>(url));
}

export async function wingullPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(wingullPOST<T>(url, data));
}
