import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select } from "@boffmedia/ui"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { CreateEventAchievementDto as CreateAchievementDto } from "@boffmedia/shared"

const achievementSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3),
  description: z.string().min(10),
  icon: z.string().min(1),
  eventId: z.number(),
  points: z.number().min(0),
  maxProgress: z.number().min(1),
  itemType: z.nativeEnum(CreateAchievementDto.itemType).optional(),
  category: z.nativeEnum(CreateAchievementDto.category).optional(),
  rarity: z.nativeEnum(CreateAchievementDto.rarity).optional(),
  order: z.number().optional(),
  active: z.number().optional(),
})

export type AchievementFormValues = z.infer<typeof achievementSchema>

interface AchievementFormProps {
  defaultValues?: Partial<AchievementFormValues>
  isSubmitting?: boolean
  onSubmit: (data: AchievementFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function AchievementForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel }: AchievementFormProps) {
  const t = useTranslations("admin.form")
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const { register, handleSubmit, control, formState: { errors } } = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementSchema),
    defaultValues: defaultValues || {
      name: "", description: "", icon: "", eventId: 0, points: 0, maxProgress: 1,
      itemType: CreateAchievementDto.itemType.ACHIEVEMENT,
      category: CreateAchievementDto.category.CHALLENGE,
      rarity: CreateAchievementDto.rarity.BRONZE,
      order: 0, active: 1,
    },
  })

  const eventOptions = [
    { value: "", label: isLoadingEvents ? t("achievement.eventLoading") : t("achievement.eventPlaceholder") },
    ...(events?.map((e) => ({ value: String(e.id), label: e.title })) ?? []),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label={t("achievement.nameLabel")} hint={t("achievement.nameHint")} error={errors.name?.message}>
        <Input placeholder={t("achievement.namePlaceholder")} {...register("name")} />
      </Field>

      <Field label={t("achievement.descLabel")} hint={t("achievement.descHint")} error={errors.description?.message}>
        <textarea
          placeholder={t("achievement.descPlaceholder")}
          className="w-full font-body text-[15px] leading-[1.4] text-txt bg-base [[data-theme=light]_&]:bg-panel border border-solid border-line-2 py-[11px] px-[14px] cut-tag min-h-[90px] resize-y outline-none focus:border-accent placeholder:text-txt-dim"
          {...register("description")}
        />
      </Field>

      <Controller
        control={control}
        name="eventId"
        render={({ field }) => (
          <Select
            label={t("achievement.eventLabel")}
            hint={t("achievement.eventHint")}
            error={errors.eventId?.message}
            value={field.value ? String(field.value) : ""}
            options={eventOptions}
            disabled={isLoadingEvents}
            onChange={(v) => field.onChange(v ? Number(v) : 0)}
          />
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("achievement.pointsLabel")} hint={t("achievement.pointsHint")} error={errors.points?.message}>
          <Input type="number" placeholder="100" {...register("points", { valueAsNumber: true })} />
        </Field>
        <Field label={t("achievement.maxProgressLabel")} hint={t("achievement.maxProgressHint")} error={errors.maxProgress?.message}>
          <Input type="number" placeholder="1" {...register("maxProgress", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field label={t("achievement.iconLabel")} hint={t("achievement.iconHint")} error={errors.icon?.message}>
        <Input placeholder="/icons/achievement.png" {...register("icon")} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="itemType"
          render={({ field }) => (
            <Select
              label={t("achievement.itemTypeLabel")}
              value={field.value ?? ""}
              options={[
                { value: CreateAchievementDto.itemType.ACHIEVEMENT, label: t("achievement.itemTypeAchievement") },
                { value: CreateAchievementDto.itemType.MEDAL, label: t("achievement.itemTypeMedal") },
              ]}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              label={t("achievement.categoryLabel")}
              value={field.value ?? ""}
              options={[
                { value: CreateAchievementDto.category.CHALLENGE, label: t("achievement.categoryChallenge") },
                { value: CreateAchievementDto.category.COMPETITION, label: t("achievement.categoryCompetition") },
                { value: CreateAchievementDto.category.PARTICIPATION, label: t("achievement.categoryParticipation") },
              ]}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="rarity"
          render={({ field }) => (
            <Select
              label={t("achievement.rarityLabel")}
              value={field.value ?? ""}
              options={[
                { value: CreateAchievementDto.rarity.BRONZE, label: t("achievement.rarityBronze") },
                { value: CreateAchievementDto.rarity.SILVER, label: t("achievement.raritySilver") },
                { value: CreateAchievementDto.rarity.GOLD, label: t("achievement.rarityGold") },
                { value: CreateAchievementDto.rarity.PLATINUM, label: t("achievement.rarityPlatinum") },
                { value: CreateAchievementDto.rarity.DIAMOND, label: t("achievement.rarityDiamond") },
              ]}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <Select
              label={t("achievement.activeLabel")}
              value={field.value != null ? String(field.value) : "1"}
              options={[
                { value: "1", label: t("achievement.activeOn") },
                { value: "0", label: t("achievement.activeOff") },
              ]}
              onChange={(v) => field.onChange(Number(v))}
            />
          )}
        />
      </div>

      <Field label={t("achievement.orderLabel")} hint={t("achievement.orderHint")} error={errors.order?.message}>
        <Input type="number" placeholder="0" {...register("order", { valueAsNumber: true })} />
      </Field>

      <div className="flex justify-end gap-2.5 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" variant="pri" loading={isSubmitting} disabled={isSubmitting || isLoadingEvents}>{submitLabel}</Button>
      </div>
    </form>
  )
}
