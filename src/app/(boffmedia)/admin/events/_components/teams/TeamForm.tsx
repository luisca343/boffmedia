"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useTranslations } from "next-intl"

const createTeamSchema = (t: (key: string) => string) => z.object({
  id: z.number().optional(),
  name: z.string().min(3, t('admin.teams.form.validation.nameMin')),
  tag: z.string().max(5, t('admin.teams.form.validation.tagMax')).optional(),
  icon: z.string().optional(),
  eventId: z.number(),
})

export type TeamFormValues = z.infer<ReturnType<typeof createTeamSchema>>

interface TeamFormProps {
  defaultValues?: Partial<any>
  isSubmitting?: boolean
  onSubmit: (data: TeamFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function TeamForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel }: TeamFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const t = useTranslations('boffmedia')

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(createTeamSchema(t)),
    defaultValues: defaultValues || {
      name: "",
      tag: "",
      icon: "",
      eventId: 0,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.teams.form.labels.name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.teams.form.placeholders.name')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.teams.form.descriptions.name')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.teams.form.labels.tag')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.teams.form.placeholders.tag')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.teams.form.descriptions.tag')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.teams.form.labels.event')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingEvents}
              >
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={isLoadingEvents ? t('admin.teams.form.loadingEvents') : t('admin.teams.form.placeholders.selectEvent')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t('admin.teams.form.descriptions.event')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.teams.form.labels.icon')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.teams.form.placeholders.icon')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.teams.form.descriptions.icon')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-surface-600 text-surface-300">
            {t('admin.teams.delete.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingEvents}
          >
            {submitLabel || t('admin.teams.form.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

