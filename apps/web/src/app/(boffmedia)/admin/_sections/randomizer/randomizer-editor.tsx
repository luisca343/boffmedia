"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import {
  Button,
  Icon,
  Input,
  Modal,
  SearchInput,
  Seg,
  Select,
  Spinner,
  toast,
} from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerPreset } from "@/services/api/boffmedia/randomizer.types"
import defaultSettings from "./default-settings"
import { QuickRandomizeModal } from "./QuickRandomizeModal"
import {
  RandomizerUiProvider,
  useRandomizerUi,
  type RzDensity,
} from "./_components/RandomizerUiContext"
import { computeWarnings } from "./_components/validation"
import { CategoryRail } from "./_components/CategoryRail"
import { CategoryContent } from "./_components/CategoryContent"
import { SummaryDrawer } from "./_components/Summary"
import { totalChanged } from "./_components/catalog-view"

/** Supported FVX games (flat list; scope for saved presets). */
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

/** A curated balanced full-random spread, mapped to real RandomizerSettings. */
const RANDOMIZE_ALL: Partial<RandomizerSettings> = {
  startersMod: "COMPLETELY_RANDOM",
  startersNoLegendaries: true,
  speciesTypesMod: "COMPLETELY_RANDOM",
  abilitiesMod: "RANDOMIZE",
  banNegativeAbilities: true,
  evolutionsMod: "RANDOM",
  evosSimilarStrength: true,
  movesetsMod: "RANDOM_PREFER_SAME_TYPE",
  blockBrokenMovesetMoves: true,
  trainersMod: "DISTRIBUTED",
  trainersUsePokemonOfSimilarStrength: true,
  trainersBlockLegendaries: true,
  randomizeWildPokemon: true,
  similarStrengthEncounters: true,
  tmsMod: "RANDOM",
  tmsHmsCompatibilityMod: "RANDOM_PREFER_TYPE",
  moveTutorMovesMod: "RANDOM",
  staticPokemonMod: "SIMILAR_STRENGTH",
  fieldItemsMod: "RANDOM",
}

/* -------------------------------------------------------------------------- */
/* Toolbar                                                                     */
/* -------------------------------------------------------------------------- */

function DensitySeg() {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  return (
    <Seg
      value={ui.density}
      onChange={(v) => ui.setDensity(v as RzDensity)}
      options={[
        {
          value: "compact",
          label: (
            <span title={t("chrome.compact")} className="grid place-items-center">
              <Icon name="menu" size={14} />
            </span>
          ),
        },
        {
          value: "comfortable",
          label: (
            <span title={t("chrome.comfortable")} className="grid place-items-center">
              <Icon name="list" size={14} />
            </span>
          ),
        },
      ]}
    />
  )
}

function Toolbar({
  selectedGame,
  onGame,
  seed,
  onSeed,
  presets,
  onQuickApply,
  onRandomizeAll,
  onSave,
  onRun,
}: {
  selectedGame: string
  onGame: (v: string) => void
  seed: string
  onSeed: (v: string) => void
  presets: RandomizerPreset[]
  onQuickApply: (id: string) => void
  onRandomizeAll: () => void
  onSave: () => void
  onRun: () => void
}) {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const form = useFormContext<RandomizerSettings>()
  const values = (useWatch({ control: form.control }) as Record<string, unknown>) ?? {}
  const count = totalChanged(values)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 p-3.5 border border-solid border-line bg-panel">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[180px]">
          <Select
            value={selectedGame}
            onChange={onGame}
            options={[{ value: "", label: t("chrome.selectGame") }, ...FVX_GAMES]}
          />
        </div>
        <div className="min-w-[170px]">
          <Select
            value=""
            onChange={onQuickApply}
            options={[
              { value: "", label: t("chrome.quickApply") },
              ...presets.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="flex items-stretch">
          <Input
            id="rz-seed"
            className="w-[130px] font-mono text-[12px]"
            placeholder={t("chrome.seedPlaceholder")}
            value={seed}
            onChange={(e) => onSeed(e.currentTarget.value)}
          />
          <Button
            variant="default"
            size="sm"
            icon="dice"
            title={t("chrome.rollSeed")}
            className="border-l-0"
            onClick={() => onSeed(String(Math.floor(Math.random() * 9e9)))}
          />
        </div>
      </div>

      <div id="rz-search-box" className="relative flex-1 min-w-[200px]">
        <SearchInput
          value={ui.query}
          onChange={ui.setQuery}
          placeholder={t("chrome.searchAll")}
        />
      </div>

      <div className="w-px self-stretch bg-line max-md:hidden" />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="sm" icon="sparkles" onClick={onRandomizeAll}>
          {t("chrome.randomizeAll")}
        </Button>
        <DensitySeg />
        <Button variant="default" size="sm" icon="sliders" onClick={() => ui.setSummaryOpen(true)}>
          {t("chrome.summary")}
          {count > 0 && (
            <span className="grid place-items-center min-w-[18px] h-4 px-1 bg-accent text-accent-ink font-mono text-[9.5px] font-bold">
              {count}
            </span>
          )}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          {t("chrome.save")}
        </Button>
        <Button variant="pri" size="sm" icon="play" onClick={onRun}>
          {t("chrome.run")}
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Keyboard shortcuts (inside the provider so it can reach ui)                 */
/* -------------------------------------------------------------------------- */

function KeyboardShortcuts() {
  const ui = useRandomizerUi()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase()
      if (e.key === "/" && tag !== "input" && tag !== "select" && tag !== "textarea") {
        e.preventDefault()
        document.querySelector<HTMLInputElement>("#rz-search-box input")?.focus()
      } else if (e.key === "Escape") {
        if (ui.query) ui.setQuery("")
        else if (ui.summaryOpen) ui.setSummaryOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [ui])
  return null
}

/* -------------------------------------------------------------------------- */
/* Editor shell (inside FormProvider)                                         */
/* -------------------------------------------------------------------------- */

function EditorShell() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const values = (useWatch({ control: form.control }) as Record<string, unknown>) ?? {}
  const warnings = useMemo(() => computeWarnings(values, t), [values, t])

  const [selectedGame, setSelectedGame] = useState("")
  const [seed, setSeed] = useState("")
  const [presets, setPresets] = useState<RandomizerPreset[]>([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [presetDescription, setPresetDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedPreset, setSavedPreset] = useState<RandomizerPreset | null>(null)
  const [runPreset, setRunPreset] = useState<RandomizerPreset | null>(null)

  useEffect(() => {
    RandomizerService.listPresets()
      .then((res) => setPresets(res.success ? res.data ?? [] : []))
      .catch(() => setPresets([]))
  }, [])

  const applyPreset = useCallback(
    async (id: string) => {
      if (!id) return
      const res = await RandomizerService.getPreset(id)
      if (res.success && res.data?.settingsJson) {
        form.reset(res.data.settingsJson as never)
        setSavedPreset(res.data)
        toast({ tone: "ok", title: t("chrome.presetApplied", { name: res.data.name }) })
      } else {
        toast({ tone: "bad", title: t("chrome.errorLoadingPresets") })
      }
    },
    [form, t],
  )

  const randomizeAll = useCallback(() => {
    form.reset({ ...(defaultSettings as RandomizerSettings), ...RANDOMIZE_ALL } as never)
    setSavedPreset(null)
    toast({ tone: "ok", title: t("chrome.randomizeAllDone") })
  }, [form, t])

  const openSave = useCallback(() => setSaveOpen(true), [])

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
        setSaveOpen(false)
        setPresetName("")
        setPresetDescription("")
        if (res.data) {
          setSavedPreset(res.data)
          setPresets((prev) => [res.data as RandomizerPreset, ...prev])
        }
      } else {
        toast({ tone: "bad", title: t("chrome.saveError"), msg: res.userMessage })
      }
    } finally {
      setSaving(false)
    }
  }, [presetName, presetDescription, selectedGame, form, t])

  const openRun = useCallback(() => {
    if (savedPreset) {
      setRunPreset(savedPreset)
    } else {
      toast({ tone: "info", title: t("chrome.saveBeforeRun") })
      setSaveOpen(true)
    }
  }, [savedPreset, t])

  return (
    <RandomizerUiProvider deps={{ warnings }}>
      <KeyboardShortcuts />

      {/* Sticky offsets: the site Navbar (--nav-h) + the AvShell top bar sit
          above this section, so the toolbar + tab bar pin below them as one
          sticky unit. */}
      <div className="[--rz-chrome-top:calc(var(--nav-h)_+_49px)] md:[--rz-chrome-top:calc(var(--nav-h)_+_55px)]">
        <div className="sticky top-[var(--rz-chrome-top)] z-40 mb-[18px]">
          <Toolbar
            selectedGame={selectedGame}
            onGame={setSelectedGame}
            seed={seed}
            onSeed={setSeed}
            presets={presets}
            onQuickApply={applyPreset}
            onRandomizeAll={randomizeAll}
            onSave={openSave}
            onRun={openRun}
          />
          <CategoryRail />
        </div>

        <CategoryContent />
      </div>

      <SummaryDrawer onSave={openSave} onRun={openRun} />

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t("chrome.savePreset")}
        footer={
          <>
            <Button variant="pri" className="flex-1" onClick={confirmSave} disabled={saving}>
              {saving && <Spinner size={16} />}
              {t("chrome.save")}
            </Button>
            <Button variant="ghost" onClick={() => setSaveOpen(false)} disabled={saving}>
              {t("chrome.cancel")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <span className="inline-flex items-center gap-1.5 self-start py-1.5 px-2.5 border border-solid border-accent-line bg-accent-soft text-accent font-mono text-[11px] font-semibold">
            <Icon name="check" size={12} />
            {t("chrome.settingsChanged", { count: totalChanged(values) })}
          </span>
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">
              {t("chrome.presetNameLabel")}
            </span>
            <Input
              placeholder={t("chrome.namePlaceholder")}
              value={presetName}
              onChange={(e) => setPresetName(e.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">
              {t("chrome.presetDescLabel")}
            </span>
            <Input
              placeholder={t("chrome.descriptionPlaceholder")}
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">
              {t("chrome.gameScope")}
            </span>
            <Select
              value={selectedGame}
              onChange={setSelectedGame}
              options={[{ value: "", label: t("chrome.allGames") }, ...FVX_GAMES]}
            />
          </label>
        </div>
      </Modal>

      {runPreset && <QuickRandomizeModal preset={runPreset} initialSeed={seed} onClose={() => setRunPreset(null)} />}
    </RandomizerUiProvider>
  )
}

/* -------------------------------------------------------------------------- */
/* Public entry                                                               */
/* -------------------------------------------------------------------------- */

export function RandomizerEditor({ initialSettings }: { initialSettings?: RandomizerSettings }) {
  const form = useForm<RandomizerSettings>({
    resolver: zodResolver(RandomizerSettings as any) as any,
    defaultValues: (initialSettings ?? defaultSettings) as never,
    mode: "onBlur",
  })

  return (
    <FormProvider {...form}>
      <EditorShell />
    </FormProvider>
  )
}
