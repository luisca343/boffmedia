"use client"

import { useState, useCallback } from "react"
import { useForm, FormProvider, useFormContext, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import {
  Button,
  Tabs,
  Select,
  Toggle,
  Input,
  Icon,
  Spinner,
  toast,
} from "@boffmedia/ui"
import { AvPanel, AvSectionHead, AvAlert } from "../../_components/ui/av-kit"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import defaultSettings from "./default-settings"
import { TAB_REGISTRY } from "./tabs"

/**
 * Supported FVX games, grouped by generation.
 * This is a static list for now; later passes can make it dynamic.
 */
const FVX_GAMES = [
  { value: "POKÉMON_RED", label: "Pokémon Red" },
  { value: "POKÉMON_BLUE", label: "Pokémon Blue" },
  { value: "POKÉMON_YELLOW", label: "Pokémon Yellow" },
  { value: "POKÉMON_GOLD", label: "Pokémon Gold" },
  { value: "POKÉMON_SILVER", label: "Pokémon Silver" },
  { value: "POKÉMON_CRYSTAL", label: "Pokémon Crystal" },
  { value: "POKÉMON_RUBY", label: "Pokémon Ruby" },
  { value: "POKÉMON_SAPPHIRE", label: "Pokémon Sapphire" },
  { value: "POKÉMON_EMERALD", label: "Pokémon Emerald" },
  { value: "POKÉMON_FIRERED", label: "Pokémon FireRed" },
  { value: "POKÉMON_LEAFGREEN", label: "Pokémon LeafGreen" },
]

// Labels resolve from `randomizer.tabs.*` at render time; the array carries the
// order and the id (which is also the translation key).
const RANDOMIZER_TABS = [
  { value: "traits" },
  { value: "starters" },
  { value: "moves" },
  { value: "foes" },
  { value: "wild" },
  { value: "tmhm" },
  { value: "items" },
  { value: "types" },
  { value: "graphics" },
  { value: "misc" },
] as const


/**
 * File input for ROM selection and dry-run.
 */
function RomFileSelector({ onDryRun }: { onDryRun: (file: File) => Promise<void> }) {
  const t = useTranslations("randomizer")
  const [loading, setLoading] = useState(false)

  const handleFileClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".gba,.nds"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setLoading(true)
        try {
          await onDryRun(file)
        } finally {
          setLoading(false)
        }
      }
    }
    input.click()
  }

  return (
    <button
      type="button"
      onClick={handleFileClick}
      disabled={loading}
      className="w-full flex flex-col items-center gap-2 py-8 px-4 rounded border-2 border-dashed border-line hover:border-accent hover:bg-panel-2 transition-colors disabled:opacity-50"
    >
      <Icon name="upload" size={24} className="text-txt-muted" />
      <p className="text-sm text-txt-muted">{t("chrome.dryRunDropZone")}</p>
    </button>
  )
}

/**
 * A top-level general option: label + sub-text on the left, form-bound toggle on
 * the right. Binds directly to a boolean RandomizerSettings field.
 */
function GeneralOptionToggle({
  field,
  labelKey,
  subKey,
}: {
  field: keyof RandomizerSettings
  labelKey: string
  subKey: string
}) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t(labelKey)}</p>
            <p className="text-xs text-txt-muted">{t(subKey)}</p>
          </div>
          <Toggle on={Boolean(value)} onChange={onChange} />
        </div>
      )}
    />
  )
}

/**
 * General options panel — the top-level toggles, wired to the form.
 * The Limit Pokémon full modal (per-gen picker) is a later pass; here the
 * boolean persists and reveals a summary sub-panel.
 */
function GeneralOptionsPanel() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const limitPokemon = useWatch({ control: form.control, name: "limitPokemon" })

  return (
    <AvPanel title={t("chrome.generalOptions")} icon="sliders">
      <div className="space-y-4">
        <GeneralOptionToggle
          field="limitPokemon"
          labelKey="chrome.limitPokemon"
          subKey="chrome.limitPokemonSub"
        />
        <GeneralOptionToggle
          field="banIrregularAltFormes"
          labelKey="chrome.banIrregularAltFormes"
          subKey="chrome.banIrregularAltFormesSub"
        />
        <GeneralOptionToggle
          field="banPrematureEvos"
          labelKey="chrome.banPrematureEvos"
          subKey="chrome.banPrematureEvosSub"
        />
        <GeneralOptionToggle
          field="randomizeIntroMon"
          labelKey="chrome.randomizeIntroMon"
          subKey="chrome.randomizeIntroMonSub"
        />
        <GeneralOptionToggle
          field="raceMode"
          labelKey="chrome.raceMode"
          subKey="chrome.raceModeSub"
        />

        {limitPokemon && (
          <AvPanel
            title={t("chrome.limitPokemonModal")}
            className="mt-2 border-l-[3px] border-l-accent bg-accent-soft/5"
          >
            <p className="text-sm text-txt-muted">
              {t("chrome.limitPokemonDesc")}
            </p>
          </AvPanel>
        )}
      </div>
    </AvPanel>
  )
}

/**
 * Top preset bar: load, import, export, save, dry-run.
 */
function PresetBar({ onSave, onDryRun, onImport, onExport }: {
  onSave: () => void
  onDryRun: (file: File) => Promise<void>
  onImport: (file: File) => Promise<void>
  onExport: () => void
}) {
  const t = useTranslations("randomizer")
  const [showDryRun, setShowDryRun] = useState(false)

  return (
    <AvPanel flush className="mb-5 flex flex-wrap gap-3 items-center">
      <Select
        value="new"
        options={[{ value: "new", label: t("chrome.newPreset") }]}
        onChange={() => {}}
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = ".rnqs"
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) await onImport(file)
          }
          input.click()
        }}
      >
        {t("chrome.importRnqs")}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
      >
        {t("chrome.exportRnqs")}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDryRun(true)}
      >
        {t("chrome.dryRun")}
      </Button>

      {showDryRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AvPanel className="max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("chrome.dryRun")}</h3>
              <button onClick={() => setShowDryRun(false)} className="text-txt-dim hover:text-txt">
                <Icon name="x" size={18} />
              </button>
            </div>
            <RomFileSelector onDryRun={async (file) => {
              await onDryRun(file)
              setShowDryRun(false)
            }} />
          </AvPanel>
        </div>
      )}
    </AvPanel>
  )
}

/**
 * Editor shell: form setup + tabs + toggles + validation.
 */
export function RandomizerEditor() {
  const t = useTranslations("randomizer")
  const [activeTab, setActiveTab] = useState<(typeof RANDOMIZER_TABS)[number]["value"]>("traits")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [presetDescription, setPresetDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(RandomizerSettings as any) as any,
    defaultValues: defaultSettings as any,
    mode: "onBlur" as const,
  })

  const isDirty = form.formState.isDirty
  const isValid = form.formState.isValid
  const errors = Object.keys(form.formState.errors)

  const handleSave = useCallback(async () => {
    if (!isValid) {
      toast({ tone: "bad", title: t("chrome.validationError"), msg: "Please fix errors before saving" })
      return
    }
    setSaveModalOpen(true)
  }, [isValid, t])

  const confirmSave = useCallback(async () => {
    if (!presetName.trim()) {
      toast({ tone: "bad", title: t("chrome.validationError"), msg: t("chrome.namePlaceholder") })
      return
    }
    setSaving(true)
    try {
      const res = await RandomizerService.createPreset({
        name: presetName.trim(),
        description: presetDescription.trim() || undefined,
        gameScope: selectedGame || undefined,
        settingsJson: form.getValues(),
      })
      if (res.success) {
        toast({ tone: "ok", title: t("chrome.presetSaved") })
        setSaveModalOpen(false)
        setPresetName("")
        setPresetDescription("")
      } else {
        toast({ tone: "bad", title: t("chrome.saveError"), msg: res.userMessage })
      }
    } finally {
      setSaving(false)
    }
  }, [presetName, presetDescription, selectedGame, form, t])

  const handleDryRun = useCallback(async (romFile: File) => {
    toast({ tone: "info", title: "Dry-run", msg: "Placeholder (wired in later pass)" })
  }, [])

  const handleImport = useCallback(async (file: File) => {
    toast({ tone: "info", title: "Import", msg: "Placeholder (wired in later pass)" })
  }, [])

  const handleExport = useCallback(async () => {
    toast({ tone: "info", title: "Export", msg: "Placeholder (wired in later pass)" })
  }, [])

  const TabComp = TAB_REGISTRY[activeTab]

  return (
    <FormProvider {...form}>
      <div className="space-y-5">
        {/* Preset Bar */}
        <PresetBar onSave={handleSave} onDryRun={handleDryRun} onImport={handleImport} onExport={handleExport} />

        {/* Game Selector */}
        <AvPanel title={t("chrome.gameSelector")} icon="gamepad">
          <Select
            value={selectedGame}
            options={[{ value: "", label: t("chrome.selectGame") }, ...FVX_GAMES]}
            onChange={(v) => setSelectedGame(v)}
          />
        </AvPanel>

        {/* General Options */}
        <GeneralOptionsPanel />

        {/* Settings Tabs */}
        <AvPanel className="mb-5">
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value as any)}
            tabs={RANDOMIZER_TABS.map((tab) => ({ value: tab.value, label: t(`tabs.${tab.value}`) }))}
          />
        </AvPanel>

        {activeTab && <TabComp />}

        {/* Sticky Footer: Validation + Actions */}
        <div className="space-y-3 border-t border-line pt-5">
          {errors.length > 0 && (
            <AvAlert tone="bad" title={t("chrome.validationError")}>
              {errors.length} field{errors.length > 1 ? "s" : ""} have errors
            </AvAlert>
          )}

          {isDirty && !isValid && (
            <AvAlert tone="info">
              {t("chrome.dirty")}
            </AvAlert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!isValid}
            >
              {t("chrome.save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => form.reset()}
              disabled={!isDirty}
            >
              {t("chrome.cancel")}
            </Button>
          </div>
        </div>

        {/* Save-preset modal */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <AvPanel className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t("chrome.savePreset")}</h3>
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="text-txt-dim hover:text-txt"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder={t("chrome.namePlaceholder")}
                  value={presetName}
                  onChange={(e) => setPresetName(e.currentTarget.value)}
                />
                <Input
                  placeholder={t("chrome.descriptionPlaceholder")}
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.currentTarget.value)}
                />
                <div className="flex gap-3 pt-2">
                  <Button onClick={confirmSave} disabled={saving} className="flex-1">
                    {saving && <Spinner size={16} />}
                    {t("chrome.save")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSaveModalOpen(false)}
                    disabled={saving}
                  >
                    {t("chrome.cancel")}
                  </Button>
                </div>
              </div>
            </AvPanel>
          </div>
        )}
      </div>
    </FormProvider>
  )
}
