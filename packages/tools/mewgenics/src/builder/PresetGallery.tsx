"use client"

import React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { MewCat, mewStoryCatAppearance } from "../cat"
import type { MewRec } from "../ui"

const TILE = 104

/**
 * Story cats as portraits, not as a list of ids.
 *
 * Every tile composites the real cat through the same mapping the codex fiche
 * uses, so what you pick is what you get. They render only once scrolled into
 * view: compositing 210 cats up front is ~2500 SVG draws and a per-pixel
 * palette pass each, which locks the tab for seconds.
 */
export function PresetGallery({
  presets,
  selected,
  onPick,
}: {
  presets: MewRec[]
  selected: string | null
  onPick: (id: string) => void
}) {
  const t = useToolT(MEWGENICS_NS)
  const [q, setQ] = React.useState("")

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return presets
    return presets.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(needle) ||
        String(p.id || "").toLowerCase().includes(needle),
    )
  }, [presets, q])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-none items-center gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("builder.searchPresets")}
          className="min-w-0 flex-1 border-2 border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-2 py-1.5 text-[0.6875rem] text-[color:var(--mwp-cream)] [border-radius:var(--wob-sm)] focus:border-[color:var(--mwp-ink)] focus:outline-none"
        />
        <span className="whitespace-nowrap font-mono text-[0.625rem] text-[color:var(--mwp-cream-dim)]">
          {shown.length}/{presets.length}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[0.6875rem] text-[color:var(--mwp-cream-dim)]">
          {t("builder.noResults")}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] p-2 [border-radius:var(--wob-sm)]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.25rem,1fr))] gap-2">
            {shown.map((preset) => (
              <PresetTile
                key={String(preset.id)}
                preset={preset}
                selected={selected === preset.id}
                onPick={() => onPick(String(preset.id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PresetTile({
  preset,
  selected,
  onPick,
}: {
  preset: MewRec
  selected: boolean
  onPick: () => void
}) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [seen, setSeen] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { root: null, rootMargin: "200px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  const look = React.useMemo(
    () => mewStoryCatAppearance(preset as unknown as Record<string, unknown>),
    [preset],
  )

  return (
    <button
      ref={ref}
      type="button"
      onClick={onPick}
      title={String(preset.name || preset.id)}
      className={`flex flex-col items-center gap-1 border-2 border-solid p-1.5 transition-all [border-radius:var(--wob-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] ${
        selected
          ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
          : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-night-2)]"
      }`}
    >
      <span
        className="grid place-items-center overflow-hidden rounded-[6px] bg-[color:var(--mwp-night-2)]"
        style={{ width: "100%", height: TILE }}
      >
        {seen ? (
          <MewCat parts={look.parts} palette={look.palette} size={TILE} tightFit />
        ) : (
          <span className="block h-full w-full" />
        )}
      </span>
      <span className="w-full truncate text-center text-[0.625rem] font-bold text-[color:var(--mwp-cream)]">
        {String(preset.name || preset.id)}
      </span>
    </button>
  )
}
