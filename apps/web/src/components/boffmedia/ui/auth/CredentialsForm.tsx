"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Button, Field, Input, PasswordField, toast } from "@/components/boffmedia/primitives"
import { UsersService } from "@/services/api/boffmedia/usersService"
import { AuthService } from "@/services/api/boffmedia/authService"

interface CredentialsFormProps {
  isRegister: boolean
  redirect: string
  onRegistered: () => void
}

type Values = {
  username: string
  password: string
  email?: string
  confirmPassword?: string
}

// Mounted with a `key` that flips on mode change, so each mode gets a fresh
// form instance bound to the right (static) resolver — no stale-resolver races.
export function CredentialsForm({ isRegister, redirect, onRegistered }: CredentialsFormProps) {
  const t = useTranslations("auth")
  const router = useRouter()

  const schema = React.useMemo(() => {
    const base = z.object({
      username: z.string().min(1, t("errors.usernameRequired")),
      password: z.string().min(8, t("errors.passwordMin")),
    })
    if (!isRegister) return base
    return base
      .extend({
        email: z.string().min(1, t("errors.emailRequired")).email(t("errors.emailInvalid")),
        confirmPassword: z.string().min(8, t("errors.passwordMin")),
      })
      .refine((d) => d.password === d.confirmPassword, {
        message: t("errors.passwordMismatch"),
        path: ["confirmPassword"],
      })
  }, [isRegister, t])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: { username: "", password: "", email: "", confirmPassword: "" },
  })

  async function onSubmit(values: Values) {
    if (isRegister) {
      try {
        const res = await UsersService.createUser({
          email: values.email!,
          username: values.username,
          password: values.password,
        })
        if (res.success) {
          // Fire off the verification email (best-effort — never blocks the flow).
          AuthService.resendVerification(values.email!).catch(() => {})
          onRegistered()
        } else toast.error(res.error || t("errors.register"))
      } catch {
        toast.error(t("errors.generic"))
      }
      return
    }

    const res = await signIn("boffmedia", {
      redirect: false,
      username: values.username,
      password: values.password,
    })
    if (res?.error) toast.error(t("errors.signIn"))
    else router.replace(redirect)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[15px]" noValidate>
      <Field label={t("fields.username")} error={errors.username?.message}>
        <Input placeholder={t("fields.usernamePh")} autoComplete="username" {...register("username")} />
      </Field>

      {isRegister && (
        <Field label={t("fields.email")} error={errors.email?.message}>
          <Input type="email" placeholder={t("fields.emailPh")} autoComplete="email" {...register("email")} />
        </Field>
      )}

      <Field label={t("fields.password")} error={errors.password?.message}>
        <PasswordField
          autoComplete={isRegister ? "new-password" : "current-password"}
          showLabel={t("fields.show")}
          hideLabel={t("fields.hide")}
          {...register("password")}
        />
      </Field>

      {isRegister && (
        <Field label={t("fields.confirm")} error={errors.confirmPassword?.message}>
          <PasswordField
            autoComplete="new-password"
            showLabel={t("fields.show")}
            hideLabel={t("fields.hide")}
            {...register("confirmPassword")}
          />
        </Field>
      )}

      {!isRegister && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => router.push("/recuperar")}
            className="font-body text-[13px] font-medium text-accent hover:text-accent-bright hover:underline"
          >
            {t("forgot")}
          </button>
        </div>
      )}

      <Button type="submit" variant="pri" loading={isSubmitting} className="mt-0.5 w-full">
        {isRegister ? t("submit.register") : t("submit.login")}
      </Button>
    </form>
  )
}
