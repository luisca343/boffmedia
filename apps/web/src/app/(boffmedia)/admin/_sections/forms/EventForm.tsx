import { useForm, useWatch, Controller } from "react-hook-form"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select } from "@boffmedia/ui"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetGames } from "@/hooks/events/useGetGames"
import { PacksService, type AdminPack } from "@/services/api/boffmedia/packsService"
import type { Event } from "@boffmedia/shared"

const eventSchema = z.object({
  id: z.number().optional(),
  parentId: z.number().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  icon: z.string().optional(),
  banner: z.string().optional(),
  gameId: z.number(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: z.enum(["event", "server"]),
  visibility: z.enum(["public", "private"]),
  status: z.enum(["upcoming", "active", "completed"]),
  // "" means "no pack"; the API stores null. Nullable because that is what the
  // Event entity hands back for a pack-less event.
  packId: z.string().nullish(),
})

export type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  isSubmitting?: boolean
  onSubmit: (data: EventFormValues) => void
  onCancel: () => void
  submitLabel?: string
  parentEvent?: Event | null
}

export function EventForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel, parentEvent }: EventFormProps) {
  const t = useTranslations("admin.form")
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const { games, isLoading: isLoadingGames } = useGetGames()

  const parentEvents =
    events?.filter((e) => e.type === "server" && e.id !== defaultValues?.id && !e.parentId) || []

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
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
      status: defaultValues?.status ?? "upcoming",
      packId: defaultValues?.packId ?? "",
    },
  })

  // The pack picker is no longer randomizer-only: event membership is what
  // entitles a player to the pack, whatever game the pack targets.
  const [packs, setPacks] = useState<AdminPack[] | null>(null)
  useEffect(() => {
    let alive = true
    PacksService.list()
      .then((res) => {
        if (alive) setPacks(res.success ? (res.data ?? []) : [])
      })
      .catch(() => {
        if (alive) setPacks([])
      })
    return () => {
      alive = false
    }
  }, [])

  const parentIdValue = useWatch({ control, name: "parentId" })
  const typeValue = useWatch({ control, name: "type" })
  const isChildEvent = Boolean(parentIdValue)

  useEffect(() => {
    if (isChildEvent && typeValue === "server") setValue("type", "event")
  }, [isChildEvent, typeValue, setValue])

  const gameOptions = [
    { value: "", label: isLoadingGames ? t("event.gameLoading") : t("event.gamePlaceholder") },
    ...(games?.map((g) => ({ value: String(g.id), label: g.title })) ?? []),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {!parentEvent && (
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => (
            <Select
              label={t("event.parentLabel")}
              hint={isChildEvent ? t("event.parentHintChild") : t("event.parentHint")}
              value={field.value != null ? String(field.value) : ""}
              options={[
                { value: "", label: t("event.parentNone") },
                ...parentEvents.map((e) => ({ value: String(e.id), label: e.title })),
              ]}
              disabled={isLoadingEvents}
              onChange={(v) => field.onChange(v ? Number(v) : undefined)}
            />
          )}
        />
      )}

      <Field label={t("event.titleLabel")} hint={t("event.titleHint")} error={errors.title?.message}>
        <Input placeholder={t("event.titlePlaceholder")} {...register("title")} />
      </Field>

      <Field label={t("event.descLabel")} hint={t("event.descHint")} error={errors.description?.message}>
        <textarea
          placeholder={t("event.descPlaceholder")}
          className="w-full font-body text-[15px] leading-[1.4] text-txt bg-base [[data-theme=light]_&]:bg-panel border border-solid border-line-2 py-[11px] px-[14px] cut-tag min-h-[90px] resize-y outline-none focus:border-accent placeholder:text-txt-dim"
          {...register("description")}
        />
      </Field>

      <Controller
        control={control}
        name="gameId"
        render={({ field }) => (
          <Select
            label={t("event.gameLabel")}
            hint={t("event.gameHint")}
            error={errors.gameId?.message}
            value={field.value ? String(field.value) : ""}
            options={gameOptions}
            disabled={isLoadingGames}
            onChange={(v) => field.onChange(v ? Number(v) : 0)}
          />
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("event.startLabel")} error={errors.startDate?.message}>
          <Input type="datetime-local" {...register("startDate")} />
        </Field>
        <Field label={t("event.endLabel")} error={errors.endDate?.message}>
          <Input type="datetime-local" {...register("endDate")} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label={t("event.typeLabel")}
              hint={isChildEvent ? t("event.typeHintChild") : t("event.typeHint")}
              value={field.value ?? ""}
              options={[
                { value: "event", label: t("event.typeEvent") },
                { value: "server", label: t("event.typeServer") },
              ]}
              disabled={isChildEvent}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <Select
              label={t("event.visibilityLabel")}
              hint={t("event.visibilityHint")}
              value={field.value ?? ""}
              options={[
                { value: "public", label: t("event.visibilityPublic") },
                { value: "private", label: t("event.visibilityPrivate") },
              ]}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label={t("event.statusLabel")}
              hint={t("event.statusHint")}
              value={field.value ?? "upcoming"}
              options={[
                { value: "upcoming", label: t("event.statusUpcoming") },
                { value: "active", label: t("event.statusActive") },
                { value: "completed", label: t("event.statusCompleted") },
              ]}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="packId"
          render={({ field }) => (
            <Select
              label={t("event.packLabel")}
              hint={t("event.packHint")}
              value={field.value ?? ""}
              options={[
                { value: "", label: packs === null ? t("event.packLoading") : t("event.packNone") },
                ...(packs?.map((p) => ({ value: p.id, label: `${p.name} · ${p.gameType}` })) ?? []),
              ]}
              disabled={packs === null}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <Field label={t("event.iconLabel")} hint={t("event.iconHint")} error={errors.icon?.message}>
        <Input placeholder="https://example.com/icon.jpg" {...register("icon")} />
      </Field>

      <Field label={t("event.bannerLabel")} hint={t("event.bannerHint")} error={errors.banner?.message}>
        <Input placeholder="https://example.com/banner.jpg" {...register("banner")} />
      </Field>

      <div className="flex justify-end gap-2.5 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" variant="pri" loading={isSubmitting} disabled={isSubmitting || isLoadingGames}>{submitLabel}</Button>
      </div>
    </form>
  )
}
