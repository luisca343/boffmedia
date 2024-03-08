"use client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { rotomGET, wingullGET, wingullPOST } from "@/services/boffAPI"
import { useForm } from "react-hook-form";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

type Invitacion = {
    id: number;
    username: string;
    uuid: string;
  }
  
  

export default function InvitacionForm({invitacion} : {invitacion: Invitacion}) {
    const router = useRouter();
    const formSchema = z.object({
        username: z.string().min(1),
        mc_username: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      });
      

    const form  = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: invitacion.username,
            mc_username: invitacion.username,
            email: "",
            password: ""
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        let res = await wingullPOST(`/invites/${invitacion.id}/register`, {values, id: invitacion.id})
        let data = await res.data;

        if(data.error) alert(data.error);
        else router.back();
      }

    return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white w-96 p-10">
                    <FormField control={form.control} name="username" render={({field}) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Username" {...field} />
                            </FormControl>
                            <FormDescription>El nombre de usuario que quieres usar</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="mc_username" render={({field}) => (
                        <FormItem>
                            <FormLabel>MC Username</FormLabel>
                            <FormControl>
                                <Input placeholder="MC Username" {...field} readOnly/>
                            </FormControl>
                            <FormDescription>Tu nombre de usuario de Minecraft</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="email" render={({field}) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Email" {...field} />
                            </FormControl>
                            <FormDescription>El email que quieres usar</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>


                    <FormField control={form.control} name="password" render={({field}) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input placeholder="Password" type="password" {...field} />
                            </FormControl>
                            <FormDescription>La contraseña que quieres usar</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>


                    <Button type="submit">Enviar</Button>
                </form>
            </Form>
    )
}