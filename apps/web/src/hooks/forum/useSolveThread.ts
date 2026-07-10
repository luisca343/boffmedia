import { ForumService, type SolveThreadInput } from "@/services/api/boffmedia/forumService"
import { useForumMutation } from "./useForumMutation"

export function useSolveThread() {
  const { run, isSubmitting, error, setError } = useForumMutation(
    (threadId: number, input: SolveThreadInput = {}) => ForumService.solveThread(threadId, input),
    "No se pudo actualizar la respuesta aceptada.",
  )
  return { solveThread: run, isSubmitting, error, setError }
}
