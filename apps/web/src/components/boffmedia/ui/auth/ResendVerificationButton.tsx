"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, type ButtonProps } from "@boffmedia/ui"
import { useResendVerification } from "@/hooks/useResendVerification"

interface ResendVerificationButtonProps extends Pick<ButtonProps, "variant" | "size" | "className"> {
  /** The address to (re)send to. Callers that already know it — sign-up, the
   *  profile, the launcher authorization — pass it straight in; /verificar-email
   *  asks for it, because a stale link can be opened while signed out. */
  email: string
  onSent?: () => void
}

/**
 * The one "resend the verification email" button. Shows its own cooldown as the
 * label, so a screen only has to place it — see `useResendVerification` for why
 * the countdown is not optional.
 */
export function ResendVerificationButton({
  email,
  onSent,
  variant = "ghost",
  size,
  className,
}: ResendVerificationButtonProps) {
  const t = useTranslations("auth.resend")
  const { resend, sending, cooldown, disabled } = useResendVerification()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      icon="mail"
      loading={sending}
      disabled={disabled || !email.trim()}
      onClick={async () => {
        if (await resend(email)) onSent?.()
      }}
    >
      {cooldown > 0 ? t("cooldown", { seconds: cooldown }) : t("action")}
    </Button>
  )
}
