"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { CreateAchievementDto } from "@/generated/api"
import { useTranslations } from "next-intl"

const createAchievementSchema = (t: (key: string) => string) => z.object({
  id: z.number().optional(),
  name: z.string().min(3, t('admin.achievements.form.validation.nameMin')),
  description: z.string().min(10, t('admin.achievements.form.validation.descriptionMin')),
  icon: z.string().min(1, t('admin.achievements.form.validation.iconRequired')),
  eventId: z.number(),
  points: z.number().min(0, t('admin.achievements.form.validation.pointsMin')),
  maxProgress: z.number().min(1, t('admin.achievements.form.validation.maxProgressMin')),
  itemType: z.nativeEnum(CreateAchievementDto.itemType).optional(),
  category: z.nativeEnum(CreateAchievementDto.category).optional(),
  rarity: z.nativeEnum(CreateAchievementDto.rarity).optional(),
  order: z.number().optional(),
  active: z.number().optional(),
})

export type AchievementFormValues = z.infer<ReturnType<typeof createAchievementSchema>>

interface AchievementFormProps {
  defaultValues?: Partial<AchievementFormValues>
  isSubmitting?: boolean
  onSubmit: (data: AchievementFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function AchievementForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel,
}: AchievementFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const t = useTranslations('boffmedia')

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(createAchievementSchema(t)),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      icon: "",
      eventId: 0,
      points: 0,
      maxProgress: 1,
      itemType: CreateAchievementDto.itemType.ACHIEVEMENT,
      category: CreateAchievementDto.category.CHALLENGE,
      rarity: CreateAchievementDto.rarity.BRONZE,
      order: 0,
      active: 1,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pb-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.achievements.form.placeholders.name')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.achievements.form.descriptions.name')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('admin.achievements.form.placeholders.description')}
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('admin.achievements.form.descriptions.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.event')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingEvents}
              >
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={isLoadingEvents ? t('admin.achievements.form.loadingEvents') : t('admin.achievements.form.placeholders.selectEvent')} />
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
              <FormDescription>{t('admin.achievements.form.descriptions.event')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.points')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t('admin.achievements.form.placeholders.points')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>{t('admin.achievements.form.descriptions.points')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.icon')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('admin.achievements.form.placeholders.icon')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t('admin.achievements.form.descriptions.icon')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxProgress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.maxProgress')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t('admin.achievements.form.placeholders.maxProgress')}
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>{t('admin.achievements.form.descriptions.maxProgress')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.itemType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={t('admin.achievements.form.placeholders.selectType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  <SelectItem value={CreateAchievementDto.itemType.ACHIEVEMENT}>{t('admin.achievements.form.options.itemType.achievement')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.itemType.MEDAL}>{t('admin.achievements.form.options.itemType.medal')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('admin.achievements.form.descriptions.itemType')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={t('admin.achievements.form.placeholders.selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  <SelectItem value={CreateAchievementDto.category.CHALLENGE}>{t('admin.achievements.form.options.category.challenge')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.category.COMPETITION}>{t('admin.achievements.form.options.category.competition')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.category.PARTICIPATION}>{t('admin.achievements.form.options.category.participation')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('admin.achievements.form.descriptions.category')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rarity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.achievements.form.labels.rarity')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={t('admin.achievements.form.placeholders.selectRarity')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  <SelectItem value={CreateAchievementDto.rarity.BRONZE}>{t('admin.achievements.form.options.rarity.bronze')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.SILVER}>{t('admin.achievements.form.options.rarity.silver')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.GOLD}>{t('admin.achievements.form.options.rarity.gold')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.PLATINUM}>{t('admin.achievements.form.options.rarity.platinum')}</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.DIAMOND}>{t('admin.achievements.form.options.rarity.diamond')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('admin.achievements.form.descriptions.rarity')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.achievements.form.labels.order')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('admin.achievements.form.placeholders.order')}
                    className="bg-surface-700 border-surface-600 text-surface-50"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>{t('admin.achievements.form.descriptions.order')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.achievements.form.labels.status')}</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                      <SelectValue placeholder={t('admin.achievements.form.placeholders.status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    <SelectItem value="1">{t('admin.achievements.form.options.status.active')}</SelectItem>
                    <SelectItem value="0">{t('admin.achievements.form.options.status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('admin.achievements.form.descriptions.status')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-surface-600 text-surface-300">
            {t('admin.achievements.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingEvents}
          >
            {submitLabel || t('admin.achievements.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

