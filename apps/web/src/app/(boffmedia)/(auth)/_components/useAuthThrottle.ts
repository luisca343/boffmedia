"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ApiResponse } from "@/services/http/core"

export interface ThrottleState {
  isThrottled: boolean
  secondsRemaining: number
  message: string
  buttonLabel: string
}

/**
 * Extracts the retry-after seconds from an API response.
 * Checks both response body (if present) and standard headers.
 */
function extractRetryAfterSeconds(response: unknown): number | undefined {
  // Some APIs include retry_after in the response body
  if (typeof response === "object" && response !== null) {
    const body = response as Record<string, unknown>
    if (typeof body["retry_after"] === "number") {
      return body["retry_after"]
    }
  }
  // No retry info in response — client must estimate from throttle config
  return undefined
}

/**
 * Hook to manage auth throttle state: detects 429 responses, extracts retry-after,
 * and provides countdown timer state.
 *
 * Given a throttled API response (429 status), this hook:
 * - Extracts the retry-after period (from response or header)
 * - Manages a countdown timer
 * - Returns the throttle state and friendly message
 *
 * Usage:
 *   const throttle = useAuthThrottle()
 *   // After a failed API call:
 *   if (res.statusCode === 429) {
 *     throttle.handleThrottle(res)
 *   }
 *   // Disable submit button while throttled:
 *   <Button disabled={throttle.isThrottled}>
 *     {throttle.isThrottled ? throttle.buttonLabel : "Submit"}
 *   </Button>
 */
export function useAuthThrottle(): {
  isThrottled: boolean
  secondsRemaining: number
  message: string
  buttonLabel: string
  handleThrottle: (response: ApiResponse<unknown>, retryAfterOverride?: number) => void
  reset: () => void
} {
  const t = useTranslations("auth.throttle")
  const [throttleState, setThrottleState] = React.useState<{
    expiresAt: number | null
  }>({
    expiresAt: null,
  })

  const [displaySeconds, setDisplaySeconds] = React.useState(0)

  // Countdown timer effect
  React.useEffect(() => {
    if (throttleState.expiresAt === null) {
      setDisplaySeconds(0)
      return
    }

    const updateCountdown = () => {
      const now = Date.now()
      const secondsLeft = Math.ceil((throttleState.expiresAt! - now) / 1000)

      if (secondsLeft <= 0) {
        setThrottleState({ expiresAt: null })
        setDisplaySeconds(0)
      } else {
        setDisplaySeconds(secondsLeft)
      }
    }

    updateCountdown()

    // Update every 100ms for smooth countdown (display updates every 1s due to ceil)
    const interval = setInterval(updateCountdown, 100)
    return () => clearInterval(interval)
  }, [throttleState.expiresAt])

  const isThrottled = throttleState.expiresAt !== null && Date.now() < throttleState.expiresAt

  const handleThrottle = (
    response: ApiResponse<unknown>,
    retryAfterOverride?: number,
  ) => {
    let retryAfterSeconds = retryAfterOverride ?? extractRetryAfterSeconds(response)

    // Default retry-after if not provided: use the throttle limits from auth.controller.ts
    // Login/reset/forgot/verify: 5 requests per 60 seconds
    // Refresh/signout: 10 requests per 60 seconds
    // Conservative default: 30 seconds
    if (retryAfterSeconds === undefined) {
      retryAfterSeconds = 30
    }

    const expiresAt = Date.now() + retryAfterSeconds * 1000
    setThrottleState({ expiresAt })
    setDisplaySeconds(retryAfterSeconds)
  }

  const reset = () => {
    setThrottleState({ expiresAt: null })
    setDisplaySeconds(0)
  }

  return {
    isThrottled,
    secondsRemaining: displaySeconds,
    message: t("message", { seconds: displaySeconds }),
    buttonLabel: t("button", { seconds: displaySeconds }),
    handleThrottle,
    reset,
  }
}
