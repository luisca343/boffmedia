import { useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query"
import { useHandle401 } from "./useHandle401"

/**
 * Wrapper around useInfiniteQuery that automatically handles 401 errors centrally.
 * Use this for authenticated infinite queries instead of useInfiniteQuery directly.
 *
 * When a 401 occurs:
 * - If session is pending 2FA: error is ignored (handled by TwoFactorGate)
 * - Otherwise: session expired dialog is shown
 *
 * Example:
 *   const { data } = useSessionInfiniteQuery({
 *     queryKey: ['events-paged'],
 *     queryFn: ({ pageParam }) => orThrow(getEventsPaged(pageParam)),
 *     initialPageParam: 0,
 *   })
 */
export function useSessionInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends any[] = any[],
  TPageParam = unknown,
>(
  options: any,
): UseInfiniteQueryResult<TData, TError> {
  const handle401 = useHandle401()

  const originalOnError = options.onError

  return useInfiniteQuery({
    ...options,
    onError: (error: any) => {
      // Try to handle 401 centrally
      const handled = handle401(error)

      // Call the original onError if it exists and error wasn't a handled 401
      if (!handled && originalOnError) {
        originalOnError(error)
      }
    },
  })
}
