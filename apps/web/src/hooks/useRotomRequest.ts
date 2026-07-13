import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiResponse } from '@/services/boffAPI'

/**
 * The fetch path for the apps not yet lifted to TanStack Query — ChatApp, Notas,
 * Pokédex (SMARTROTOM_V3.md §8, gap G5). StarBank was migrated off this hook.
 *
 * `boffAPI` has two failure modes: a network error THROWS, an HTTP error RESOLVES
 * to `{ success: false }`. Only `success` separates them — `error` is absent
 * whenever the server's error body doesn't carry that key, so keying off `error`
 * reports a failed request as an empty success.
 *
 * The services take no AbortSignal, so a request cannot be cancelled. A sequence
 * guard is the next best thing: a stale response is dropped rather than allowed to
 * overwrite a newer one. Without it, switching notes quickly renders the previous
 * note's body under the current note's title.
 */
export function useRotomRequest<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  ...params: any[]
) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Monotonic id of the most recent request; any older one is stale.
  const requestId = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Serialised only to give the dep array a fixed length — spreading `...params`
  // makes it variable-length, which React cannot diff, and refires every render for
  // any caller passing a non-primitive. The call itself uses the real values.
  const paramsKey = JSON.stringify(params)
  const paramsRef = useRef(params)
  paramsRef.current = params

  const fetchData = useCallback(async () => {
    const id = ++requestId.current
    const isCurrent = () => mounted.current && requestId.current === id

    setIsLoading(true)
    try {
      const response = await apiFunction(...paramsRef.current)
      if (!isCurrent()) return

      if (response.success !== true) {
        setError(response.userMessage ?? 'La petición ha fallado')
        setData(undefined)
      } else {
        setData(response.data)
        setError(null)
      }
    } catch (err) {
      if (!isCurrent()) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (isCurrent()) setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFunction, paramsKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, isLoading, refetch: fetchData, setData }
}
