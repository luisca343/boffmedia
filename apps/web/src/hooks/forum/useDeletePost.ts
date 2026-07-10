import { ForumService } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useDeletePost() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (postId: number) => ForumService.deletePost(postId),
    "No se pudo eliminar el mensaje.",
  )
  return { deletePost: run, isSubmitting, error, setError }
}
