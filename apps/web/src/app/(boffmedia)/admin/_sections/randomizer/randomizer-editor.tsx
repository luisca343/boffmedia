"use client"

import { useState, useCallback } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import {
  Button,
  Tabs,
  Select,
  Toggle,
  Input,
  Icon,
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

const RANDOMIZER_TABS = [
  { value: "traits", label: "Rasgos" },
  { value: "starters", label: "Iniciales/Estáticos/Intercambios" },
  { value: "moves", label: "Movimientos" },
  { value: "foes", label: "Rivales" },
  { value: "wild", label: "Salvajes" },
  { value: "tmhm", label: "MT/MO/Tutores" },
  { value: "items", label: "Objetos" },
  { value: "types", label: "Tipos" },
  { value: "graphics", label: "Gráficos" },
  { value: "misc", label: "Ajustes varios" },
] as const


/**
 * File input for ROM selection and dry-run.
 */
function RomFileSelector({ onDryRun }: { onDryRun: (file: File) => Promise<void> }) {
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
      <p className="text-sm text-txt-muted">Drop .gba/.nds ROM here or click to browse</p>
    </button>
  )
}

/**
 * General options panel with top-level toggles (shell — per-control wiring in later pass).
 */
function GeneralOptionsPanel({ limitPokemon }: { limitPokemon: boolean }) {
  const t = useTranslations("admin.randomizer")

  return (
    <AvPanel title={t("chrome.generalOptions")} icon="sliders">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("chrome.limitPokemon")}</p>
            <p className="text-xs text-txt-muted">Only use Pokémon from selected generations</p>
          </div>
          <Toggle on={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("chrome.banIrregularAltFormes")}</p>
            <p className="text-xs text-txt-muted">Prevent irregular alternate forms</p>
          </div>
          <Toggle on={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("chrome.banPrematureEvos")}</p>
            <p className="text-xs text-txt-muted">Prevent pre-mature evolutions</p>
          </div>
          <Toggle on={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("chrome.randomizeIntroMon")}</p>
            <p className="text-xs text-txt-muted">Randomize the intro Pokémon</p>
          </div>
          <Toggle on={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("chrome.raceMode")}</p>
            <p className="text-xs text-txt-muted">Enable race mode (deterministic, no spoiler log)</p>
          </div>
          <Toggle on={false} onChange={() => {}} />
        </div>

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
  const t = useTranslations("admin.randomizer")
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
  const t = useTranslations("admin.randomizer")
  const [activeTab, setActiveTab] = useState<(typeof RANDOMIZER_TABS)[number]["value"]>("traits")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [limitPokemon, setLimitPokemon] = useState(false)

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
    toast({ tone: "ok", title: "Saved", msg: "Settings saved (no-op in shell phase)" })
  }, [isValid, t])

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
        <GeneralOptionsPanel limitPokemon={limitPokemon} />

        {/* Settings Tabs */}
        <AvPanel className="mb-5">
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value as any)}
            tabs={RANDOMIZER_TABS.map((tab) => ({ value: tab.value, label: tab.label }))}
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
              disabled={!isDirty || !isValid}
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
      </div>
    </FormProvider>
  )
}
