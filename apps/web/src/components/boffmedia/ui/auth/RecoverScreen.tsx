"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Field, Icon, Input, toast } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"
import { AuthShell } from "./AuthShell"

type Values = { email: string }

export function RecoverScreen() {
  const t = useTranslations("auth")
  const [sent, setSent] = React.useState(false)

  const schema = React.useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("errors.emailRequired")).email(t("errors.emailInvalid")),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  async function onSubmit(values: Values) {
    try {
      // Always resolves generically server-side; show the same message either way.
      await AuthService.forgotPassword(values.email)
      setSent(true)
    } catch {
      toast.error(t("errors.generic"))
    }
  }

  if (sent) {
    return (
      <AuthShell title={t("recover.sentTitle")}>
        <div className="flex flex-col items-center gap-3.5 text-center">
          <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="mail" size={26} />
          </span>
          <p className="font-body text-[0.875rem]/[1.55] not-italic normal-case text-txt-muted">
            {t("recover.sent")}
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t("recover.title")} subtitle={t("recover.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[0.9375rem]" noValidate>
        <Field label={t("fields.email")} error={errors.email?.message}>
          <Input type="email" placeholder={t("fields.emailPh")} autoComplete="email" {...register("email")} />
        </Field>

        <Button type="submit" variant="pri" loading={isSubmitting} className="mt-0.5 w-full">
          {t("recover.submit")}
        </Button>
      </form>
    </AuthShell>
  )
}
