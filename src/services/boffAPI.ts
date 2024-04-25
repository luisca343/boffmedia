import axios from 'axios'

type options = {
  method: string,
  headers: {
    'Content-Type': string
  },
  body?: string,
  next: {
    revalidate: number
  }
}


export async function request(method: string, url: string, data: any) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: 0
    }
  } as options;

  if (method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);
  return await res.json();
}

export async function request2(method: string, url: string, data: any) {
  return axios.request({
    method,
    url,
    data,
  })
}

export async function GET(url: string) {
  try {
    return await request('GET', url, null);
  } catch (error) {
    throw error;
  }
}

export async function POST(url: string, data: any) {
  try {
    return await request('POST', url, data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function rotomGET(url: string) {
  return await GET(`${process.env.NEXT_PUBLIC_API}/smartrotom${url}`)
}

export async function wingullGET(url: string) {
  let datos = await GET(`${process.env.NEXT_PUBLIC_API}/wingull${url}`)
  return await GET(`${process.env.NEXT_PUBLIC_API}/wingull${url}`)
}

export async function rotomPOST(url: string, data: any) {
  data.server = process.env.NEXT_PUBLIC_MC_WORLD
  return await POST(`${process.env.NEXT_PUBLIC_API}/smartrotom${url}`, data)
}

export async function wingullPOST(url: string, data: any) {
  return await POST(`${process.env.NEXT_PUBLIC_API}/wingull${url}`, data)
}

export async function boffPOST(url: string, data: any) {
  return await POST(`${process.env.NEXT_PUBLIC_API}${url}`, data)
}