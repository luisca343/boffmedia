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
  Popover,
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
  type RzLayout,
} from "./_components/RandomizerUiContext"
import { computeWarnings } from "./_components/validation"
import { CategoryRail } from "./_components/CategoryRail"
import { CategoryContent } from "./_components/CategoryContent"
import { SummaryColumn, SummaryDrawer } from "./_components/Summary"
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

const GRID_COLUMNS: Record<RzLayout, string> = {
  rail: "196px minmax(0,1fr) 300px",
  tabs: "minmax(0,1fr) 300px",
  detail: "196px minmax(0,1fr)",
  scroll: "minmax(0,1fr)",
}

/* -------------------------------------------------------------------------- */
/* Toolbar                                                                     */
/* -------------------------------------------------------------------------- */

function ViewMenu() {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  return (
    <Popover
      align="end"
      trigger={
        <Button variant="default" size="sm" icon="grid">
          {t("chrome.view")}
        </Button>
      }
    >
      <div className="w-[248px] bg-panel border border-solid border-line-2 p-2.5 shadow-xl">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-txt-dim mb-1.5">
          {t("chrome.layout")}
        </p>
        <Seg
          className="w-full mb-3 flex-wrap"
          value={ui.layout}
          onChange={(v) => ui.setLayout(v as RzLayout)}
          options={[
            { value: "rail", label: t("chrome.layoutRail") },
            { value: "tabs", label: t("chrome.layoutTabs") },
            { value: "detail", label: t("chrome.layoutDetail") },
            { value: "scroll", label: t("chrome.layoutScroll") },
          ]}
        />
        <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-txt-dim mb-1.5">
          {t("chrome.density")}
        </p>
        <Seg
          className="w-full"
          value={ui.density}
          onChange={(v) => ui.setDensity(v as "comfortable" | "compact")}
          options={[
            { value: "comfortable", label: t("chrome.comfortable") },
            { value: "compact", label: t("chrome.compact") },
          ]}
        />
      </div>
    </Popover>
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
  const isDrawer = ui.layout === "detail" || ui.layout === "scroll"

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-3 p-3.5 border border-solid border-line bg-panel mb-[18px]">
      <div className="min-w-[190px]">
        <Select
          value={selectedGame}
          onChange={onGame}
          options={[{ value: "", label: t("chrome.selectGame") }, ...FVX_GAMES]}
        />
      </div>

      <div id="rz-search-box" className="relative flex-1 min-w-[220px]">
        <SearchInput
          value={ui.query}
          onChange={ui.setQuery}
          placeholder={t("chrome.searchAll")}
        />
      </div>

      <div className="min-w-[180px]">
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
          className="w-[150px] font-mono text-[12px]"
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

      <div className="w-px self-stretch bg-line" />

      <div className="flex gap-2 flex-wrap">
        <Button variant="default" size="sm" icon="sparkles" onClick={onRandomizeAll}>
          {t("chrome.randomizeAll")}
        </Button>
        <ViewMenu />
        {isDrawer && (
          <Button variant="default" size="sm" icon="sliders" onClick={() => ui.setSummaryOpen(true)}>
            {t("chrome.summary")}
          </Button>
        )}
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
/* Floating dock (master-detail / single-scroll)                              */
/* -------------------------------------------------------------------------- */

function Dock({ onRun }: { onRun: () => void }) {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const form = useFormContext<RandomizerSettings>()
  const values = (useWatch({ control: form.control }) as Record<string, unknown>) ?? {}
  const count = totalChanged(values)

  if (ui.layout !== "detail" && ui.layout !== "scroll") return null

  return (
    <div className="fixed right-[22px] bottom-[22px] z-[55] flex gap-2">
      <button
        type="button"
        onClick={() => ui.setSummaryOpen(true)}
        className="inline-flex items-center gap-2 h-[42px] px-4 border border-solid border-accent-line bg-panel text-txt font-display font-bold uppercase tracking-[0.06em] text-[13px] cursor-pointer shadow-lg"
      >
        <Icon name="sliders" size={16} />
        {t("chrome.changes")}
        <span className="grid place-items-center min-w-5 h-[18px] px-1.5 bg-accent text-accent-ink font-mono text-[10px]">
          {count}
        </span>
      </button>
      <button
        type="button"
        onClick={onRun}
        className="inline-flex items-center gap-2 h-[42px] px-4 border border-solid border-accent bg-accent text-accent-ink font-display font-bold uppercase tracking-[0.06em] text-[13px] cursor-pointer shadow-lg"
      >
        <Icon name="play" size={16} />
        {t("chrome.run")}
      </button>
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

      <LayoutGrid onSave={openSave} onRun={openRun} />

      <Dock onRun={openRun} />

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
/* Layout grid                                                                */
/* -------------------------------------------------------------------------- */

function LayoutGrid({ onSave, onRun }: { onSave: () => void; onRun: () => void }) {
  const ui = useRandomizerUi()
  const showRail = ui.layout === "rail" || ui.layout === "detail"
  const showColumn = ui.layout === "rail" || ui.layout === "tabs"
  const isDrawer = ui.layout === "detail" || ui.layout === "scroll"

  return (
    <>
      {ui.layout === "tabs" && (
        <div className="mb-[18px]">
          <CategoryRail variant="tabs" />
        </div>
      )}
      <div className="grid gap-[18px] items-start" style={{ gridTemplateColumns: GRID_COLUMNS[ui.layout] }}>
        {showRail && <CategoryRail variant="rail" />}
        <section className={ui.layout === "scroll" ? "max-w-[880px] w-full mx-auto" : "min-w-0"}>
          <CategoryContent />
        </section>
        {showColumn && <SummaryColumn onSave={onSave} onRun={onRun} />}
      </div>
      {isDrawer && <SummaryDrawer onSave={onSave} onRun={onRun} />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Public entry                                                               */
/* -------------------------------------------------------------------------- */

export function RandomizerEditor({ initialSettings }: { initialSettings?: RandomizerSettings }) {
  const form = useForm<RandomizerSettings>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
