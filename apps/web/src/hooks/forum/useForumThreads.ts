import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService, type ListThreadsParams } from "@/services/api/boffmedia/forumService"

export function useForumThreads(slug: string, params: ListThreadsParams = {}) {
  const { sort, page, limit } = params
  const { data, error, isLoading, refetch, setData } = useForumResource(
    () => ForumService.getCategoryThreads(slug, { sort, page, limit }),
    [slug, sort, page, limit],
  )

  return {
    threadList: data,
    error,
    isLoading,
    refetch,
    setThreadList: setData,
  }
}
