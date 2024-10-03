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

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export default function AuthForm({ redirect = '/', url = 'boffmedia' }: { url?: string, redirect?: string }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-900 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-md p-8 bg-gray-800 bg-opacity-80 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600">Iniciar Sesión</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold py-2 rounded-md">
              Sign In
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export function FormCenteredInPage({ redirect = '/', url = 'boffmedia' }: { url?: string, redirect?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-850 p-4">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600 mb-2 text-center">SmartRotom En Construcción</h1>
      <p className="text-xl font-bold text-orange-100 mb-6 text-center max-w-2xl">
        (El login requiere cuenta de BoffMedia vinculada a Minecraft, y solo Luisca la tiene así que mala suerte)
      </p>
      <AuthForm redirect={redirect} url={url} />
    </div>
  )
}