import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select } from "@/components/boffmedia/primitives"
import { useGetEvents } from "@/hooks/events/useGetEvents"

const teamSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3),
  tag: z.string().max(5).optional(),
  icon: z.string().optional(),
  eventId: z.number(),
})

export type TeamFormValues = z.infer<typeof teamSchema>

interface TeamFormProps {
  defaultValues?: Partial<any>
  isSubmitting?: boolean
  onSubmit: (data: TeamFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function TeamForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel }: TeamFormProps) {
  const t = useTranslations("admin.form")
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const { register, handleSubmit, control, formState: { errors } } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultValues || { name: "", tag: "", icon: "", eventId: 0 },
  })

  const eventOptions = [
    { value: "", label: isLoadingEvents ? t("team.eventLoading") : t("team.eventPlaceholder") },
    ...(events?.map((e) => ({ value: String(e.id), label: e.title })) ?? []),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label={t("team.nameLabel")} hint={t("team.nameHint")} error={errors.name?.message}>
        <Input placeholder={t("team.namePlaceholder")} {...register("name")} />
      </Field>

      <Field label={t("team.tagLabel")} hint={t("team.tagHint")} error={errors.tag?.message}>
        <Input placeholder="TAG" {...register("tag")} />
      </Field>

      <Controller
        control={control}
        name="eventId"
        render={({ field }) => (
          <Select
            label={t("team.eventLabel")}
            hint={t("team.eventHint")}
            error={errors.eventId?.message}
            value={field.value ? String(field.value) : ""}
            options={eventOptions}
            disabled={isLoadingEvents}
            onChange={(v) => field.onChange(v ? Number(v) : 0)}
          />
        )}
      />

      <Field label={t("team.iconLabel")} hint={t("team.iconHint")} error={errors.icon?.message}>
        <Input placeholder="https://example.com/icon.jpg" {...register("icon")} />
      </Field>

      <div className="flex justify-end gap-2.5 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" variant="pri" loading={isSubmitting} disabled={isSubmitting || isLoadingEvents}>{submitLabel}</Button>
      </div>
    </form>
  )
}
