import Link from 'next/link'
import type { Post } from '../../app/(blog)/blog/get-posts'
import { getLocale } from 'next-intl/server'
import { getPosts } from '@/app/(blog)/blog/get-posts'

interface Props {
  posts?: Post[]
  locale?: string
}

export default async function PostList({ posts, locale }: Props) {
  let resolvedPosts: Post[] | undefined = posts
  let resolvedLocale = locale

  if (!resolvedPosts) {
    resolvedLocale = resolvedLocale || await getLocale()
    resolvedPosts = await getPosts(resolvedLocale)
  }

  const displayLocale = resolvedLocale || 'es'

  return (
    <div className="space-y-8">
      {resolvedPosts.map((post) => (
        <article key={post.route} className="border-b border-surface-700 pb-6">
          <Link href={post.route} className="group block">
            <h2 className="text-2xl font-semibold group-hover:text-primary-400 transition-colors">
              {post.frontMatter.title || post.title}
            </h2>

            <p className="text-surface-400 text-sm mt-2">
              {post.frontMatter.date && (
                <span>
                  {new Date(post.frontMatter.date).toLocaleDateString(displayLocale === 'en' ? 'en-US' : 'es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </span>
              )}
              {post.frontMatter.author && <span> {post.frontMatter.date ? ' • ' : ''}{post.frontMatter.author}</span>}
            </p>

            {post.frontMatter.description && (
              <p className="text-surface-300 mt-3">{post.frontMatter.description}</p>
            )}
          </Link>
        </article>
      ))}

      {resolvedPosts.length === 0 && (
        <p className="text-surface-400">{displayLocale === 'en' ? 'No posts yet.' : 'Aún no hay entradas.'}</p>
      )}
    </div>
  )
}
