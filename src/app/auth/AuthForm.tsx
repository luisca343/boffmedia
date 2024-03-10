"use client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { boffPOST, rotomGET, wingullGET, wingullPOST } from "@/services/boffAPI"
import { useForm } from "react-hook-form";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";

type Invitacion = {
    id: number;
    username: string;
    uuid: string;
  }
  
  

export default function AuthForm({redirect = '/', url='boffmedia'} : {url?: string, redirect?: string}) {
    const router = useRouter();
    const formSchema = z.object({
        username: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      });
      

    const form  = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: ""
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { username, password } = values;
      
        const response = await signIn(url, {
          redirect: false,
          username,
          password,
        });

        if (response?.error) {
          alert(response.error);
        } else {
          router.replace(redirect);
        }
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