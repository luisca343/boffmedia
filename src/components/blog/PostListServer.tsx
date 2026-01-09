import PostList from './PostList'
import { getLocale } from 'next-intl/server'
import { getPosts } from '@/app/(blog)/blog/get-posts'

export default async function PostListServer({ localeProp }: { localeProp?: string }) {
  const locale = localeProp || await getLocale()
  const posts = await getPosts(locale)
  return <PostList posts={posts} locale={locale} />
}
