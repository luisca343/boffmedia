export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
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

export async function rotomPUT<T>(url: string, data: any): Promise<ApiResponse<T>> {
  data.server = getServer();
  return apiPUT<T>(`/smartrotom${url}`, data);
}

export async function rotomPATCH<T>(url: string, data: any): Promise<ApiResponse<T>> {
  data.server = getServer();
  return apiPATCH<T>(`/smartrotom${url}`, data);
}

export async function rotomDELETE<T>(url: string): Promise<ApiResponse<T>> {
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

