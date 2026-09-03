"use client"

import React from "react"
import { useToolT, useLocale, MEWGENICS_NS } from "../i18n"
import { Icon, ToolStrip } from "@boffmedia/ui"
import { saveFile } from "@boffmedia/tool-kit"
import type { IconName } from "@boffmedia/ui"
import { loadCatPartsFrames, mewStoryCatAppearance } from "../cat"
import { mewTextureSrc } from "../mew-art"
import { MewScreenLink, useMewNav } from "../nav"
import { useMewData, select } from "../mew-store"
import {
  GENETIC_PALETTES,
  INITIAL_STATE,
  deserializeState,
  randomParts,
  serializeState,
  withSlot,
  type BuilderState,
  type DrawerTarget,
  type EquipSlot,
  type PartSlot,
} from "./builder-state"
import { BuilderStage } from "./BuilderStage"
import { BuilderPaletteRail } from "./BuilderPaletteRail"
import { BuilderSlotRail } from "./BuilderSlotRail"
import { BuilderDrawer, DRAWER_MAX, DRAWER_MIN } from "./BuilderDrawer"
import { useEquipItems, useStoryCats } from "./useBuilderItems"

// ---- store -----------------------------------------------------------------

interface Store {
  present: BuilderState
  past: BuilderState[]
  /** The story cat currently loaded, cleared by any hand edit. */
  preset: string | null
}

type Action =
  | { type: "patch"; fn: (s: BuilderState) => BuilderState; preset?: string | null }
  | { type: "hydrate"; next: BuilderState }
  | { type: "undo" }
  | { type: "reset" }

const HISTORY_CAP = 40

// A reducer rather than setState callbacks because undo needs the previous
// state and the previous state only — pushing history from inside a setState
// updater double-pushes under StrictMode, which made one undo click undo
// nothing.
function reduce(store: Store, action: Action): Store {
  switch (action.type) {
    case "patch": {
      const next = action.fn(store.present)
      if (next === store.present) return store
      return {
        present: next,
        past: [...store.past, store.present].slice(-HISTORY_CAP),
        preset: action.preset === undefined ? null : action.preset,
      }
    }
    case "hydrate":
      return { present: action.next, past: [], preset: null }
    case "undo": {
      const prev = store.past[store.past.length - 1]
      if (!prev) return store
      return { present: prev, past: store.past.slice(0, -1), preset: null }
    }
    case "reset":
      if (store.present === INITIAL_STATE) return store
      return {
        present: INITIAL_STATE,
        past: [...store.past, store.present].slice(-HISTORY_CAP),
        preset: null,
      }
    default:
      return store
  }
}

// ---- component -------------------------------------------------------------

/**
 * Mewgenics Cat Builder — stage first.
 *
 * The cat owns the middle of the screen and is sized to the room it has; colour
 * sits on its left, the slots it is made of on its right, and the picker opens
 * as a drawer along the bottom. The previous shape (a 400px cat marooned in a
 * flex-1 box beside one 320px rail that had to hold parts, palette, presets and
 * equipment behind tabs) was the source of both complaints: dead space in the
 * middle, and everything you actually browse crammed into a column.
 */
export function MewCatBuilder() {
  const t = useToolT(MEWGENICS_NS)
  const locale = useLocale()
  const nav = useMewNav()
  const { ready } = useMewData(locale as "es" | "en")
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const [store, dispatch] = React.useReducer(reduce, {
    present: INITIAL_STATE,
    past: [],
    preset: null,
  })
  const state = store.present

  const [drawer, setDrawer] = React.useState<DrawerTarget | null>(null)
  const [drawerH, setDrawerH] = React.useState(380)
  const [isExporting, setIsExporting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [framesByClip, setFramesByClip] = React.useState<Record<string, number[]>>({})

  const equipItems = useEquipItems(ready)
  const storyCats = useStoryCats(ready)

  // Load the address on mount. It is the whole build — this tool has no other
  // persistence — and it arrives from `MewNav`: the real hash on the web, the
  // in-memory address in the launcher, which is what makes a codex→builder
  // hand-off carry the cat across in a host with no URL.
  React.useEffect(() => {
    if (!nav.hash) return
    const decoded = deserializeState(nav.hash)
    if (decoded) dispatch({ type: "hydrate", next: decoded })
    // Only on mount: re-hydrating on every address change would fight the
    // mirror below, which writes that same address on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror the state into the address. Not done inside the reducer: the reducer
  // must stay pure, and this also covers undo and reset for free.
  //
  // `replace`, not `push`: the old code assigned `window.location.hash`, which
  // leaves a history entry PER EDIT — thirty tweaks to a cat meant thirty
  // presses of the browser's back button to leave the page. Each edit now
  // overwrites the address instead, which is what the tool always meant.
  const hydrated = React.useRef(false)
  React.useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    nav.replace(serializeState(state))
  }, [state])

  // The frames the exporter actually shipped, so randomize cannot land on a gap.
  React.useEffect(() => {
    let alive = true
    loadCatPartsFrames()
      .then((index) => {
        if (alive) setFramesByClip(index.clips)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Start the drawer at a sensible share of the viewport instead of a constant.
  React.useEffect(() => {
    setDrawerH(Math.round(Math.max(DRAWER_MIN, Math.min(DRAWER_MAX, window.innerHeight * 0.42))))
  }, [])

  const handlePartChange = React.useCallback((slot: PartSlot, frame: number) => {
    dispatch({ type: "patch", fn: (s) => ({ ...s, parts: withSlot(s.parts, slot, frame) }) })
  }, [])

  const handlePaletteChange = React.useCallback((palette: number) => {
    dispatch({ type: "patch", fn: (s) => ({ ...s, palette }) })
  }, [])

  const handlePoseChange = React.useCallback((poseType: "eyes" | "mouth", value: string) => {
    dispatch({
      type: "patch",
      fn: (s) => ({
        ...s,
        pose: { ...s.pose, [poseType]: value as "open" | "closed" | "normal" | "smile" },
      }),
    })
  }, [])

  const handleEquip = React.useCallback((slot: EquipSlot, frame: number | null) => {
    dispatch({
      type: "patch",
      fn: (s) => {
        const equipment = { ...s.equipment }
        if (frame == null) delete equipment[slot]
        else equipment[slot] = frame
        return { ...s, equipment }
      },
    })
  }, [])

  const handleRandomize = React.useCallback(() => {
    dispatch({
      type: "patch",
      fn: (s) => ({
        ...s,
        parts: randomParts(framesByClip),
        // Only the genetic rows: the story/special palettes past 49 are not
        // colours a cat can actually roll.
        palette: Math.floor(Math.random() * GENETIC_PALETTES),
      }),
    })
  }, [framesByClip])

  const handleLoadPreset = React.useCallback((presetId: string) => {
    const storyCat = select.get("story_cats", presetId)
    if (!storyCat) return
    // Shared with the story-cat fiche (cat/story-cat.ts) so a preset always
    // composites to exactly what the codex entry renders.
    const { parts, palette } = mewStoryCatAppearance(storyCat as Record<string, unknown>)
    dispatch({ type: "patch", fn: (s) => ({ ...s, parts, palette }), preset: presetId })
  }, [])

  // `saveFile`, not an `<a download>`. That element does nothing at all inside
  // the launcher's webview — no dialog, no file, no error — so "export PNG"
  // was a button that quietly did nothing on the desktop. The host hands the
  // blob to a real save dialog here and to the same anchor on the web.
  const handleExport = React.useCallback(() => {
    if (!canvasRef.current) return
    setIsExporting(true)
    canvasRef.current.toBlob((blob) => {
      if (!blob) return setIsExporting(false)
      void saveFile({
        suggestedName: `mewgenics-${Date.now()}.png`,
        data: blob,
        mimeType: "image/png",
        filters: [{ name: "PNG", extensions: ["png"] }],
      })
        .catch(() => {})
        .finally(() => setIsExporting(false))
    })
  }, [])

  const handleCopyLink = React.useCallback(async () => {
    // The hash IS the build, so the address already holds a shareable link — it
    // just never said so. Built against the public site rather than
    // `window.location`, which in the launcher is the shell's own index.html:
    // the link has to open for the person it is pasted to.
    const url = nav.shareUrl("builder", serializeState(state))
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // `window.prompt` is answered with nothing at all by the desktop webview,
      // so a failure says so rather than pretending to offer the url.
      window.prompt(t("builder.copyLink"), url)
    }
  }, [state, t, nav])

  const presetName = React.useMemo(() => {
    if (!store.preset) return null
    const rec = storyCats.find((c) => c.id === store.preset)
    return rec ? String(rec.name || rec.id) : store.preset
  }, [store.preset, storyCats])

  const grainUrl = React.useMemo(() => mewTextureSrc("largegrain"), [])

  const openDrawer = React.useCallback((target: DrawerTarget) => {
    setDrawer((prev) => (sameTarget(prev, target) ? null : target))
  }, [])

  return (
    <div
      className="mew-skin relative flex h-[var(--tool-vh)] min-w-0 flex-col overflow-hidden text-[color:var(--mwp-cream)] [font-family:var(--mwf-hand)] max-xl:h-auto max-xl:overflow-visible"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, var(--mwp-bg-glow) 0%, var(--base-deep,#0b0d11) 55%, var(--mwp-bg-deep) 100%)",
        ...(grainUrl ? ({ "--mwp-grain": `url(${grainUrl})` } as React.CSSProperties) : {}),
      }}
    >
      <div
        style={
          {
            "--tool-bar-bg": "var(--mwp-night-2)",
            "--tool-bar-sub-bg": "var(--mwp-night-2)",
            "--tool-bar-line": "var(--mwp-nline)",
          } as React.CSSProperties
        }
      >
        <ToolStrip sticky={false} style={{ boxShadow: "0 2px 0 var(--mwp-nline)" }}>
          <div className="flex min-w-0 items-center gap-3">
            {/* Through the nav seam: on the web this is a route change, in the
                launcher a screen swap inside the same mounted tool. */}
            <MewScreenLink
              screen="codex"
              title={t("builder.backToCodex")}
              aria-label={t("builder.backToCodex")}
              className="grid h-9 w-9 flex-none place-items-center border-2 border-solid border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)]"
            >
              <Icon name="back" size={16} />
            </MewScreenLink>
            <span className="grid h-[2.375rem] w-[2.375rem] flex-none place-items-center border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:55%_45%_50%_50%/50%_55%_45%_50%] [box-shadow:0_4px_0_var(--mwp-shadow-md)] [transform:rotate(-5deg)]">
              <Icon name="paw" size={20} />
            </span>
            <span className="truncate text-[1.375rem]/[0.95] tracking-[0.02em] text-[color:var(--mwp-cream)] [font-family:var(--mwf-disp)] [text-shadow:2.5px_2.5px_0_var(--mwp-red-deep)]">
              {t("builder.title")}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <BarButton
              icon="back"
              label={t("builder.undo")}
              onClick={() => dispatch({ type: "undo" })}
              disabled={store.past.length === 0}
              compact
            />
            <BarButton
              icon="refresh"
              label={t("builder.reset")}
              onClick={() => dispatch({ type: "reset" })}
              compact
            />
            <BarButton
              icon="sparkles"
              label={t("builder.randomize")}
              onClick={handleRandomize}
              disabled={!Object.keys(framesByClip).length}
            />
            <BarButton
              icon={copied ? "check" : "link"}
              label={copied ? t("builder.copied") : t("builder.copyLink")}
              onClick={handleCopyLink}
            />
            <BarButton
              icon="download"
              label={isExporting ? t("builder.exporting") : t("builder.export")}
              onClick={handleExport}
              disabled={isExporting}
            />
          </div>
        </ToolStrip>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 p-3 xl:flex-row"
        style={{ paddingBottom: drawer ? drawerH + 12 : undefined }}
      >
        <div className="order-2 flex min-h-0 flex-col xl:order-1 xl:w-[6.5rem] xl:flex-none">
          <BuilderPaletteRail
            selected={state.palette}
            onChange={handlePaletteChange}
            onOpenAll={() => openDrawer({ kind: "palette" })}
          />
        </div>

        <div className="order-1 flex min-h-0 flex-1 flex-col xl:order-2 max-xl:h-[58vh] max-xl:min-h-[21.25rem] max-xl:flex-none">
          <BuilderStage
            state={state}
            canvasRef={canvasRef}
            onPoseChange={handlePoseChange}
            busy={!ready}
          />
        </div>

        <div className="order-3 flex min-h-0 flex-col xl:w-[16.75rem] xl:flex-none">
          <BuilderSlotRail
            state={state}
            equipItems={equipItems}
            presetName={presetName}
            open={drawer}
            onOpen={openDrawer}
          />
        </div>
      </div>

      {drawer && (
        <BuilderDrawer
          target={drawer}
          state={state}
          equipItems={equipItems}
          storyCats={storyCats}
          selectedPreset={store.preset}
          height={drawerH}
          onHeightChange={setDrawerH}
          onClose={() => setDrawer(null)}
          onPartChange={handlePartChange}
          onEquip={handleEquip}
          onPaletteChange={handlePaletteChange}
          onLoadPreset={handleLoadPreset}
        />
      )}
    </div>
  )
}

function sameTarget(a: DrawerTarget | null, b: DrawerTarget): boolean {
  if (!a || a.kind !== b.kind) return false
  if (a.kind === "part" || a.kind === "equip") {
    return (a as { slot: string }).slot === (b as { slot: string }).slot
  }
  return true
}

function BarButton({
  icon,
  label,
  onClick,
  disabled,
  compact,
}: {
  icon: IconName
  label: string
  onClick: () => void
  disabled?: boolean
  /** Icon-only below the widest breakpoints — undo/reset survive by their glyph. */
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-[0.4375rem] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3 pb-1.5 pt-[0.5625rem] text-[0.8125rem]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-md)] transition-all hover:-translate-y-px active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-sm)] disabled:opacity-45 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)]"
    >
      <Icon name={icon} size={15} />
      <span className={compact ? "max-[1100px]:hidden" : "max-[760px]:hidden"}>{label}</span>
    </button>
  )
}
