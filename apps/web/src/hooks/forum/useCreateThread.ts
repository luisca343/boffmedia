import { ForumService, type CreateThreadInput } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useCreateThread() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (input: CreateThreadInput) => ForumService.createThread(input),
    "No se pudo crear el hilo.",
  )
  return { createThread: run, isSubmitting, error, setError }
}
