"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { useTranslations } from "next-intl"

const createGameSchema = (t: (key: string) => string) => z.object({
  id: z.number().optional(),
  title: z.string().min(3, t('admin.games.form.validation.titleMin')),
  description: z.string().min(10, t('admin.games.form.validation.descriptionMin')),
  icon: z.string().optional(),
})

export type GameFormValues = z.infer<ReturnType<typeof createGameSchema>>

interface GameFormProps {
  defaultValues?: Partial<GameFormValues>
  isSubmitting?: boolean
  onSubmit: (data: GameFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function GameForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel }: GameFormProps) {
  const t = useTranslations('boffmedia')
  
  const form = useForm<GameFormValues>({
    resolver: zodResolver(createGameSchema(t)),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      icon: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.games.form.labels.title')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.games.form.placeholders.title')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.games.form.descriptions.title')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.games.form.labels.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('admin.games.form.placeholders.description')}
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.games.form.descriptions.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.games.form.labels.icon')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.games.form.placeholders.icon')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.games.form.descriptions.icon')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('admin.games.delete.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel || t('admin.games.form.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

