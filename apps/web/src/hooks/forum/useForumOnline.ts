import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService } from "@/services/api/boffmedia/forumService"

export function useForumOnline() {
  const { data, error, isLoading, refetch, setData } = useForumResource(() => ForumService.getOnline(), [])

  return {
    online: data || [],
    error,
    isLoading,
    refetch,
    setOnline: setData,
  }
}
