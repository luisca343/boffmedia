export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  success: boolean;
}

interface Options extends RequestInit {
  next?: {
    revalidate: number;
  };
}

async function request<T>(method: string, url: string, data?: any): Promise<ApiResponse<T>> {
  const options: Options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      revalidate: 0,
    },
  };

  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    const result: ApiResponse<T> = await res.json();
    console.warn(`Request to ${url} returned:`, result);
    return result;
  } catch (error) {
    console.error(`Error in request: ${(error as Error).message}`);
    throw error;
  }
}

export async function GET<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>("GET", url);
}

export async function POST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return request<T>("POST", url, data);
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
      console.log(`Appending field to FormData: ${key} = ${value}`);
      formData.append(key, value);
    }
  });

  // Append file fields
  Object.entries(files).forEach(([key, file]) => {
    if (file) {
      console.log(`Appending file to FormData: ${key}`);
      formData.append(key, file);
    }
  });

  console.log("FormData prepared for multipart POST:", formData);
  console.log("Sending multipart POST request to:", url);
    // Log all FormData fields and values for debugging
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`FormData field: ${key}`, value);
    });

  // Use API base URL if not absolute
  const fullUrl = url.startsWith('http') ? url : `${getApiUrl()}${url}`;
  return await multipartPOSTRequest<T>(fullUrl, formData);
}

// Internal helper for multipart POST requests
async function multipartPOSTRequest<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      next: { revalidate: 0 },
    });
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      let errorText = await res.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: errorText };
      }
      return {
        statusCode: res.status,
        message: res.statusText,
        error: errorJson.error || errorText,
        success: false,
      } as ApiResponse<T>;
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

export async function PUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return request<T>("PUT", url, data);
}

export async function PATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return request<T>("PATCH", url, data);
}

export async function DELETE<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>("DELETE", url);
}

const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API environment variable is not set");
  }
  return apiUrl;
};

const getTerasApiUrl = (): string => {
  const terasApiUrl = process.env.NEXT_PUBLIC_TERAS_API;
  if (!terasApiUrl) {
    throw new Error("NEXT_PUBLIC_TERAS_API environment variable is not set");
  }
  return terasApiUrl;
};

const getServer = (): string => {
  const server = process.env.NEXT_PUBLIC_MC_WORLD;
  if (!server) {
    throw new Error("NEXT_PUBLIC_MC_WORLD environment variable is not set");
  }
  return server;
};

export async function apiGET<T>(url: string): Promise<ApiResponse<T>> {
  return GET<T>(`${getApiUrl()}${url}`);
}

export async function apiPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return POST<T>(`${getApiUrl()}${url}`, data);
}

export async function apiPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return PUT<T>(`${getApiUrl()}${url}`, data);
}

export async function apiPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return PATCH<T>(`${getApiUrl()}${url}`, data);
}

export async function apiDELETE<T>(url: string): Promise<ApiResponse<T>> {
  return DELETE<T>(`${getApiUrl()}${url}`);
}


export async function rotomGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/smartrotom${url}`);
}

export async function wingullGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(`/wingull${url}`);
}

export async function rotomPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  data.server = getServer();
  return apiPOST<T>(`/smartrotom${url}`, data);
}

export async function rotomMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  console.log("Preparing FormData for multipart POST:", fields, files);
  fields.server = getServer();
  return multipartPOST<T>(`/smartrotom${url}`, fields, files);
}

export async function apiMultipartPOST<T>(
  url: string,
  fields: Record<string, any> = {},
  files: Record<string, File | Blob> = {}
): Promise<ApiResponse<T>> {
  return multipartPOST<T>(url, fields, files);
}

export async function rotomPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  data.server = getServer();
  return apiPUT<T>(`/smartrotom${url}`, data);
}

export async function rotomPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  data.server = getServer();
  return apiPATCH<T>(`/smartrotom${url}`, data);
}

export async function rotomDELETE<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return apiDELETE<T>(`/smartrotom${url}`);
}

export async function wingullPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(`/wingull${url}`, data);
}

export async function boffGET<T>(url: string): Promise<ApiResponse<T>> {
  return apiGET<T>(url);
}

export async function boffPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return apiPOST<T>(url, data);
}

export async function terasGET<T>(url: string): Promise<ApiResponse<T>> {
  return GET<T>(`${getTerasApiUrl()}${url}`);
}

export async function terasPOST<T>(url: string, data: any): Promise<ApiResponse<T>> {
  return POST<T>(`${getTerasApiUrl()}${url}`, data);
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
  
  // Ensure path and filename are properly appended to FormData
  if (options?.path) {
    formData.append('path', options.path);
  }
  if (options?.filename) {
    formData.append('filename', options.filename);
  }
  
  if (options?.path) {
    formData.append('path', options.path);
  }
  
  if (options?.filename) {
    formData.append('filename', options.filename);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      next: {
        revalidate: 0,
      },
    });
    
    const result: ApiResponse<T> = await res.json();
    console.warn(`Upload request to ${url} returned:`, result);
    return result;
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