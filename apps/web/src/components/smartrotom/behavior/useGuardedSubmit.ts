"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface GuardedSubmitOptions {
  /**
   * Called instead of rethrowing when the wrapped fn rejects. Without it the
   * rejection propagates untouched — the hook never swallows an error.
   */
  onError?: (error: unknown) => void
}

export interface GuardedSubmit<A extends unknown[], R> {
  /** Runs the wrapped fn unless one is already in flight; returns `undefined` when ignored. */
  submit: (...args: A) => Promise<R | undefined>
  isPending: boolean
}

/**
 * Re-entrancy guard for the SmartRotom apps that have no react-query mutation
 * to lean on. A double-click on an unguarded async handler fires the request
 * twice (it created two notes in `notas`); the in-flight flag lives in a ref so
 * the second call is dropped synchronously, before React can re-render.
 *
 * Apps on `useMutation` already get `isPending` — wire that instead of this.
 */
export function useGuardedSubmit<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: GuardedSubmitOptions = {},
): GuardedSubmit<A, R> {
  const { onError } = options
  const inFlight = useRef(false)
  const mounted = useRef(true)
  const [isPending, setPending] = useState(false)

  const fnRef = useRef(fn)
  fnRef.current = fn
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const submit = useCallback(async (...args: A): Promise<R | undefined> => {
    if (inFlight.current) return undefined
    inFlight.current = true
    setPending(true)
    try {
      return await fnRef.current(...args)
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error)
        return undefined
      }
      throw error
    } finally {
      inFlight.current = false
      if (mounted.current) setPending(false)
    }
  }, [])

  return { submit, isPending }
}
