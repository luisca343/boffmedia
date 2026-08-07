"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select, Spinner, toast } from "@boffmedia/ui"
import { AvPanel, AvSectionHead } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { PacksService } from "@/services/api/boffmedia/packsService"
import type { RandomizerEvent, RandomizerPreset } from "@/services/api/boffmedia/randomizer.types"
import type { AdminPack } from "@/services/api/boffmedia/packsService"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  gamePlatform: z.enum(["gba", "nds"]),
  presetId: z.string().optional(),
  cleanRomSha512: z.string().min(1, "ROM hash is required"),
  romHint: z.string().optional().default(""),
  packId: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventEditorProps {
  event?: RandomizerEvent | null
  tournamentId: string | null
  onSave: () => void
  onCancel: () => void
}

export function EventEditor({
  event,
  tournamentId,
  onSave,
  onCancel,
}: EventEditorProps) {
  const t = useTranslations("randomizer.events")
  const [presets, setPresets] = useState<RandomizerPreset[]>([])
  const [packs, setPacks] = useState<AdminPack[]>([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          title: event.title,
          gamePlatform: event.gamePlatform,
          presetId: event.presetId,
          cleanRomSha512: event.cleanRomSha512,
          romHint: event.romHint,
          packId: event.packId,
        }
      : {
          gamePlatform: "gba",
          romHint: "",
        },
  })

  useEffect(() => {
    loadPresets()
    loadPacks()
  }, [])

  const loadPresets = async () => {
    setLoadingPresets(true)
    try {
      const res = await RandomizerService.listPresets()
      setPresets(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingPresets"), msg: String(err) })
    } finally {
      setLoadingPresets(false)
    }
  }

  const loadPacks = async () => {
    setLoadingPacks(true)
    try {
      const res = await PacksService.list()
      // Filter to emulator packs only
      const emulatorPacks = (res.success ? res.data || [] : []).filter(
        (pack) => pack.gameType === "emulator"
      )
      setPacks(emulatorPacks)
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingPacks"), msg: String(err) })
    } finally {
      setLoadingPacks(false)
    }
  }

  const onSubmit = async (data: EventFormData) => {
    if (!tournamentId) {
      toast({ tone: "bad", title: t("selectTournament") })
      return
    }

    setSubmitting(true)
    try {
      if (event) {
        const res = await RandomizerService.updateEvent(event.id, data)
        if (res.success) {
          toast({ tone: "ok", title: t("eventUpdated") })
          onSave()
        } else {
          toast({ tone: "bad", title: t("updateError"), msg: res.userMessage })
        }
      } else {
        const res = await RandomizerService.createEvent({
          ...data,
          tournamentId,
        })
        if (res.success) {
          toast({ tone: "ok", title: t("eventCreated") })
          reset()
          onSave()
        } else {
          toast({ tone: "bad", title: t("createError"), msg: res.userMessage })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={event ? t("editEvent") : t("createEvent")}
        actions={
          <Button onClick={onCancel} variant="ghost" size="sm">
            {t("cancel")}
          </Button>
        }
      />

      <AvPanel>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <Field label={t("title")} error={errors.title?.message}>
            <Input
              placeholder={t("titlePlaceholder")}
              {...register("title")}
            />
          </Field>

          {/* Game Platform */}
          <Controller
            control={control}
            name="gamePlatform"
            render={({ field }) => (
              <Select
                label={t("gamePlatform")}
                value={field.value}
                options={[
                  { value: "gba", label: "GBA" },
                  { value: "nds", label: "NDS" },
                ]}
                onChange={field.onChange}
              />
            )}
          />

          {/* Preset Selector */}
          <Controller
            control={control}
            name="presetId"
            render={({ field }) => (
              <Select
                label={t("presetLabel")}
                hint={t("optional")}
                value={field.value || ""}
                options={[
                  { value: "", label: t("selectPreset") },
                  ...presets.map((preset) => ({
                    value: preset.id,
                    label: preset.name,
                  })),
                ]}
                disabled={loadingPresets}
                onChange={(v) => field.onChange(v || undefined)}
              />
            )}
          />

          {/* Clean ROM SHA512 */}
          <Field label={t("cleanRomSha512")} error={errors.cleanRomSha512?.message}>
            <Input
              placeholder={t("romHashPlaceholder")}
              {...register("cleanRomSha512")}
            />
          </Field>

          {/* ROM Hint */}
          <Field label={t("romHint")} hint={t("optional")}>
            <Input
              placeholder={t("romHintPlaceholder")}
              {...register("romHint")}
            />
          </Field>

          {/* Pack Selector */}
          <Controller
            control={control}
            name="packId"
            render={({ field }) => (
              <Select
                label={t("packLabel")}
                hint={t("optional")}
                value={field.value || ""}
                options={[
                  { value: "", label: t("selectPack") },
                  ...packs.map((pack) => ({
                    value: pack.id,
                    label: pack.name,
                  })),
                ]}
                disabled={loadingPacks}
                onChange={(v) => field.onChange(v || undefined)}
              />
            )}
          />

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner size={16} />}
              {event ? t("save") : t("create")}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </AvPanel>
    </div>
  )
}
