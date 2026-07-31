// Boffmedia domain client. Talks to the API root (no path prefix). Two auth
// flavours: plain (`api*`, `boff*`) and Bearer-carrying (`apiAuthed*` take an
// explicit token; `apiAuthedAuto*` pull it from the session). SmartRotom and
// Wingull build on the plain helpers here — see rotom-client / wingull-client.
import {
  ApiResponse,
  RequestOptions,
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  multipartPOST,
  authedRequest,
  sessionToken,
  getApiUrl,
  orThrow,
  parseErrorEnvelope,
} from "./core";

export async function apiAuthedPOST<T>(url: string, data: any, token: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("POST", `${getApiUrl()}${url}`, token, data);
}

export async function apiAuthedGET<T>(url: string, token: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("GET", `${getApiUrl()}${url}`, token);
}

export async function apiAuthedPUT<T>(url: string, data: any, token: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("PUT", `${getApiUrl()}${url}`, token, data);
}

export async function apiAuthedDELETE<T>(url: string, token: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("DELETE", `${getApiUrl()}${url}`, token);
}

// ─── Auto-authed requests ──────────────────────────────────────────────────────
// Same as the apiAuthed* helpers but pull the API JWT from the NextAuth session
// automatically, so guarded-endpoint call sites don't have to thread a token.
// These must only be called from client contexts (admin panel, profile, join
// buttons).

export async function apiAuthedAutoPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("POST", `${getApiUrl()}${url}`, await sessionToken(), data);
}

export async function apiAuthedAutoPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("PATCH", `${getApiUrl()}${url}`, await sessionToken(), data);
}

export async function apiAuthedAutoPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return authedRequest<T>("PUT", `${getApiUrl()}${url}`, await sessionToken(), data);
}

export async function apiAuthedAutoGET<T>(url: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("GET", `${getApiUrl()}${url}`, await sessionToken());
}

export async function apiAuthedAutoDELETE<T>(url: string): Promise<ApiResponse<T>> {
  return authedRequest<T>("DELETE", `${getApiUrl()}${url}`, await sessionToken());
}

export async function apiGET<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return GET<T>(`${getApiUrl()}${url}`, options);
}

export async function apiPOST<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return POST<T>(`${getApiUrl()}${url}`, data, options);
}

export async function apiPUT<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return PUT<T>(`${getApiUrl()}${url}`, data, options);
}

export async function apiPATCH<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return PATCH<T>(`${getApiUrl()}${url}`, data, options);
}

export async function apiDELETE<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return DELETE<T>(`${getApiUrl()}${url}`, options);
}

export async function apiMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPOST<T>(url, fields, files);
}

// Raw binary upload. Not multipart on purpose: the pack blob store is
// content-addressed, so there is exactly one file and no fields, and a
// multipart wrapper would only add a boundary the server has to parse back off.
export async function apiAuthedAutoBinaryPOST<T>(
  url: string,
  body: Blob | ArrayBuffer,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiUrl()}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${await sessionToken()}`,
    },
    body,
  });
  if (!res.ok) return parseErrorEnvelope<T>(res);
  return (await res.json()) as ApiResponse<T>;
}

export async function boffGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(url);
}

export async function boffPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(url, data);
}

export async function apiAuthedPOSTOrThrow<T>(url: string, data: any, token: string): Promise<T> {
  return orThrow(apiAuthedPOST<T>(url, data, token));
}

export async function apiAuthedPUTOrThrow<T>(url: string, data: any, token: string): Promise<T> {
  return orThrow(apiAuthedPUT<T>(url, data, token));
}

export async function apiAuthedDELETEOrThrow<T = void>(url: string, token: string): Promise<T> {
  return orThrow(apiAuthedDELETE<T>(url, token));
}

interface UploadResponse {
  filename: string;
  path: string;
  url: string;
}

async function uploadRequest<T>(
  url: string,
  file: File,
  options?: { path?: string; filename?: string }
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.path) {
    formData.append('path', options.path);
  }
  if (options?.filename) {
    formData.append('filename', options.filename);
  }

  // The /upload controller is JWT-guarded; attach the session token.
  const token = await sessionToken();

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: {
        revalidate: 0,
      },
    });

    if (!res.ok) {
      return await parseErrorEnvelope<T>(res);
    }

    return (await res.json()) as ApiResponse<T>;
  } catch (error) {
    console.error(`Error in upload request: ${(error as Error).message}`);
    throw error;
  }
}

export async function apiUpload(
  file: File,
  options?: { path?: string; filename?: string }
): Promise<ApiResponse<UploadResponse>> {
  return uploadRequest<UploadResponse>(
    `${getApiUrl()}/upload/image`,
    file,
    options
  );
}
