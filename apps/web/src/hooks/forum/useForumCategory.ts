import { useForumResource } from "@/hooks/forum/useForumResource"
import { ForumService } from "@/services/api/boffmedia/forumService"

export function useForumCategory(slug: string) {
  const { data, error, isLoading, refetch, setData } = useForumResource(
    () => ForumService.getCategory(slug),
    [slug],
  )

  return {
    category: data,
    error,
    isLoading,
    refetch,
    setCategory: setData,
  }
}
