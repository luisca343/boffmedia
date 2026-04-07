import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useGetAllNews } from '@/hooks/documents/useGetAllNews'
import { useUpdateNewsStatus } from '@/hooks/documents/useUpdateNewsStatus'
import { NewsStatusDto } from '@boffmedia/shared'

export function useNews() {
  const { news, featured, published, setNews, error: fetchError, isLoading } = useGetAllNews()
  const { updateNewsStatus, error: updateError } = useUpdateNewsStatus()
  
  const [publishedNewsIds, setPublishedNewsIds] = useState<number[]>([])
  const [featuredNewsId, setFeaturedNewsId] = useState<number | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (fetchError) {
      toast.error('Failed to fetch news. Please try again.')
    }
  }, [fetchError])

  useEffect(() => {
    if (news && featured) {
      const publishedIds = published.map(item => item.id)
      setPublishedNewsIds(publishedIds)
      setFeaturedNewsId(featured.id)
    }
  }, [news, featured, published])

  const allNews = useMemo(() => {
    return featured ? [featured, ...published] : published
  }, [featured, published])

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

    const statusData: NewsStatusDto = {
      published: publishedNewsIds,
      featured: featuredNewsId,
    }
    updateNewsStatus(statusData)
      .then(() => {
        setHasUnsavedChanges(false)
        toast.success('News status updated successfully')
      })
      .catch(() => {
        if (updateError) {
          toast.error('Failed to update news status. Please try again.')
        }
      })
  }

  return {
    news: allNews,
    setNews,
    publishedNewsIds,
    featuredNewsId,
    hasUnsavedChanges,
    handlePublishToggle,
    handleFeaturedToggle,
    handleSave,
    isLoading,
  }
}

