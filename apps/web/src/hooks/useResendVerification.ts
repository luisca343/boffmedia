"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"

/**
 * Seconds the button stays dead after a send. `/auth/resend-verification` is
 * throttled to 5/min server-side, and a 429 there comes back as a bare envelope
 * with nothing a player can act on — the countdown is what turns that limit into
 * feedback instead of a button that silently stops working.
 */
export const RESEND_COOLDOWN_SECONDS = 60

/**
 * Shared driver for every "resend the verification email" button: the call, the
 * toast, and the cooldown. Four screens need this (sign-up, /verificar-email,
 * /app/autorizar and /perfil) and each of them owns its own layout, so the hook
 * is the shared piece rather than a one-size component.
 */
export function useResendVerification() {
  const t = useTranslations("auth.resend")
  const [sending, setSending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const resend = React.useCallback(
    async (email: string): Promise<boolean> => {
      const value = email.trim()
      if (!value || sending || cooldown > 0) return false
      setSending(true)
      try {
        const res = await AuthService.resendVerification(value)
        if (!res.success) {
          // A 429 means the send did NOT happen, but hammering it is exactly
          // what got us here — start the cooldown anyway so the next click can
          // actually succeed.
          if (res.statusCode === 429) setCooldown(RESEND_COOLDOWN_SECONDS)
          toast.error(res.statusCode === 429 ? t("tooMany") : t("failed"))
          return false
        }
        // The endpoint answers identically for an unregistered address (no
        // account enumeration), so this copy must stay non-committal about
        // whether an account exists.
        toast.success(t("sent"))
        setCooldown(RESEND_COOLDOWN_SECONDS)
        return true
      } catch {
        toast.error(t("failed"))
        return false
      } finally {
        setSending(false)
      }
    },
    [sending, cooldown, t],
  )

  return { resend, sending, cooldown, disabled: sending || cooldown > 0 }
}
