import { ForumService, type EditPostInput } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useEditPost() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (postId: number, input: EditPostInput) => ForumService.editPost(postId, input),
    "No se pudo editar el mensaje.",
  )
  return { editPost: run, isSubmitting, error, setError }
}
