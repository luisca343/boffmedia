"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Input, Spinner } from "@boffmedia/ui"
import {
  ANATOMY_SLOT_ANCHORS,
  anatomyCalloutTarget,
} from "@boffmedia/tools-mhwilds/bestiary/anatomy-geometry"
import {
  mhwildsBestiaryAsset,
  mhwildsManifestAsset,
} from "@boffmedia/tools-mhwilds/bestiary/assets"
import type {
  MhWildsAnatomyOverride,
  MhWildsAnatomySlot,
  MhWildsBestiaryData,
  MhWildsMonsterVariant,
} from "@boffmedia/tools-mhwilds/types"
import {
  apiAuthedAutoDELETE,
  apiAuthedAutoGET,
  apiAuthedAutoPATCH,
} from "@/services/boffAPI"
import {
  AvAlert,
  AvMetric,
  AvPanel,
  AvPill,
  AvSectionHead,
} from "../_components/ui/av-kit"

type Point = { x: number; y: number }

type EditorMonster = {
  key: string
  id: string
  name: string
  variant: MhWildsMonsterVariant
  fixedId: number
  version?: string
}

const OVERRIDES_URL = "/tools/mhwilds/anatomy-overrides"
const ADMIN_OVERRIDES_URL = "/tools/mhwilds/admin/anatomy-overrides"

function localizeName(variant: MhWildsMonsterVariant, fallbackId: string): string {
  return variant.identity?.names?.es ?? variant.identity?.names?.en ?? fallbackId.toUpperCase()
}

function editorKey(fixedId: number, variantId: string): string {
  return `${fixedId}:${variantId}`
}

function visibleSlots(variant: MhWildsMonsterVariant): MhWildsAnatomySlot[] {
  return (
    variant.report?.anatomyLayout?.slots.filter(
      (slot) => slot.visible && slot.part?.name,
    ) ?? []
  )
}

function generatedPoints(variant: MhWildsMonsterVariant): Record<string, Point> {
  return Object.fromEntries(
    visibleSlots(variant).flatMap((slot) => {
      const callout = anatomyCalloutTarget(slot)
      const target = callout?.target ?? ANATOMY_SLOT_ANCHORS[slot.key]
      return target ? [[slot.key, target]] : []
    }),
  )
}

function pointsWithOverride(
  variant: MhWildsMonsterVariant,
  override: MhWildsAnatomyOverride | undefined,
): Record<string, Point> {
  const points = generatedPoints(variant)
  for (const callout of override?.callouts ?? []) {
    if (points[callout.slotKey]) points[callout.slotKey] = callout.target
  }
  return points
}

function samePoints(a: Record<string, Point>, b: Record<string, Point>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => {
    const left = a[key]
    const right = b[key]
    return left && right && Math.abs(left.x - right.x) < 0.001 && Math.abs(left.y - right.y) < 0.001
  })
}

async function loadLocalBestiary(): Promise<{
  data: MhWildsBestiaryData
  version?: string
}> {
  const manifestResponse = await fetch(mhwildsManifestAsset(), { cache: "no-store" })
  if (!manifestResponse.ok) throw new Error(`Manifest HTTP ${manifestResponse.status}`)
  const manifest = (await manifestResponse.json()) as { version?: string }
  const dataResponse = await fetch(
    mhwildsBestiaryAsset("bestiary-data.json", manifest.version),
    { cache: "no-store" },
  )
  if (!dataResponse.ok) throw new Error(`Bestiary HTTP ${dataResponse.status}`)
  return {
    data: (await dataResponse.json()) as MhWildsBestiaryData,
    version: manifest.version,
  }
}

function toEditorMonsters(
  data: MhWildsBestiaryData,
  version?: string,
): EditorMonster[] {
  return data.monsters
    .flatMap((monster) => monster.variants.flatMap((variant) => {
      // Small creatures have icons and identity data, but no Hunter's Manual
      // anatomy report. Use the game report itself instead of a hardcoded ID
      // list so future large monsters and DLC are included automatically.
      if (!variant.report?.anatomyLayout) return []
      const fixedId = variant.identity?.fixedId
      if (fixedId == null) return []
      return [{
        key: editorKey(fixedId, variant.id),
        id: monster.id,
        name: localizeName(variant, monster.id),
        variant,
        fixedId,
        ...(version ? { version } : {}),
      }]
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}

function ManualCanvas({
  monster,
  points,
  activeSlot,
  draggingSlot,
  onSelect,
  onStartDrag,
  boardRef,
  t,
}: {
  monster: EditorMonster
  points: Record<string, Point>
  activeSlot: string | null
  draggingSlot: string | null
  onSelect: (slotKey: string) => void
  onStartDrag: (event: React.PointerEvent, slotKey: string) => void
  boardRef: React.RefObject<HTMLDivElement | null>
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const slots = visibleSlots(monster.variant)
  const image = monster.variant.assets?.anatomy?.png

  return (
    <div
      ref={boardRef}
      className="relative isolate aspect-square overflow-hidden border border-solid border-line bg-[#eee2c5]"
      style={{ touchAction: "none" }}
    >
      {image ? (
        <img
          src={mhwildsBestiaryAsset(image, monster.version)}
          alt={t("manualAlt", { name: monster.name })}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-8 text-center">
          <div>
            <Icon name="book" size={30} className="mx-auto mb-3 text-txt-dim" />
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-muted">
              {t("manualMissing")}
            </p>
            <p className="mt-2 text-[0.75rem] leading-[1.5] text-txt-dim">
              {t("manualMissingDetail")}
            </p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-2 border border-[#8d7957]/35" />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {slots.map((slot) => {
          const point = points[slot.key]
          const anchor = anatomyCalloutTarget(slot)?.anchor ?? ANATOMY_SLOT_ANCHORS[slot.key]
          if (!point || !anchor) return null
          const active = activeSlot === slot.key
          return (
            <line
              key={slot.key}
              x1={anchor.x}
              y1={anchor.y}
              x2={point.x}
              y2={point.y}
              stroke={active ? "var(--accent)" : "var(--signal)"}
              strokeWidth={active ? 0.9 : 0.5}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {slots.map((slot, index) => {
        const point = points[slot.key]
        if (!point) return null
        const active = activeSlot === slot.key
        const dragging = draggingSlot === slot.key
        return (
          <button
            key={slot.key}
            type="button"
            aria-label={t("moveMarker", { number: index + 1 })}
            aria-pressed={active}
            onClick={() => onSelect(slot.key)}
            onPointerDown={(event) => onStartDrag(event, slot.key)}
            className={`absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-[0.625rem] font-bold transition-transform ${active || dragging ? "scale-125 border-accent bg-accent text-base-deep shadow-[0_0_0_3px_rgba(8,12,16,0.75),0_0_18px_var(--accent)]" : "border-accent bg-panel/95 text-accent shadow-[0_0_0_2px_rgba(8,12,16,0.7)] hover:scale-110"}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        )
      })}
    </div>
  )
}

export function MhwildsAnatomyAdmin() {
  const t = useTranslations("admin.mhwilds")
  const [monsters, setMonsters] = React.useState<EditorMonster[]>([])
  const [overrides, setOverrides] = React.useState<MhWildsAnatomyOverride[]>([])
  const [selectedKey, setSelectedKey] = React.useState("")
  const [activeSlot, setActiveSlot] = React.useState<string | null>(null)
  const [points, setPoints] = React.useState<Record<string, Point>>({})
  const [initialPoints, setInitialPoints] = React.useState<Record<string, Point>>({})
  const [query, setQuery] = React.useState("")
  const [draggingSlot, setDraggingSlot] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const boardRef = React.useRef<HTMLDivElement>(null)

  const selected = monsters.find((monster) => monster.key === selectedKey)
  const selectedOverride = selected
    ? overrides.find((item) => item.fixedId === selected.fixedId && item.variantId === selected.variant.id)
    : undefined
  const filteredMonsters = monsters.filter((monster) => monster.name.toLowerCase().includes(query.trim().toLowerCase()))
  const slots = selected ? visibleSlots(selected.variant) : []
  const dirty = !samePoints(points, initialPoints)

  const selectMonster = React.useCallback((monster: EditorMonster | undefined, overrideList = overrides) => {
    if (!monster) return
    const next = pointsWithOverride(
      monster.variant,
      overrideList.find((item) => item.fixedId === monster.fixedId && item.variantId === monster.variant.id),
    )
    setSelectedKey(monster.key)
    setPoints(next)
    setInitialPoints(next)
    setActiveSlot(Object.keys(next)[0] ?? null)
    setNotice(null)
  }, [overrides])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [local, overrideResponse] = await Promise.all([
          loadLocalBestiary(),
          apiAuthedAutoGET<MhWildsAnatomyOverride[]>(OVERRIDES_URL),
        ])
        if (cancelled) return
        const nextMonsters = toEditorMonsters(local.data, local.version)
        setMonsters(nextMonsters)
        const nextOverrides = overrideResponse.success && Array.isArray(overrideResponse.data) ? overrideResponse.data : []
        setOverrides(nextOverrides)
        selectMonster(nextMonsters[0], nextOverrides)
        if (!overrideResponse.success) setError(t("loadOverridesError"))
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : t("loadError"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [t])

  React.useEffect(() => {
    if (!draggingSlot) return
    const move = (event: PointerEvent) => {
      const board = boardRef.current
      if (!board) return
      const rect = board.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
      setPoints((current) => ({ ...current, [draggingSlot]: { x, y } }))
    }
    const stop = () => setDraggingSlot(null)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
    }
  }, [draggingSlot])

  const startDrag = (event: React.PointerEvent, slotKey: string) => {
    event.preventDefault()
    setActiveSlot(slotKey)
    setDraggingSlot(slotKey)
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    setNotice(null)
    const response = await apiAuthedAutoPATCH<MhWildsAnatomyOverride>(
      `${ADMIN_OVERRIDES_URL}/${selected.fixedId}/${encodeURIComponent(selected.variant.id)}`,
      {
        fixedId: selected.fixedId,
        variantId: selected.variant.id,
        callouts: slots.flatMap((slot) => points[slot.key] ? [{ slotKey: slot.key, target: points[slot.key] }] : []),
      },
    )
    if (response.success && response.data) {
      setOverrides((current) => [
        ...current.filter((item) => !(item.fixedId === selected.fixedId && item.variantId === selected.variant.id)),
        response.data!,
      ])
      setInitialPoints(points)
      setNotice(t("saved"))
    } else {
      setError(t("saveError"))
    }
    setSaving(false)
  }

  const reset = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    setNotice(null)
    const response = await apiAuthedAutoDELETE<{ deleted: boolean }>(
      `${ADMIN_OVERRIDES_URL}/${selected.fixedId}/${encodeURIComponent(selected.variant.id)}`,
    )
    if (response.success) {
      const generated = generatedPoints(selected.variant)
      setOverrides((current) => current.filter((item) => !(item.fixedId === selected.fixedId && item.variantId === selected.variant.id)))
      setPoints(generated)
      setInitialPoints(generated)
      setNotice(t("reset"))
    } else {
      setError(t("resetError"))
    }
    setSaving(false)
  }

  const updateSelectedCoordinate = (axis: "x" | "y", value: string) => {
    if (!activeSlot) return
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    setPoints((current) => ({
      ...current,
      [activeSlot]: { ...current[activeSlot], [axis]: Math.max(0, Math.min(100, parsed)) },
    }))
  }

  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("description")} />
      {error && <AvAlert tone="error" title={t("errorTitle")} className="mb-4">{error}</AvAlert>}
      {notice && <AvAlert tone="success" title={t("savedTitle")} className="mb-4">{notice}</AvAlert>}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-txt-muted"><Spinner size={18} className="text-accent" />{t("loading")}</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(14rem,18rem)_minmax(26rem,39rem)_minmax(16rem,1fr)]">
          <AvPanel
            title={t("largeMonsters")}
            icon="skull"
            aside={<AvPill tone="accent">{monsters.length}</AvPill>}
            bodyClassName="p-0"
          >
            <div className="border-b border-solid border-line p-3">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} />
            </div>
            <div className="max-h-[42rem] overflow-y-auto bg-base-deep p-2.5 bm-scroll">
              {filteredMonsters.map((monster) => {
                const active = monster.key === selectedKey
                const hasManual = Boolean(monster.variant.assets?.anatomy?.png)
                const icon = monster.variant.assets?.icon?.png
                const hasCorrection = overrides.some((item) => item.fixedId === monster.fixedId && item.variantId === monster.variant.id)
                return (
                  <button
                    key={monster.key}
                    type="button"
                    onClick={() => selectMonster(monster)}
                    className={`group relative mb-2 flex min-h-[4.75rem] w-full items-center gap-3 overflow-hidden border border-solid p-2 text-left transition-[border-color,background,transform] last:mb-0 ${active ? "border-accent bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]" : "border-line bg-panel hover:-translate-y-px hover:border-accent-line hover:bg-panel-2"}`}
                  >
                    <span className={`relative grid h-[3.75rem] w-[3.75rem] shrink-0 place-items-center overflow-hidden border border-solid bg-base-2 ${active ? "border-accent" : "border-line-2"}`}>
                      {icon ? (
                        <img
                          src={mhwildsBestiaryAsset(icon, monster.version)}
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-110"
                        />
                      ) : (
                        <Icon name="skull" size={20} className="text-txt-dim" />
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/45 to-transparent" />
                    </span>
                    <span className="min-w-0 flex-1 py-0.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="block min-w-0 truncate text-[0.78125rem] font-semibold text-txt">{monster.name}</span>
                        {hasCorrection && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" title={t("corrected")} />}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.5625rem] uppercase tracking-[0.05em] text-txt-dim">{monster.id} · {monster.variant.id}</span>
                      <span className={`mt-1 block font-mono text-[0.5625rem] uppercase tracking-[0.06em] ${hasManual ? "text-ok" : "text-warn"}`}>
                        {hasManual ? t("manualReady") : t("manualPending")}
                      </span>
                    </span>
                    <Icon name="arrow" size={14} className="shrink-0 text-txt-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </button>
                )
              })}
            </div>
          </AvPanel>

          <AvPanel
            title={selected ? selected.name : t("chooseMonster")}
            icon="crosshair"
            aside={selected && <AvPill tone={selectedOverride ? "green" : "default"}>{selectedOverride ? t("corrected") : t("generated")}</AvPill>}
          >
            {selected ? (
              <>
                <div className="mb-3 flex justify-end">
                  <span className="font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-dim">{t("dragHint")}</span>
                </div>
                <ManualCanvas
                  monster={selected}
                  points={points}
                  activeSlot={activeSlot}
                  draggingSlot={draggingSlot}
                  onSelect={setActiveSlot}
                  onStartDrag={startDrag}
                  boardRef={boardRef}
                  t={t}
                />
                {!selected.variant.assets?.anatomy?.png && <p className="mt-3 font-mono text-[0.625rem] leading-[1.5] text-warn">{t("noAnatomyForMonster")}</p>}
              </>
            ) : <p className="py-12 text-sm text-txt-muted">{t("chooseMonster")}</p>}
          </AvPanel>

          <AvPanel title={t("markers")} icon="list">
            {selected ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <AvMetric value={slots.length} label={t("visibleParts")} />
                  <AvMetric value={selected.fixedId} label={t("fixedId")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  {slots.map((slot, index) => {
                    const name = slot.part?.name?.es ?? slot.part?.name?.en ?? t("unknownPart")
                    const point = points[slot.key]
                    const active = activeSlot === slot.key
                    return (
                      <button key={slot.key} type="button" onClick={() => setActiveSlot(slot.key)} className={`flex items-center gap-2 border border-solid p-2 text-left ${active ? "border-accent bg-accent-soft" : "border-line bg-base-2 hover:border-accent-line"}`}>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[0.5625rem] ${active ? "border-accent bg-accent text-base-deep" : "border-accent text-accent"}`}>{String(index + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[0.75rem] font-semibold">{name}</span><span className="font-mono text-[0.5625rem] text-txt-dim">{slot.key}</span></span>
                        <span className="font-mono text-[0.59375rem] tabular-nums text-txt-muted">{point ? `${point.x.toFixed(1)}, ${point.y.toFixed(1)}` : "—"}</span>
                      </button>
                    )
                  })}
                </div>
                {activeSlot && points[activeSlot] && (
                  <div className="mt-3 border-t border-solid border-line pt-3">
                    <p className="mb-2 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-txt-dim">{t("selectedMarker")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="font-mono text-[0.59375rem] uppercase text-txt-dim">X<Input type="number" min={0} max={100} step={0.1} value={points[activeSlot].x} onChange={(event) => updateSelectedCoordinate("x", event.target.value)} /></label>
                      <label className="font-mono text-[0.59375rem] uppercase text-txt-dim">Y<Input type="number" min={0} max={100} step={0.1} value={points[activeSlot].y} onChange={(event) => updateSelectedCoordinate("y", event.target.value)} /></label>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-solid border-line pt-3">
                  <Button size="sm" icon="check" onClick={save} loading={saving} disabled={saving || !dirty}>{t("save")}</Button>
                  <Button size="sm" variant="ghost" icon="refresh" onClick={reset} loading={saving} disabled={saving || !selectedOverride}>{t("restore")}</Button>
                </div>
              </>
            ) : <p className="text-sm text-txt-muted">{t("chooseMonster")}</p>}
          </AvPanel>
        </div>
      )}
    </div>
  )
}
