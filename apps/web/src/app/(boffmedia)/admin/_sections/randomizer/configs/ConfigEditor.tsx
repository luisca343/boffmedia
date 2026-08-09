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
import type { RandomizerConfig, RandomizerPreset, RandomizerRom } from "@/services/api/boffmedia/randomizer.types"
import type { AdminPack } from "@/services/api/boffmedia/packsService"

const makeConfigSchema = (t: (key: string) => string) =>
  z.object({
    gameTitle: z.string().min(1, t("titleRequired")),
    gamePlatform: z.enum(["gba", "nds"]),
    // presetId is required on create; enforced in onSubmit
    presetId: z.string().optional(),
    romId: z.string().optional(),
    romHint: z.string().optional().default(""),
    packId: z.string().optional(),
  })

type ConfigFormData = z.infer<ReturnType<typeof makeConfigSchema>>

interface ConfigEditorProps {
  config?: RandomizerConfig | null
  eventId: number | null
  onSave: () => void
  onCancel: () => void
}

export function ConfigEditor({
  config,
  eventId,
  onSave,
  onCancel,
}: ConfigEditorProps) {
  const t = useTranslations("randomizer.events")
  const isExisting = Boolean(config?.id)
  const [presets, setPresets] = useState<RandomizerPreset[]>([])
  const [packs, setPacks] = useState<AdminPack[]>([])
  const [roms, setRoms] = useState<RandomizerRom[]>([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [loadingRoms, setLoadingRoms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [romError, setRomError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(makeConfigSchema(t)),
    // Branch on an actual saved config (id), not truthiness: the "create" path
    // passes an empty {} sentinel, which is truthy and would otherwise take the
    // existing-config branch — leaving gamePlatform undefined and failing the
    // enum validation silently (that Select has no error slot).
    defaultValues: config?.id
      ? {
          gameTitle: config.gameTitle,
          gamePlatform: config.gamePlatform,
          presetId: undefined, // not returned by the API; only chosen on create
          romId: config.romId ? String(config.romId) : "",
          romHint: config.romHint ?? "",
          packId: config.packId ?? undefined,
        }
      : {
          gamePlatform: "gba",
          romId: "",
          romHint: "",
        },
  })

  const selectedPlatform = watch("gamePlatform")
  const selectedRomId = watch("romId")

  useEffect(() => {
    loadPresets()
    loadPacks()
    loadRoms()
  }, [])

  const loadRoms = async () => {
    setLoadingRoms(true)
    try {
      const res = await RandomizerService.listRoms()
      setRoms(res.success ? res.data || [] : [])
      setRomError(null)
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingRoms"), msg: String(err) })
      setRomError(String(err))
    } finally {
      setLoadingRoms(false)
    }
  }

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

  const onSubmit = async (data: ConfigFormData) => {
    if (!eventId) {
      toast({ tone: "bad", title: t("selectEvent") })
      return
    }

    setSubmitting(true)
    try {
      if (isExisting && config) {
        // romHint, packId, and romId are editable once a config exists
        const res = await RandomizerService.updateConfig(config.id, {
          romHint: data.romHint,
          packId: data.packId || undefined,
          romId: data.romId ? Number(data.romId) : undefined,
        })
        if (res.success) {
          toast({ tone: "ok", title: t("configUpdated") })
          onSave()
        } else {
          toast({ tone: "bad", title: t("updateError"), msg: res.userMessage })
        }
      } else {
        if (!data.presetId) {
          toast({ tone: "bad", title: t("selectPreset") })
          return
        }
        if (!data.romId) {
          toast({ tone: "bad", title: t("selectBaseRom") })
          return
        }
        if (!data.packId) {
          toast({ tone: "bad", title: t("selectPack") })
          return
        }
        const res = await RandomizerService.createConfig({
          eventId,
          gamePlatform: data.gamePlatform,
          gameTitle: data.gameTitle,
          presetId: Number(data.presetId),
          romId: Number(data.romId),
          packId: data.packId,
          romHint: data.romHint || "",
        })
        if (res.success) {
          toast({ tone: "ok", title: t("configCreated") })
          reset()
          onSave()
        } else {
          toast({ tone: "bad", title: t("createError"), msg: res.userMessage })
        }
      }
    } catch (err) {
      // Surface backend/network failures instead of silently swallowing them
      // (a thrown error here previously made the button look dead).
      toast({
        tone: "bad",
        title: isExisting ? t("updateError") : t("createError"),
        msg: (err as { message?: string })?.message ?? String(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={isExisting ? t("editConfig") : t("createConfig")}
        actions={
          <Button onClick={onCancel} variant="ghost" size="sm">
            {t("cancel")}
          </Button>
        }
      />

      <AvPanel>
        <form
          onSubmit={handleSubmit(onSubmit, (errs) => {
            // Some fields (e.g. the platform Select) have no inline error slot;
            // surface a toast so a blocked submit never looks like a dead button.
            const firstMsg = Object.values(errs).find((e) => e?.message)?.message
            toast({ tone: "bad", title: t("createError"), msg: firstMsg })
          })}
          className="space-y-5"
        >
          {/* Game Title */}
          <Field label={t("title")} error={errors.gameTitle?.message}>
            <Input
              placeholder={t("titlePlaceholder")}
              disabled={isExisting}
              {...register("gameTitle")}
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
                disabled={isExisting}
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
                value={field.value || ""}
                options={[
                  { value: "", label: t("selectPreset") },
                  ...presets.map((preset) => ({
                    value: preset.id,
                    label: preset.name,
                  })),
                ]}
                disabled={loadingPresets || isExisting}
                onChange={(v) => field.onChange(v || undefined)}
              />
            )}
          />

          {/* Base ROM Selector */}
          <Controller
            control={control}
            name="romId"
            render={({ field }) => {
              const romsForPlatform = roms.filter((r) => r.gamePlatform === selectedPlatform)
              const isBaseMissing = isExisting && !config?.romId

              return (
                <>
                  <Select
                    label={t("baseRom")}
                    error={errors.romId?.message || (isExisting && !selectedRomId && t("baseRomMissingWarning"))}
                    value={field.value || ""}
                    options={[
                      { value: "", label: t("selectBaseRom") },
                      ...romsForPlatform.map((rom) => ({
                        value: String(rom.id),
                        label: `${rom.name} (${(rom.fileSize / 1024 / 1024).toFixed(1)} MB)`,
                      })),
                    ]}
                    disabled={loadingRoms || (!isExisting && romsForPlatform.length === 0)}
                    onChange={(v) => field.onChange(v || undefined)}
                  />
                  {!isExisting && romsForPlatform.length === 0 && (
                    <p className="text-[12px] text-txt-dim mt-2">
                      {t("noRomsForPlatform")}
                    </p>
                  )}
                  {isBaseMissing && (
                    <div className="mt-3 p-3 bg-danger-alpha rounded border border-solid border-danger text-danger text-[12px]">
                      {t("baseRomMissingWarning")}
                    </div>
                  )}
                </>
              )
            }}
          />

          {/* ROM Hint */}
          <Field label={t("romHint")} hint={t("optional")}>
            <Input
              placeholder={t("romHintPlaceholder")}
              {...register("romHint")}
            />
          </Field>

          {/* Pack Selector — required: this is what links the event to the
              launcher (pack → event → config). */}
          <Controller
            control={control}
            name="packId"
            render={({ field }) => (
              <Select
                label={t("packLabel")}
                hint={t("packHint")}
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
              {isExisting ? t("save") : t("create")}
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
