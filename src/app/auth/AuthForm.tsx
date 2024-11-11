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
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-900 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-md p-8 bg-gray-800 bg-opacity-80 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600">
          {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {message && <p className="text-orange-100 text-center">{message}</p>}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-300 font-semibold">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter your username" {...field} className="bg-gray-700 text-orange-100 border-gray-600 focus:border-orange-500 pl-10" />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
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
                    <FormLabel className="text-orange-300 font-semibold">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter your email" type="email" {...field} className="bg-gray-700 text-orange-100 border-gray-600 focus:border-orange-500 pl-10" />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
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
                  <FormLabel className="text-orange-300 font-semibold">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter your password" type="password" {...field} className="bg-gray-700 text-orange-100 border-gray-600 focus:border-orange-500 pl-10" />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
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
                    <FormLabel className="text-orange-300 font-semibold">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Confirm your password" type="password" {...field} className="bg-gray-700 text-orange-100 border-gray-600 focus:border-orange-500 pl-10" />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold py-2 rounded-md" disabled={isLoading}>
              {isLoading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}