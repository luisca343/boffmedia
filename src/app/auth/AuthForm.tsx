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
                <form onSubmit={form.handleSubmit(onSubmit)} className="bg-main-50 w-1/2 p-10">
                    <FormField control={form.control} name="username" render={({field}) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Username" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="email" render={({field}) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>


                    <FormField control={form.control} name="password" render={({field}) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input placeholder="Password" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    
                    <Button type="submit">Enviar</Button>
                </form>
            </Form>
    )
}


export function FormCenteredInPage({redirect = '/', url='boffmedia'} : {url?: string, redirect?: string}) {
    return (
        <div className="flex h-full items-center justify-center bg-main-700 p-24">
            <AuthForm redirect={redirect} url={url}/>
        </div>
    )
}