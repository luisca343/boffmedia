"use client"

import { useState } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { wingullPOST } from "@/services/boffAPI"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Paperclip, User, AtSign, Key, Send, Star, Reply, ReplyAll, Forward } from 'lucide-react'
import { BackgroundDecorations } from '../../../_components/BackgroundDecorations'

type Invitacion = {
  id: number;
  username: string;
  uuid: string;
};

const formSchema = z.object({
  username: z.string().min(1, "¡Ups! No olvides tu nombre de usuario"),
  mc_username: z.string().min(1, "¡El nombre de Minecraft es importante!"),
  email: z.string().email("Parece que este email no es válido"),
  password: z.string().min(8, "Tu contraseña debe tener al menos 8 caracteres para mantenerte seguro"),
});

export default function InvitacionForm({ invitacion }: { invitacion: Invitacion }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: invitacion.username,
      mc_username: invitacion.username,
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const res = await wingullPOST(`/invites/${invitacion.id}/register`, {
        values,
        id: invitacion.id,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      router.push('/registro-exitoso');
    } catch (error) {
      alert(error instanceof Error ? error.message : "¡Vaya! Algo salió mal durante el registro. ¿Podrías intentarlo de nuevo?");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <Card className="w-full max-w-4xl shadow-xl bg-secondary-800 bg-opacity-70 text-white rounded-xl overflow-hidden relative z-10">
        <CardHeader className="border-b border-secondary-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-yellow-300">Invitación: Plan de Desarrollo de Teras</CardTitle>
            <Star className="text-yellow-300 h-6 w-6" />
          </div>
          <div className="flex items-center mt-2 text-secondary-100">
            <div className="mr-2 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center text-secondary-800 font-bold">
              TP
            </div>
            <div>
              <div className="font-semibold">Teras Project</div>
              <div className="text-sm">teras@project.com</div>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="ghost" size="sm" className="text-secondary-200 hover:bg-secondary-700 hover:text-yellow-300 transition-colors duration-300">
              <Reply className="h-4 w-4 mr-2" /> Responder
            </Button>
            <Button variant="ghost" size="sm" className="text-secondary-200 hover:bg-secondary-700 hover:text-yellow-300 transition-colors duration-300">
              <ReplyAll className="h-4 w-4 mr-2" /> Responder a todos
            </Button>
            <Button variant="ghost" size="sm" className="text-secondary-200 hover:bg-secondary-700 hover:text-yellow-300 transition-colors duration-300">
              <Forward className="h-4 w-4 mr-2" /> Reenviar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 text-secondary-100">
            <p className="text-lg">¡Hola, {invitacion.username}!</p>
            <p>Nos complace informarle que le ha sido otorgada una plaza para participar en el Plan de Desarrollo de Teras. 
            En caso de querer colaborar con el desarrollo de la región, por favor, rellene el siguiente formulario.</p>
            <p>Muchas gracias por su interés. El destino de la región de Teras depende de usted.</p>
          </div>
          <Separator className="my-6 bg-secondary-700" />
          <div className="bg-secondary-900 bg-opacity-50 p-6 rounded-xl border border-secondary-700 mt-4">
            <h3 className="text-xl font-bold mb-4 text-yellow-300">¡Únete a la aventura de Teras!</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Image
                    src={`https://minotar.net/avatar/${form.getValues().mc_username}/100.png`}
                    alt={`Avatar de ${invitacion.username}`}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-yellow-300"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-yellow-300">{invitacion.username}</h2>
                    <p className="text-secondary-200">Aventurero de Minecraft</p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-100 font-semibold">Tu nombre de aventurero</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-300" size={18} />
                          <Input placeholder="¿Cómo quieres que te llamemos?" {...field} className="pl-10 bg-secondary-800 bg-opacity-50 border-secondary-600 text-secondary-100 placeholder-secondary-300 focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-200">Este será tu nombre en Teras</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mc_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-100 font-semibold">Tu nombre en Minecraft</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-300" size={18} />
                          <Input placeholder="Tu nombre en Minecraft" {...field} disabled readOnly className="pl-10 bg-secondary-700 bg-opacity-50 border-secondary-600 text-secondary-100 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-200">Este es tu nombre actual en Minecraft</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-100 font-semibold">Tu correo electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-300" size={18} />
                          <Input placeholder="¿Dónde podemos contactarte?" {...field} className="pl-10 bg-secondary-800 bg-opacity-50 border-secondary-600 text-secondary-100 placeholder-secondary-300 focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-200">Te mantendremos informado de todas las novedades</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-100 font-semibold">Tu contraseña secreta</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-300" size={18} />
                          <Input placeholder="Crea una contraseña segura" type="password" {...field} className="pl-10 bg-secondary-800 bg-opacity-50 border-secondary-600 text-secondary-100 placeholder-secondary-300 focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-200">Asegúrate de que sea segura y fácil de recordar</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="bg-yellow-300 text-secondary-900 hover:bg-yellow-400 disabled:opacity-50 px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    {isSubmitting ? '¡Embarcando..!' : '¡Comenzar la aventura!'}
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="border-t border-secondary-700 flex justify-between items-center text-secondary-200">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span className="text-sm font-medium">Invitación #{invitacion.id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Paperclip className="h-5 w-5" />
            <span className="text-sm font-medium">1 regalo adjunto</span>
          </div>
        </CardFooter>
      </Card>
  )
}