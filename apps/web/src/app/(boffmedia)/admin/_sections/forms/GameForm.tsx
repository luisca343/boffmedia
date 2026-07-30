import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Textarea } from "@boffmedia/ui"

const gameSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  icon: z.string().optional(),
})

export type GameFormValues = z.infer<typeof gameSchema>

interface GameFormProps {
  defaultValues?: Partial<GameFormValues>
  isSubmitting?: boolean
  onSubmit: (data: GameFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function GameForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel }: GameFormProps) {
  const t = useTranslations("admin.form")
  // `validation` is a root namespace in admin.json, not nested under `admin` —
  // scoping to "admin.validation" resolved to admin.admin.validation.* and rendered raw keys.
  const tv = useTranslations("validation")
  const { register, handleSubmit, formState: { errors } } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: defaultValues || { title: "", description: "", icon: "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label={t("game.titleLabel")} hint={t("game.titleHint")} error={errors.title?.message ? tv("titleMin") : undefined}>
        <Input placeholder={t("game.titlePlaceholder")} {...register("title")} />
      </Field>

      <Field label={t("game.descLabel")} hint={t("game.descHint")} error={errors.description?.message ? tv("descMin") : undefined}>
        <Textarea placeholder={t("game.descPlaceholder")} {...register("description")} />
      </Field>

      <Field label={t("game.iconLabel")} hint={t("game.iconHint")} error={errors.icon?.message}>
        <Input placeholder="https://example.com/icon.jpg" {...register("icon")} />
      </Field>

      <div className="flex justify-end gap-2.5 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" variant="pri" loading={isSubmitting} disabled={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
