import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService } from "@/services/api/boffmedia/forumService"

export function useForumStats() {
  const { data, error, isLoading, refetch, setData } = useForumResource(() => ForumService.getStats(), [])

  return {
    stats: data,
    error,
    isLoading,
    refetch,
    setStats: setData,
  }
}
