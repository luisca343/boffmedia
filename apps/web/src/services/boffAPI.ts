import { env } from "@/config/env.public";

export interface ApiResponse<T = any> {
  statusCode: number;
  // Machine text (English) for logs/debugging — never render it to users.
  message?: string;
  // Spanish, explicitly user-facing — only present when a service set it on
  // purpose (via `userMessage` on the thrown exception body). Safe to render.
  userMessage?: string;
  data?: T;
  error?: string;
  success: boolean;
}

// Thrown by the *OrThrow helpers when the envelope reports failure. `message`
// carries the server's machine text for logs; UI code must render its own
// Spanish copy or `userMessage` — see userMessageFrom().
export class ApiError extends Error {
  readonly statusCode: number;
  readonly userMessage?: string;
  readonly envelope: ApiResponse<unknown>;

  constructor(envelope: ApiResponse<unknown>) {
    super(envelope.message || envelope.error || `HTTP ${envelope.statusCode}`);
    this.name = "ApiError";
    this.statusCode = envelope.statusCode;
    this.userMessage = envelope.userMessage;
    this.envelope = envelope;
  }
}

// Spanish-safe error text: the server's explicit user-facing message when one
// was sent, the caller's fallback otherwise. Never returns machine English.
export function userMessageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.userMessage ? error.userMessage : fallback;
}

interface Options extends RequestInit {
  next?: {
    revalidate: number;
  };
}

export interface RequestOptions {
  revalidate?: number;
}

async function request<T>(
  method: string,
  url: string,
  data?: any,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<T>> {
  const options: Options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      revalidate: requestOptions?.revalidate ?? 0,
    },
  };

  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (error) {
    console.error(`Error in request: ${(error as Error).message}`);
    throw error;
  }

  if (!res.ok) {
    return await parseErrorEnvelope<T>(res);
  }

  return (await res.json()) as ApiResponse<T>;
}

// Builds an ApiResponse error envelope from a non-ok Response: parses the
// server's error body if possible (NestJS GlobalExceptionFilter shape),
// otherwise synthesizes one from the status code.
async function parseErrorEnvelope<T>(res: Response): Promise<ApiResponse<T>> {
  const bodyText = await res.text().catch(() => "");

  try {
    const parsed = JSON.parse(bodyText);
    if (parsed && typeof parsed === "object") {
      // statusCode first so the body's own value wins when present — some
      // error bodies (e.g. MinecraftMiddleware's) don't include one.
      return { statusCode: res.status, ...parsed, success: false } as ApiResponse<T>;
    }
  } catch {
    // body wasn't JSON, fall through to synthesized envelope
  }

  return {
    statusCode: res.status,
    message: res.statusText,
    error: bodyText || res.statusText,
    success: false,
  } as ApiResponse<T>;
}

export async function GET<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>("GET", url, undefined, options);
}

export async function POST<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>("POST", url, data, options);
}

export async function multipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  const formData = new FormData();

  // Append text fields
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  // Append file fields
  Object.entries(files).forEach(([key, file]) => {
    if (file) {
      formData.append(key, file);
    }
  });

  // Use API base URL if not absolute
  const fullUrl = url.startsWith('http') ? url : `${getApiUrl()}${url}`;
  return await multipartPOSTRequest<T>(fullUrl, formData);
}

// Internal helper for multipart POST requests
async function multipartPOSTRequest<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
  // Attach the session token when present — harmless on unguarded endpoints,
  // required for guarded ones (e.g. /upload).
  const token = await sessionToken();
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: 0 },
    });
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      return await parseErrorEnvelope<T>(res);
    }
    if (contentType && contentType.includes('application/json')) {
      const result: ApiResponse<T> = await res.json();
      return result;
    } else {
      const text = await res.text();
      return {
        statusCode: res.status,
        message: res.statusText,
        data: text as any,
        success: true,
      } as ApiResponse<T>;
    }
  } catch (error) {
    console.error(`Error in multipartPOST: ${(error as Error).message}`);
    throw error;
  }
}

export async function PUT<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>("PUT", url, data, options);
}

export async function PATCH<T>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>("PATCH", url, data, options);
}

export async function DELETE<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>("DELETE", url, undefined, options);
}

// ─── Authenticated requests (sends Authorization: Bearer <token>) ──────────────

async function authedRequest<T>(method: string, url: string, token: string, data?: any): Promise<ApiResponse<T>> {
  const options: Options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  };

  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return await parseErrorEnvelope<T>(res);
    }
    const result: ApiResponse<T> = await res.json();
    return result;
  } catch (error) {
    console.error(`Error in authedRequest: ${(error as Error).message}`);
    throw error;
  }
}

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
// next-auth/react is imported dynamically so this module stays safe to import
// from server-side code (authOptions imports boffPOST from here). These must
// only be called from client contexts (admin panel, profile, join buttons).

async function sessionToken(): Promise<string> {
  try {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    return (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  } catch {
    return "";
  }
}

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

const getApiUrl = (): string => {
  return env.NEXT_PUBLIC_API;
};

const getServer = (): string => {
  return env.NEXT_PUBLIC_MC_WORLD;
};

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


export async function rotomGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/smartrotom${url}`);
}

export async function wingullGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/wingull${url}`);
}

export async function rotomPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(`/smartrotom${url}`, { ...data, server: getServer() });
}

export async function rotomMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPOST<T>(`/smartrotom${url}`, { ...fields, server: getServer() }, files);
}

export async function apiMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPOST<T>(url, fields, files);
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

export async function wingullPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(`/wingull${url}`, data);
}

// Throwing variants. The base helpers have a dual failure mode (network errors
// throw, HTTP errors resolve { success: false }); these unify both into a
// thrown ApiError so callers — TanStack queryFn/mutationFn especially — can
// never mistake a failed envelope for an empty success.
async function orThrow<T>(pending: Promise<ApiResponse<T>>): Promise<T> {
  const res = await pending;
  if (!res.success) throw new ApiError(res);
  return res.data as T;
}

export async function rotomGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(rotomGET<T>(url));
}

export async function rotomPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(rotomPOST<T>(url, data));
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

export async function rotomMultipartPOSTOrThrow<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<T> {
  return orThrow(rotomMultipartPOST<T>(url, fields, files));
}

export async function wingullGETOrThrow<T>(url: string): Promise<T> {
  return orThrow(wingullGET<T>(url));
}

export async function wingullPOSTOrThrow<T>(url: string, data: any): Promise<T> {
  return orThrow(wingullPOST<T>(url, data));
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

export async function boffGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(url);
}

export async function boffPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(url, data);
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