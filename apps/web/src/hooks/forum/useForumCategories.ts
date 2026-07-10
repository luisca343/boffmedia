import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService } from "@/services/api/boffmedia/forumService"

export function useForumCategories() {
  const { data, error, isLoading, refetch, setData } = useForumResource(() => ForumService.getCategories(), [])

  return {
    categories: data || [],
    error,
    isLoading,
    refetch,
    setCategories: setData,
  }
}
