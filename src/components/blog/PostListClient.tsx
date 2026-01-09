"use client"

import React, { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import PostList from './PostList'
import type { Post } from '@/app/(blog)/blog/get-posts'

export default function PostListClient({ localeProp }: { localeProp?: string }) {
  const localeHook = useLocale()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const clientDetect = () => {
      const nav = typeof navigator !== 'undefined' ? navigator.language : ''
      if (nav.startsWith('en')) return 'en'
      if (nav.startsWith('es')) return 'es'
      return 'es'
    }

    const locale = localeProp || localeHook || clientDetect()

    fetch(`/api/blog/posts?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setPosts(data || []))
      .finally(() => setLoading(false))
  }, [localeProp, localeHook])

  if (loading) return <p className="text-surface-400">Loading...</p>

  return <PostList posts={posts} locale={localeProp || localeHook || 'es'} />
}
