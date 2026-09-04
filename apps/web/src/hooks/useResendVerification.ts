"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"
import { useAuthThrottle } from "@/app/(boffmedia)/(auth)/_components/useAuthThrottle"

/**
 * Seconds the button stays dead after a successful send (not throttled).
 * This is separate from server-side throttle: even on success, we debounce
 * client-side to avoid immediate re-sends.
 */
export const RESEND_SUCCESS_COOLDOWN_SECONDS = 60

/**
 * Shared driver for every "resend the verification email" button: the call, the
 * toast, and the cooldown. Four screens need this (sign-up, /verificar-email,
 * /app/autorizar and /perfil) and each of them owns its own layout, so the hook
 * is the shared piece rather than a one-size component.
 *
 * On server-side throttle (429), shows the countdown from useAuthThrottle.
 * On success, applies a client-side cooldown to debounce repeated clicks.
 */
export function useResendVerification() {
  const t = useTranslations("auth.resend")
  const throttle = useAuthThrottle()
  const [sending, setSending] = React.useState(false)
  const [successCooldown, setSuccessCooldown] = React.useState(0)

  React.useEffect(() => {
    if (successCooldown <= 0) return
    const id = setTimeout(() => setSuccessCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [successCooldown])

  const resend = React.useCallback(
    async (email: string): Promise<boolean> => {
      const value = email.trim()
      if (!value || sending || throttle.isThrottled || successCooldown > 0) return false
      setSending(true)
      try {
        const res = await AuthService.resendVerification(value)
        if (res.statusCode === 429) {
          throttle.handleThrottle(res)
          toast.error(throttle.message)
          return false
        }
        if (!res.success) {
          toast.error(t("failed"))
          return false
        }
        // The endpoint answers identically for an unregistered address (no
        // account enumeration), so this copy must stay non-committal about
        // whether an account exists.
        toast.success(t("sent"))
        setSuccessCooldown(RESEND_SUCCESS_COOLDOWN_SECONDS)
        return true
      } catch {
        toast.error(t("failed"))
        return false
      } finally {
        setSending(false)
      }
    },
    [sending, throttle, successCooldown, t],
  )

  return {
    resend,
    sending,
    cooldown: throttle.isThrottled ? throttle.secondsRemaining : successCooldown,
    disabled: sending || throttle.isThrottled || successCooldown > 0,
  }
}
