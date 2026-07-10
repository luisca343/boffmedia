import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService } from "@/services/api/boffmedia/forumService"

export function useForumThread(id: number) {
  const { data, error, isLoading, refetch, setData } = useForumResource(
    () => ForumService.getThread(id),
    [id],
  )

  return {
    thread: data,
    error,
    isLoading,
    refetch,
    setThread: setData,
  }
}
