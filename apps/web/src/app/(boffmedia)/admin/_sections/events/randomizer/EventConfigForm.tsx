"use client"

import { useEffect, useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Select, Spinner, toast } from "@boffmedia/ui"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { PacksService } from "@/services/api/boffmedia/packsService"
import { RomUploadModal } from "../../randomizer/roms/RomUploadModal"
import type {
  RandomizerConfig,
  RandomizerPreset,
  RandomizerRom,
} from "@/services/api/boffmedia/randomizer.types"
import type { AdminPack } from "@/services/api/boffmedia/packsService"

// presetId/gameTitle only exist on create; edit PATCHes packId/romId/romHint.
const makeSchema = (t: (key: string) => string, isEdit: boolean) =>
  z.object({
    packId: z.string().min(1, t("errPackRequired")),
    gamePlatform: z.enum(["gba", "nds"]),
    romId: z.string().min(1, t("errRomRequired")),
    presetId: isEdit ? z.string().optional() : z.string().min(1, t("errPresetRequired")),
    gameTitle: isEdit ? z.string().optional() : z.string().min(1, t("errTitleRequired")),
    romHint: z.string().optional(),
  })

interface ConfigFormData {
  packId: string
  gamePlatform: "gba" | "nds"
  romId: string
  presetId?: string
  gameTitle?: string
  romHint?: string
}

interface EventConfigFormProps {
  config?: RandomizerConfig | null
  eventId: number
  onSaved: () => void
  /** Backs out of an unsaved create, returning the panel to its CTA. */
  onCancel?: () => void
}

export function EventConfigForm({ config, eventId, onSaved, onCancel }: EventConfigFormProps) {
  const t = useTranslations("randomizer.eventPanel.form")
  const isEdit = Boolean(config?.id)
  const [presets, setPresets] = useState<RandomizerPreset[]>([])
  const [packs, setPacks] = useState<AdminPack[]>([])
  const [roms, setRoms] = useState<RandomizerRom[]>([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [loadingRoms, setLoadingRoms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(makeSchema(t, isEdit)) as Resolver<ConfigFormData>,
    defaultValues:
      isEdit && config
        ? {
            packId: config.packId ?? "",
            gamePlatform: config.gamePlatform,
            romId: config.romId ? String(config.romId) : "",
            romHint: config.romHint ?? "",
          }
        : {
            packId: "",
            gamePlatform: "gba",
            romId: "",
            presetId: "",
            gameTitle: "",
            romHint: "",
          },
  })

  const selectedPlatform = watch("gamePlatform")
  const romsForPlatform = roms.filter((r) => r.gamePlatform === selectedPlatform)

  useEffect(() => {
    loadPacks()
    loadRoms()
    if (!isEdit) loadPresets()
  }, [])

  const loadPacks = async () => {
    setLoadingPacks(true)
    try {
      const res = await PacksService.list()
      // Only emulator packs can carry a randomizer event.
      setPacks((res.success ? res.data || [] : []).filter((p) => p.gameType === "emulator"))
    } catch (err) {
      toast({ tone: "bad", title: t("loadPacksError"), msg: String(err) })
    } finally {
      setLoadingPacks(false)
    }
  }

  const loadPresets = async () => {
    setLoadingPresets(true)
    try {
      const res = await RandomizerService.listPresets()
      setPresets(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("loadPresetsError"), msg: String(err) })
    } finally {
      setLoadingPresets(false)
    }
  }

  const loadRoms = async () => {
    setLoadingRoms(true)
    try {
      const res = await RandomizerService.listRoms()
      setRoms(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("loadRomsError"), msg: String(err) })
    } finally {
      setLoadingRoms(false)
    }
  }

  const onSubmit = async (data: ConfigFormData) => {
    setSubmitting(true)
    try {
      const res =
        isEdit && config
          ? await RandomizerService.updateConfig(config.id, {
              romHint: data.romHint ?? "",
              packId: data.packId,
              romId: Number(data.romId),
            })
          : await RandomizerService.createConfig({
              eventId,
              gamePlatform: data.gamePlatform,
              gameTitle: data.gameTitle!,
              presetId: Number(data.presetId),
              romId: Number(data.romId),
              packId: data.packId,
              romHint: data.romHint || "",
            })
      if (res.success) {
        toast({ tone: "ok", title: isEdit ? t("updated") : t("created") })
        onSaved()
      } else {
        toast({
          tone: "bad",
          title: isEdit ? t("updateError") : t("createError"),
          msg: res.userMessage,
        })
      }
    } catch (err) {
      toast({
        tone: "bad",
        title: isEdit ? t("updateError") : t("createError"),
        msg: (err as { message?: string })?.message ?? String(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AvPanel>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Controller
            control={control}
            name="packId"
            render={({ field }) => (
              <Select
                label={t("packLabel")}
                hint={t("packHint")}
                error={errors.packId?.message}
                value={field.value || ""}
                options={[
                  { value: "", label: t("packPlaceholder") },
                  ...packs.map((pack) => ({ value: pack.id, label: pack.name })),
                ]}
                disabled={loadingPacks}
                onChange={field.onChange}
              />
            )}
          />
          {!loadingPacks && packs.length === 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[12px] text-txt-dim">
              <span>{t("noPacks")}</span>
              <a
                href="/admin?section=packs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                {t("noPacksLink")}
                <Icon name="external" size={12} />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon="refresh"
                title={t("refresh")}
                onClick={loadPacks}
              />
            </div>
          )}
        </div>

        {!isEdit && (
          <Controller
            control={control}
            name="gamePlatform"
            render={({ field }) => (
              <Select
                label={t("platformLabel")}
                value={field.value}
                options={[
                  { value: "gba", label: "GBA" },
                  { value: "nds", label: "NDS" },
                ]}
                onChange={(v) => {
                  field.onChange(v)
                  // A ROM picked for the previous platform is invalid now.
                  const current = roms.find((r) => String(r.id) === getValues("romId"))
                  if (current && current.gamePlatform !== v) setValue("romId", "")
                }}
              />
            )}
          />
        )}

        <div className="space-y-2">
          <Controller
            control={control}
            name="romId"
            render={({ field }) => (
              <Select
                label={t("romLabel")}
                error={errors.romId?.message}
                value={field.value || ""}
                options={[
                  { value: "", label: t("romPlaceholder") },
                  ...romsForPlatform.map((rom) => ({
                    value: String(rom.id),
                    label: `${rom.name} (${(rom.fileSize / 1024 / 1024).toFixed(1)} MB)`,
                  })),
                ]}
                disabled={loadingRoms || romsForPlatform.length === 0}
                onChange={field.onChange}
              />
            )}
          />
          {!loadingRoms && romsForPlatform.length === 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[12px] text-txt-dim">
              <span>{t("noRomsForPlatform")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon="upload"
                onClick={() => setUploadOpen(true)}
              >
                {t("uploadRom")}
              </Button>
            </div>
          )}
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Controller
              control={control}
              name="presetId"
              render={({ field }) => (
                <Select
                  label={t("presetLabel")}
                  error={errors.presetId?.message}
                  value={field.value || ""}
                  options={[
                    { value: "", label: t("presetPlaceholder") },
                    ...presets.map((preset) => ({ value: preset.id, label: preset.name })),
                  ]}
                  disabled={loadingPresets}
                  onChange={field.onChange}
                />
              )}
            />
            {!loadingPresets && presets.length === 0 && (
              <div className="flex items-center gap-2 flex-wrap text-[12px] text-txt-dim">
                <span>{t("noPresets")}</span>
                <a
                  href="/admin?section=randomizer&view=editor"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  {t("noPresetsLink")}
                  <Icon name="external" size={12} />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="refresh"
                  title={t("refresh")}
                  onClick={loadPresets}
                />
              </div>
            )}
          </div>
        )}

        {!isEdit && (
          <Field label={t("titleLabel")} error={errors.gameTitle?.message}>
            <Input placeholder={t("titlePlaceholder")} {...register("gameTitle")} />
          </Field>
        )}

        <Field label={t("romHintLabel")} hint={t("optional")}>
          <Input placeholder={t("romHintPlaceholder")} {...register("romHint")} />
        </Field>

        <div className="pt-2 flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner size={16} />}
            {isEdit ? t("save") : t("create")}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" disabled={submitting} onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
        </div>
      </form>

      <RomUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultPlatform={selectedPlatform}
        onUploaded={async (rom) => {
          setUploadOpen(false)
          await loadRoms()
          setValue("romId", String(rom.id), { shouldValidate: true })
        }}
      />
    </AvPanel>
  )
}
