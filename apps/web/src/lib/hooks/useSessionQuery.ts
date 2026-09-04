import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { useHandle401 } from "./useHandle401"

/**
 * Wrapper around useQuery that automatically handles 401 errors centrally.
 * Use this for authenticated queries instead of useQuery directly.
 *
 * When a 401 occurs:
 * - If session is pending 2FA: error is ignored (handled by TwoFactorGate)
 * - Otherwise: session expired dialog is shown
 *
 * Example:
 *   const { data } = useSessionQuery({
 *     queryKey: ['events'],
 *     queryFn: () => orThrow(getEvents())
 *   })
 */
export function useSessionQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends any[] = any[],
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  const handle401 = useHandle401()

  const originalOnError = (options as any).onError

  return useQuery({
    ...options,
    onError: (error: any) => {
      // Try to handle 401 centrally
      const handled = handle401(error)

      // Call the original onError if it exists and error wasn't a handled 401
      if (!handled && originalOnError) {
        originalOnError(error)
      }
    },
  } as UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>)
}
