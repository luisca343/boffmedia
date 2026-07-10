import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService, type ListPostsParams } from "@/services/api/boffmedia/forumService"

export function useForumThreadPosts(id: number, params: ListPostsParams = {}) {
  const { page, limit } = params
  const { data, error, isLoading, refetch, setData } = useForumResource(
    () => ForumService.getThreadPosts(id, { page, limit }),
    [id, page, limit],
  )

  return {
    postList: data,
    error,
    isLoading,
    refetch,
    setPostList: setData,
  }
}
