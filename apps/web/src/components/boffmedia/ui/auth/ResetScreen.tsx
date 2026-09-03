"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Button, Field, PasswordField, toast } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"
import { AuthShell } from "./AuthShell"
import { PasswordRequirements } from "./PasswordRequirements"
import { isPasswordValid } from "./passwordPolicy"

type Values = { password: string; confirmPassword: string }

export function ResetScreen() {
  const t = useTranslations("auth")
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""
  const [done, setDone] = React.useState(false)

  const schema = React.useMemo(
    () =>
      z
        .object({
          password: z.string().refine(isPasswordValid, { message: t("errors.pwRequirements") }),
          confirmPassword: z.string().min(1, t("errors.passwordMin")),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("errors.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const pwValue = watch("password") ?? ""

  async function onSubmit(values: Values) {
    try {
      const res = await AuthService.resetPassword(token, values.password)
      if (res.success) {
        // Auto-sign-in with the just-set credentials; fall back to the manual
        // "go to login" state if that doesn't take.
        const username = res.data?.username
        if (username) {
          const signInRes = await signIn("boffmedia", {
            redirect: false,
            username,
            password: values.password,
          })
          if (!signInRes?.error) {
            toast.success(t("reset.success"))
            router.replace("/")
            return
          }
        }
        setDone(true)
        return
      }
      const msg = `${res.message ?? ""} ${res.error ?? ""}`.toLowerCase()
      const tokenErr = msg.includes("token") || msg.includes("expir")
      toast.error(tokenErr ? t("reset.invalidToken") : t("reset.error"))
    } catch {
      toast.error(t("reset.error"))
    }
  }

  if (!token) {
    return (
      <AuthShell title={t("reset.title")}>
        <p className="font-body text-[0.875rem]/[1.55] not-italic normal-case text-danger">
          {t("reset.missingToken")}
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subtitle")}>
      {done ? (
        <div className="flex flex-col gap-[0.9375rem]">
          <p className="font-body text-[0.875rem]/[1.55] not-italic normal-case text-txt-muted">
            {t("reset.success")}
          </p>
          <Button variant="pri" className="w-full" onClick={() => router.replace("/entrar")}>
            {t("reset.goLogin")}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[0.9375rem]" noValidate>
          <Field label={t("reset.password")} error={errors.password?.message}>
            <PasswordField
              autoComplete="new-password"
              showLabel={t("fields.show")}
              hideLabel={t("fields.hide")}
              {...register("password")}
            />
          </Field>

          <PasswordRequirements value={pwValue} />

          <Field label={t("reset.confirm")} error={errors.confirmPassword?.message}>
            <PasswordField
              autoComplete="new-password"
              showLabel={t("fields.show")}
              hideLabel={t("fields.hide")}
              {...register("confirmPassword")}
            />
          </Field>

          <Button type="submit" variant="pri" loading={isSubmitting} className="mt-0.5 w-full">
            {t("reset.submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
