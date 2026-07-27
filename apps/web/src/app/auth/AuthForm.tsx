"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from "@/components/ui/primitives/input"
import { Button } from "@/components/ui/primitives/button"
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from "next-auth/react"
import { Lock, Mail, User } from 'lucide-react'
import { useState } from "react"
import { useTranslations } from "next-intl"
import { UsersService } from "@/services/api/boffmedia/usersService"

type AuthMessages = (key: string, values?: Record<string, string>) => string

// Built per render so the zod messages come from the active locale — a schema
// hoisted to module scope would freeze whichever locale loaded first.
function buildSchemas(t: AuthMessages) {
  const loginSchema = z.object({
    username: z.string().min(1, t("errors.usernameRequired")),
    password: z.string().min(8, t("errors.passwordMin")),
  })

  const registerSchema = loginSchema.extend({
    email: z.string().email(t("errors.emailInvalid")),
    confirmPassword: z.string().min(8, t("errors.passwordMin")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("errors.passwordMismatch"),
    path: ["confirmPassword"],
  })

  return { loginSchema, registerSchema }
}

const registerSchemaShape = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string(),
  confirmPassword: z.string(),
})

export function AuthForm({ redirect = '/', url = 'boffmedia', message= ''}: { url?: string, redirect?: string, message?: string }) {
  const router = useRouter()
  const t = useTranslations("auth")
  const { loginSchema, registerSchema } = buildSchemas(t as AuthMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isRegister = mode === 'register'

  const form = useForm<z.infer<typeof registerSchemaShape>>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      confirmPassword: "",
    }
  })

  async function onSubmit(values: z.infer<typeof registerSchemaShape>) {
    setIsLoading(true)
    setFormError(null)
    if (isRegister) {
      try {
        const response = await UsersService.createUser({
            email: values.email,
            username: values.username,
            password: values.password,
          }
        )
        if (response.success) {
          router.push(`/auth?mode=login&message=${encodeURIComponent(t('success.register'))}`)
        } else {
          setFormError(response.error || t('errors.register'))
        }
      } catch (error) {
        console.error(error)
        setFormError(t('errors.generic'))
      }
    } else {
      const { username, password } = values
      const response = await signIn(url, {
        redirect: false,
        username,
        password,
      })

      if (response?.error) {
        setFormError(response.error)
      } else {
        router.replace(redirect)
      }
    }
    setIsLoading(false)
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: redirect })
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-layer-1 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-md p-8 bg-layer-2 bg-opacity-80 rounded-lg shadow-xl backdrop-blur-sm border border-edge">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary-hover to-primary-active">
          {isRegister ? t('register.title') : t('login.title')}
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {message && <p className="text-primary-hover text-center">{message}</p>}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-hover font-semibold">{t('fields.username')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder={t('fields.usernamePh')} {...field} className="bg-layer-3 text-primary-hover border-edge focus:border-primary pl-10" />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-hover w-5 h-5" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {isRegister && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-hover font-semibold">{t('fields.email')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder={t('fields.emailPh')} type="email" {...field} className="bg-layer-3 text-primary-hover border-edge focus:border-primary pl-10" />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-hover w-5 h-5" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-hover font-semibold">{t('fields.password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder={t('fields.passwordPh')} type="password" {...field} className="bg-layer-3 text-primary-hover border-edge focus:border-primary pl-10" />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-hover w-5 h-5" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {isRegister && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary-hover font-semibold">{t('fields.confirm')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder={t('fields.confirmPh')} type="password" {...field} className="bg-layer-3 text-primary-hover border-edge focus:border-primary pl-10" />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-hover w-5 h-5" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            )}

            {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-active text-white hover:from-primary-active hover:to-primary-active transition-all duration-200 font-semibold py-2 rounded-md" disabled={isLoading}>
              {isLoading ? t('submit.loading') : isRegister ? t('submit.register') : t('submit.login')}
            </Button>
          </form>
        </Form>

        <div className="mt-4">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-ink-dim hover:bg-layer-1 transition-all duration-200 font-semibold py-2 rounded-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            {t('providers.signInWith', { provider: t('providers.google') })}
          </Button>
        </div>
      </div>
    </div>
  )
}

