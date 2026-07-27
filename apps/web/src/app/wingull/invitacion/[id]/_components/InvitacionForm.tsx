"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { wingullPOST } from "@/services/boffAPI"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Input } from "@/components/ui/primitives/input"
import { Button } from "@/components/ui/primitives/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import { Separator } from "@/components/ui/primitives/separator"
import { Mail, Paperclip, User, AtSign, Key, Send, Star, Reply, ReplyAll, Forward } from 'lucide-react'
import { BackgroundDecorations } from '../../../_components/BackgroundDecorations'

type Invitacion = {
  id: number;
  username: string;
  uuid: string;
};

const buildFormSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('usernameRequired')),
  mc_username: z.string().min(1, t('mcUsernameRequired')),
  email: z.string().email(t('emailInvalid')),
  password: z.string().min(8, t('passwordMin')),
});

export default function InvitacionForm({ invitacion }: { invitacion: Invitacion }) {
  const t = useTranslations('wingull.invite');
  const tErrors = useTranslations('wingull.invite.errors');
  const formSchema = buildFormSchema(tErrors);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
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
      setFormError(error instanceof Error ? error.message : tErrors('submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <Card className="w-full max-w-4xl shadow-xl bg-secondary-soft bg-opacity-70 text-white rounded-xl overflow-hidden relative z-10">
        <CardHeader className="border-b border-secondary-active">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-yellow-300">{t('subject')}</CardTitle>
            <Star className="text-yellow-300 h-6 w-6" />
          </div>
          <div className="flex items-center mt-2 text-secondary-hover">
            <div className="mr-2 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center text-secondary-active font-bold">
              {t('senderInitials')}
            </div>
            <div>
              <div className="font-semibold">{t('senderName')}</div>
              <div className="text-sm">{t('senderEmail')}</div>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="ghost" size="sm" className="text-secondary-hover hover:bg-secondary-active hover:text-yellow-300 transition-colors duration-300">
              <Reply className="h-4 w-4 mr-2" /> {t('reply')}
            </Button>
            <Button variant="ghost" size="sm" className="text-secondary-hover hover:bg-secondary-active hover:text-yellow-300 transition-colors duration-300">
              <ReplyAll className="h-4 w-4 mr-2" /> {t('replyAll')}
            </Button>
            <Button variant="ghost" size="sm" className="text-secondary-hover hover:bg-secondary-active hover:text-yellow-300 transition-colors duration-300">
              <Forward className="h-4 w-4 mr-2" /> {t('forward')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 text-secondary-hover">
            <p className="text-lg">{t('greeting', { username: invitacion.username })}</p>
            <p>{t('body1')}</p>
            <p>{t('body2')}</p>
          </div>
          <Separator className="my-6 bg-secondary-active" />
          <div className="bg-secondary-soft bg-opacity-50 p-6 rounded-xl border border-secondary-active mt-4">
            <h3 className="text-xl font-bold mb-4 text-yellow-300">{t('formTitle')}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Image
                    src={`https://minotar.net/avatar/${form.getValues().mc_username}/100.png`}
                    alt={t('avatarAlt', { username: invitacion.username })}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-yellow-300"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-yellow-300">{invitacion.username}</h2>
                    <p className="text-secondary-hover">{t('roleLabel')}</p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-hover font-semibold">{t('usernameLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-hover" size={18} />
                          <Input placeholder={t('usernamePh')} {...field} className="pl-10 bg-secondary-soft bg-opacity-50 border-secondary-active text-secondary-hover placeholder-secondary-hover focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-hover">{t('usernameHelp')}</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mc_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-hover font-semibold">{t('mcUsernameLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-hover" size={18} />
                          <Input placeholder={t('mcUsernamePh')} {...field} disabled readOnly className="pl-10 bg-secondary-active bg-opacity-50 border-secondary-active text-secondary-hover rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-hover">{t('mcUsernameHelp')}</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-hover font-semibold">{t('emailLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-hover" size={18} />
                          <Input placeholder={t('emailPh')} {...field} className="pl-10 bg-secondary-soft bg-opacity-50 border-secondary-active text-secondary-hover placeholder-secondary-hover focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-hover">{t('emailHelp')}</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-hover font-semibold">{t('passwordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-hover" size={18} />
                          <Input placeholder={t('passwordPh')} type="password" {...field} className="pl-10 bg-secondary-soft bg-opacity-50 border-secondary-active text-secondary-hover placeholder-secondary-hover focus:ring-yellow-300 focus:border-yellow-300 rounded-lg" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-secondary-hover">{t('passwordHelp')}</FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                {formError && <p className="text-red-300 text-sm text-right">{formError}</p>}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-yellow-300 text-secondary-active hover:bg-yellow-400 disabled:opacity-50 px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    {isSubmitting ? t('submitting') : t('submit')}
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="border-t border-secondary-active flex justify-between items-center text-secondary-hover">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span className="text-sm font-medium">{t('inviteNumber', { id: invitacion.id })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Paperclip className="h-5 w-5" />
            <span className="text-sm font-medium">{t('attachment')}</span>
          </div>
        </CardFooter>
      </Card>
  )
}