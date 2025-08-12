import { useState, useEffect, useCallback } from 'react'
import { ApiResponse } from '@/services/boffAPI'

export function useRotomRequest<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  ...params: any[]
) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFunction(...params)
      if (response.error) {
        setError(response.error)
      } else {
        setData(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [apiFunction, ...params])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, isLoading, refetch: fetchData, setData }
}
