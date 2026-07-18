// Wingull domain client. Prefixed `/wingull`, no `server` field and no Bearer —
// these are plain reads/writes against the Wingull bridge.
import { ApiResponse, orThrow } from "./core";
import { apiGET, apiPOST } from "./boff-client";

export async function wingullGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/wingull${url}`);
}

export async function wingullPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(`/wingull${url}`, data);
}

export async function wingullGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(wingullGET<T>(url));
}

export async function wingullPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(wingullPOST<T>(url, data));
}
