import { ForumService, type CreatePostInput } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useCreatePost() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (threadId: number, input: CreatePostInput) => ForumService.createPost(threadId, input),
    "No se pudo publicar la respuesta.",
  )
  return { createPost: run, isSubmitting, error, setError }
}
