import { ForumService } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useSetPinned() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (threadId: number, pinned: boolean) => ForumService.setPinned(threadId, pinned),
    "No se pudo actualizar el estado de fijado.",
  )
  return { setPinned: run, isSubmitting, error, setError }
}
