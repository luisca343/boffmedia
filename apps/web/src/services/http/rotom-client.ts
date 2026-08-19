// SmartRotom domain client. Every request is prefixed `/smartrotom` and every
// mutation carries `server` in the body: MinecraftMiddleware 403s any non-GET
// without it. Authed variants additionally send the session Bearer for routes
// that own a JwtAuthGuard / GameOrUserAuthGuard (gobierno/*, news admin,
// transfer). One rule, applied in one place: that is the point of this file.
import {
  ApiResponse,
  authedRequest,
  getApiUrl,
  getServer,
  request,
  orThrow,
  sessionToken,
  multipartPOST,
  multipartPATCH,
} from "./core";
import { apiGET, apiPOST, apiPUT, apiPATCH } from "./boff-client";

export async function rotomGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/smartrotom${url}`);
}

export async function rotomPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(`/smartrotom${url}`, { ...data, server: getServer() });
}

// `server` stays alongside the Bearer: MinecraftMiddleware still 403s a non-GET without it.
export async function rotomAuthedPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("POST", `${getApiUrl()}/smartrotom${url}`, await sessionToken(), { ...data, server: getServer() });
}

export async function rotomMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPOST<T>(`/smartrotom${url}`, { ...fields, server: getServer() }, files);
}

// `server` rides along like every other rotom mutation, even though the routes that take
// multipart are excluded from MinecraftMiddleware — multer parses the body after it runs, so it
// could never see the field anyway. Harmless, and it keeps one rule for the whole client.
export async function rotomMultipartPATCH<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPATCH<T>(`/smartrotom${url}`, { ...fields, server: getServer() }, files);
}

export async function rotomPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPUT<T>(`/smartrotom${url}`, { ...data, server: getServer() });
}

export async function rotomPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPATCH<T>(`/smartrotom${url}`, { ...data, server: getServer() });
}

export async function rotomDELETE<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  // SmartRotom mutations are gated by MinecraftMiddleware, which requires the
  // `server` field in the body for any non-GET request — send it (like
  // rotomPOST/PUT) so DELETEs aren't rejected with 403.
  return request<T>("DELETE", `${getApiUrl()}/smartrotom${url}`, {
    ...(data ?? {}),
    server: getServer(),
  });
}

// Reads that belong to one player (notes, folders, tags, PC marks) carry the
// Bearer too: the owner is taken from the token server-side, so an anonymous GET
// has nobody to read for. No `server` field — it is a GET.
export async function rotomAuthedGET<T>(url: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("GET", `${getApiUrl()}/smartrotom${url}`, await sessionToken());
}

// Authed PUT/PATCH/DELETE mirror rotomAuthedPOST: routes carrying their own
// JwtAuthGuard (gobierno/*, news admin) 401 without the Bearer. `server` rides
// along so the same helper works on routes still behind MinecraftMiddleware.
export async function rotomAuthedPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("PUT", `${getApiUrl()}/smartrotom${url}`, await sessionToken(), { ...data, server: getServer() });
}

export async function rotomAuthedPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("PATCH", `${getApiUrl()}/smartrotom${url}`, await sessionToken(), { ...data, server: getServer() });
}

export async function rotomAuthedDELETE<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("DELETE", `${getApiUrl()}/smartrotom${url}`, await sessionToken(), {
    ...(data ?? {}),
    server: getServer(),
  });
}

// ─── Throwing variants ─────────────────────────────────────────────────────────

export async function rotomGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(rotomGET<T>(url));
}

export async function rotomAuthedGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(rotomAuthedGET<T>(url));
}

export async function rotomPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomPOST<T>(url, data));
}

export async function rotomAuthedPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomAuthedPOST<T>(url, data));
}

export async function rotomPUTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomPUT<T>(url, data));
}

export async function rotomPATCHOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomPATCH<T>(url, data));
}

export async function rotomDELETEOrThrow<T = void>(url: string, data?: any): Promise<T> {
  return orThrow(rotomDELETE<T>(url, data));
}

export async function rotomAuthedPUTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomAuthedPUT<T>(url, data));
}

export async function rotomAuthedPATCHOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomAuthedPATCH<T>(url, data));
}

export async function rotomAuthedDELETEOrThrow<T = void>(url: string, data?: any): Promise<T> {
  return orThrow(rotomAuthedDELETE<T>(url, data));
}

export async function rotomMultipartPOSTOrThrow<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<T> {
  return orThrow(rotomMultipartPOST<T>(url, fields, files));
}

export async function rotomMultipartPATCHOrThrow<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<T> {
  return orThrow(rotomMultipartPATCH<T>(url, fields, files));
}
