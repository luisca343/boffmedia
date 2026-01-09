import { NextResponse } from 'next/server'
import { getPosts } from '@/app/(blog)/blog/get-posts'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const localeParam = url.searchParams.get('locale')
  let locale = localeParam || 'es'

  // Try to detect from accept-language header if not provided
  if (!localeParam) {
    const al = req.headers.get('accept-language') || ''
    if (al.startsWith('en')) locale = 'en'
    else if (al.startsWith('es')) locale = 'es'
  }

  const posts = await getPosts(locale)
  return NextResponse.json(posts)
}
