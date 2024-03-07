import axios from 'axios'

export async function request(method: string, url: string, data: any) {
  return axios.request({
    method,
    url,
    data,
  })
}

export async function GET(url: string) {
  return (await request('GET', url, null)).data
  
}

export async function POST(url: string, data: any) {
  return await axios.post(url, data)
      .then(res => res)
      .catch(err => {
          console.error(err);
          throw err;
      });
}

export async function rotomGET(url: string) {
  return await GET(`${process.env.NEXT_PUBLIC_API}/smartrotom${url}`)
}

export async function wingullGET(url: string) {
  let datos = await GET(`${process.env.NEXT_PUBLIC_API}/wingull${url}`)
  return await GET(`${process.env.NEXT_PUBLIC_API}/wingull${url}`)
}

export async function rotomPOST(url: string, data: any) {
  return await POST(`${process.env.NEXT_PUBLIC_API}/smartrotom${url}`, data)
}