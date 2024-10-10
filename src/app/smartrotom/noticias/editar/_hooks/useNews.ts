import { useState, useEffect } from 'react'
import { rotomPOST } from '@/services/boffAPI'
import { toast } from 'react-toastify'
import { useGetNews } from '../../_hooks/useGetNews'

export function useNews() {
  const { news, setNews } = useGetNews()
  const [publishedNewsIds, setPublishedNewsIds] = useState<number[]>([])
  const [featuredNewsId, setFeaturedNewsId] = useState<number | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    // Initialize publishedNewsIds and featuredNewsId based on fetched data
    const publishedIds = news
      .filter((item) => item.published)
      .map((item) => item.id)
    const featuredId = news.find((item) => item.featured)?.id || null

    setPublishedNewsIds(publishedIds)
    setFeaturedNewsId(featuredId)
  }, [news])

  function handlePublishToggle(id: number) {
    setPublishedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((newsId) => newsId !== id) : [...prev, id]
    )
    setHasUnsavedChanges(true)

    if (publishedNewsIds.includes(id) && featuredNewsId === id) {
      setFeaturedNewsId(null)
    }
  }

  function handleFeaturedToggle(id: number) {
    setFeaturedNewsId(id === featuredNewsId ? null : id)
    setHasUnsavedChanges(true)

    if (!publishedNewsIds.includes(id)) {
      setPublishedNewsIds((prev) => [...prev, id])
    }
  }

  function handleSave() {
    if (!featuredNewsId) {
      return toast.error('Debes seleccionar una noticia destacada')
    }
    rotomPOST('/documents/newsstatus', {
      published: publishedNewsIds,
      featured: featuredNewsId,
    }).then(() => {
      setHasUnsavedChanges(false)
    })
  }

  return {
    news,
    setNews,
    publishedNewsIds,
    featuredNewsId,
    hasUnsavedChanges,
    handlePublishToggle,
    handleFeaturedToggle,
    handleSave,
  }
}