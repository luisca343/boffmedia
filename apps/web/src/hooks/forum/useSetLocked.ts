import { ForumService } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useSetLocked() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (threadId: number, locked: boolean) => ForumService.setLocked(threadId, locked),
    "No se pudo actualizar el estado de cierre.",
  )
  return { setLocked: run, isSubmitting, error, setError }
}
