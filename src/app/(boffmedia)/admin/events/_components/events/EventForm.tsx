"use client"

import { useForm, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetGames } from "@/hooks/events/useGetGames"
import type { Event } from "@/types/events"
import { useTranslations } from "next-intl"

const createEventSchema = (t: (key: string) => string) => z.object({
  id: z.number().optional(),
  parentId: z.number().optional(),
  title: z.string().min(3, t('admin.events.form.validation.titleMin')),
  description: z.string().min(10, t('admin.events.form.validation.descriptionMin')),
  icon: z.string().optional(),
  banner: z.string().optional(),
  gameId: z.number(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: z.enum(["event", "server"]),
  visibility: z.enum(["public", "private"]),
})

export type EventFormValues = z.infer<ReturnType<typeof createEventSchema>>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  isSubmitting?: boolean
  onSubmit: (data: EventFormValues) => void
  onCancel: () => void
  submitLabel?: string
  parentEvent?: Event | null
}

export function EventForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel,
  parentEvent,
}: EventFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const { games, isLoading: isLoadingGames } = useGetGames()
  const t = useTranslations('boffmedia')
  
  const parentEvents =
    events?.filter(
      (event) =>
        event.type === "server" &&
        event.id !== defaultValues?.id && 
        !event.parentId, // Only top-level servers can be parents
    ) || []

  const form = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema(t)),
    defaultValues: {
      ...defaultValues,
      parentId: parentEvent?.id,
      type: defaultValues?.type || (parentEvent ? "event" : "server"),
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      icon: defaultValues?.icon ?? "",
      banner: defaultValues?.banner ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      visibility: defaultValues?.visibility ?? "public",
    },
  })

  // Watch parentId and type; if this becomes a child event, ensure type is "event"
  const parentIdValue = useWatch({ control: form.control, name: "parentId" })
  const typeValue = useWatch({ control: form.control, name: "type" })
  const isChildEvent = Boolean(parentIdValue)

  useEffect(() => {
    if (isChildEvent && typeValue === "server") {
      form.setValue("type", "event")
    }
  }, [isChildEvent, typeValue, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        {!parentEvent && ( 
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.labels.parentEvent')}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  defaultValue={field.value?.toString()}
                  disabled={isLoadingEvents}
                >
                  <FormControl>
                    <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                      <SelectValue placeholder={t('admin.events.form.placeholders.selectParent')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    <SelectItem value={"-1"}>{t('admin.events.form.options.noParent')}</SelectItem>
                    {parentEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.events.form.descriptions.parentEvent')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.events.form.labels.title')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.events.form.placeholders.title')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.events.form.descriptions.title')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.events.form.labels.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('admin.events.form.placeholders.description')}
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.events.form.descriptions.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gameId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.events.form.labels.game')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingGames}
              >
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={isLoadingGames ? t('admin.events.form.loadingGames') : t('admin.events.form.placeholders.selectGame')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t('admin.events.form.descriptions.game')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.labels.startDate')}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-surface-700 border-surface-600 text-surface-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.labels.endDate')}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-surface-700 border-surface-600 text-surface-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.labels.type')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isChildEvent} // Disable if child event
                >
                  <FormControl>
                    <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    <SelectItem value="event">{t('admin.events.form.options.type.event')}</SelectItem>
                    <SelectItem value="server">{t('admin.events.form.options.type.server')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('admin.events.form.descriptions.type')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.labels.visibility')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    <SelectItem value="public">{t('admin.events.form.options.visibility.public')}</SelectItem>
                    <SelectItem value="private">{t('admin.events.form.options.visibility.private')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('admin.events.form.descriptions.visibility')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.events.form.labels.icon')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.events.form.placeholders.icon')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.events.form.descriptions.icon')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.events.form.labels.banner')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.events.form.placeholders.banner')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.events.form.descriptions.banner')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('admin.events.delete.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingGames}
          >
            {submitLabel || t('admin.events.form.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

