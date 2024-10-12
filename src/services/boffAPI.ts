type Options = {
  method: string;
  headers: {
    "Content-Type": string;
  };
  body?: string;
  next: {
    revalidate: number;
  };
};

function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API environment variable is not set");
  }
  return apiUrl;
}

function getServer(): string {
  const server = process.env.NEXT_PUBLIC_MC_WORLD;
  if (!server) {
    throw new Error("NEXT_PUBLIC_MC_WORLD environment variable is not set");
  }
  return server;
}

function getTerasApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_TERAS_API;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_TERAS_API environment variable is not set");
  }
  return apiUrl;
}

export async function request(method: string, url: string, data?: any) {
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
    const result = await res.json();
    if(!result.data) {
      console.log(`Query ${url} is not updated`);
      return result;
    }
    return result.data;
  } catch (error) {
    console.error(`Error in request: ${(error as Error).message}`);
    throw error;
  }
}

export async function GET(url: string) {
  return request("GET", url);
}

export async function POST(url: string, data: any) {
  return request("POST", url, data);
}

export async function apiGET(url: string) {
  return GET(`${getApiUrl()}${url}`);
}

export async function rotomGET(url: string) {
  return apiGET(`/smartrotom${url}`);
}

export async function wingullGET(url: string) {
  return GET(`${getApiUrl()}/wingull${url}`);
}

export async function rotomPOST(url: string, data: any) {
  data.server = getServer();
  return POST(`${getApiUrl()}/smartrotom${url}`, data);
}

export async function wingullPOST(url: string, data: any) {
  return POST(`${getApiUrl()}/wingull${url}`, data);
}

export async function boffPOST(url: string, data: any) {
  return POST(`${getApiUrl()}${url}`, data);
}

export async function terasGET(url: string) {
  return GET(`${getTerasApiUrl()}${url}`);
}

export async function terasPOST(url: string, data: any) {
  return POST(`${getTerasApiUrl()}${url}`, data);
}