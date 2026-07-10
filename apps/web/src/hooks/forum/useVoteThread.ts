import { ForumService } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useVoteThread() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (threadId: number) => ForumService.voteThread(threadId),
    "No se pudo registrar el voto.",
  )
  return { voteThread: run, isSubmitting, error, setError }
}
