"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { signIn } from "next-auth/react"
import { Lock, Mail, User } from "lucide-react"
import { useState } from "react"
import { boffPOST, rotomPOST } from "@/services/boffAPI"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const registerSchema = loginSchema.extend({
  email: z.string().email("Invalid email address"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function AuthForm({ redirect = '/', url = 'boffmedia', message= '', isRegister = false }: { url?: string, redirect?: string, message?: string, isRegister?: boolean }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      confirmPassword: "",
    }
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    if (isRegister) {
      try {
        const response = await boffPOST('/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        if (response.ok) {
          router.push('/auth?mode=login&message=Registration successful. Please log in.')
        } else {
          alert(response.error || 'Registration failed')
        }
      } catch (error) {
        console.error(error)
        alert('An error occurred during registration')
      }
    } else {
      const { username, password } = values
      const response = await signIn(url, {
        redirect: false,
        username,
        password,
      })

      if (response?.error) {
        alert(response.error)
      } else {
        router.replace(redirect)
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface-2 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-md p-8 bg-surface-3 bg-opacity-80 rounded-lg shadow-xl backdrop-blur-sm border border-border-dark">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
          {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {message && <p className="text-primary-light text-center">{message}</p>}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-semibold">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter your username" {...field} className="bg-surface-3 text-primary-light border-border-dark focus:border-primary-light0 pl-10" />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
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
                    <FormLabel className="text-primary font-semibold">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter your email" type="email" {...field} className="bg-surface-3 text-primary-light border-border-dark focus:border-primary-light0 pl-10" />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
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
                  <FormLabel className="text-primary font-semibold">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter your password" type="password" {...field} className="bg-surface-3 text-primary-light border-border-dark focus:border-primary-light0 pl-10" />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
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
                    <FormLabel className="text-primary font-semibold">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Confirm your password" type="password" {...field} className="bg-surface-3 text-primary-light border-border-dark focus:border-primary-light0 pl-10" />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary-light0 to-primary-hover text-white hover:from-primary-hover hover:to-orange-700 transition-all duration-200 font-semibold py-2 rounded-md" disabled={isLoading}>
              {isLoading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}