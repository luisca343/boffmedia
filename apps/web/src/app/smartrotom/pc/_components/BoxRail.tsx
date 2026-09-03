"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { useBoxGrid, useMons } from "../_hooks/queries"
import { boxDropAttrs, useDragLayer } from "../_hooks/useDrag"
import { usePcUi } from "../_stores/pcUiStore"
import { boxName, boxTheme } from "../_utils/boxMeta"
import { fillTone, THEME_ACCENT } from "../_utils/boxThemes"
import { POKEMON_PER_BOX, TOTAL_BOXES } from "../_utils/constants"
import { Bar, Button, Icon, Panel } from "./ui"

export interface BoxRailProps {
  /** The page owns the overview modal. */
  onOverview?: () => void
}

/**
 * The 30 boxes down the left edge. Every row is a whole-box drop target, so a drag
 * can be parked in another box without navigating there first.
 *
 * There is no drag-to-reorder: the boxes are the game server's own fixed 0..29 and it
 * has no notion of their order, so a reordering would exist only in this browser.
 */
export function BoxRail({ onOverview }: BoxRailProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const boxes = useBoxGrid(mons)
  const { drag } = useDragLayer()

  const activeBox = usePcUi((s) => s.activeBox)
  const activeView = usePcUi((s) => s.activeView)
  const setActiveBox = usePcUi((s) => s.setActiveBox)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.querySelector('[data-active="1"]')?.scrollIntoView({ block: "nearest" })
  }, [activeBox])

  return (
    <Panel className="flex w-[14.5rem] flex-none flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-pc-line px-[0.8125rem] pb-[0.5625rem] pt-3">
        <div className="flex items-center gap-2">
          <Icon name="boxes" size={16} className="text-pc-accent" />
          <span className="font-pc-display text-[0.8125rem] font-bold tracking-[.04em] text-pc-fg">{t("filters.sortFields.box")}</span>
          <span className="font-pc-mono text-[0.65625rem] text-pc-fg-subtle">{TOTAL_BOXES}</span>
        </div>
        {onOverview && (
          <Button variant="ghost" icon onClick={onOverview} aria-label={t("boxOverview.title")}>
            <Icon name="grid" size={15} />
          </Button>
        )}
      </div>

      <div ref={listRef} className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-[0.5625rem]">
        {boxes.map((contents, i) => {
          const count = contents.filter(Boolean).length
          const accent = THEME_ACCENT[boxTheme(boxMeta, i)]
          const active = i === activeBox && !activeView
          const over = !!drag?.active && drag.over?.append === true && drag.over.box === i

          const tone = over
            ? "border-pc-green bg-pc-green/[.14]"
            : active
              ? "border-pc-line-strong bg-pc-accent/[.13]"
              : "border-transparent bg-transparent hover:bg-white/[.04]"

          return (
            <button
              key={i}
              type="button"
              data-active={active ? "1" : "0"}
              {...boxDropAttrs(i)}
              onClick={() => setActiveBox(i)}
              aria-current={active}
              className={`flex items-center gap-2.5 rounded-[11px] border px-2.5 py-2 text-left transition-[background-color,border-color] duration-150 ${tone}`}
            >
              <span
                className="flex h-[1.875rem] w-[1.875rem] flex-none items-center justify-center rounded-lg font-pc-mono text-[0.6875rem] font-extrabold"
                style={{
                  background: `linear-gradient(160deg, ${accent}33, ${accent}11)`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                }}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[0.78125rem] font-semibold ${active ? "text-pc-fg" : "text-pc-fg-muted"}`}
                >
                  {boxName(boxMeta, i)}
                </span>
                <Bar
                  pct={(count / POKEMON_PER_BOX) * 100}
                  tone={fillTone(count)}
                  height={4}
                  className="mt-[0.3125rem]"
                />
              </span>

              <span className="flex-none font-pc-mono text-[0.65625rem] text-pc-fg-subtle">{count}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
