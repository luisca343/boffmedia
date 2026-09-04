import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query"
import { useHandle401 } from "./useHandle401"

/**
 * Wrapper around useMutation that automatically handles 401 errors centrally.
 * Use this for authenticated mutations instead of useMutation directly.
 *
 * When a 401 occurs:
 * - If session is pending 2FA: error is ignored (handled by TwoFactorGate)
 * - Otherwise: session expired dialog is shown
 *
 * Example:
 *   const { mutate } = useSessionMutation({
 *     mutationFn: (data) => orThrow(createEvent(data))
 *   })
 */
export function useSessionMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const handle401 = useHandle401()

  const originalOnError = (options as any).onError

  return useMutation({
    ...options,
    onError: (error: any, variables?: TVariables, context?: TContext) => {
      // Try to handle 401 centrally
      const handled = handle401(error)

      // Call the original onError if it exists and error wasn't a handled 401
      if (!handled && originalOnError) {
        originalOnError(error, variables, context)
      }
    },
  } as UseMutationOptions<TData, TError, TVariables, TContext>)
}
