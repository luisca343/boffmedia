"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useBulkMark, useBoxGrid, useMons } from "../_hooks/queries"
import { planBulkMove, useMoveQueue } from "../_hooks/useMoveQueue"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { boxName } from "../_utils/boxMeta"
import { POKEMON_PER_BOX, TOTAL_BOXES } from "../_utils/constants"
import { SUGGESTED_TAGS } from "../_utils/marks"
import { Button, ChipButton, Icon, Input, toast } from "./ui"

/**
 * The bulk bar. Every action here is one the server actually supports: favourite and
 * tag are our own marks table, and "Mover a…" is a *sequence* of real `/pc/move`
 * swaps. There is no release endpoint, so there is no Liberar button.
 */
export function BulkBar() {
  const t = useTranslations("pc")
  const multiMode = usePcUi((s) => s.multiMode)
  const selected = usePcUi((s) => s.selected)
  const clearSelection = usePcUi((s) => s.clearSelection)
  const setMultiMode = usePcUi((s) => s.setMultiMode)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const { mons } = useMons()
  const boxes = useBoxGrid(mons)
  const bulkMark = useBulkMark()
  const { run, progress, isRunning } = useMoveQueue()

  const [menu, setMenu] = useState<"move" | "tag" | null>(null)
  const [tag, setTag] = useState("")

  /** The selection is a set of *positions*; resolve them back to Pokémon. */
  const picked = useMemo<Mon[]>(() => {
    const byLoc = new Map(mons.map((m) => [locId(m.loc), m]))
    return [...selected].map((id) => byLoc.get(id)).filter((m): m is Mon => !!m)
  }, [mons, selected])

  if (!multiMode) return null

  const n = picked.length
  const keys = picked.map((m) => m.key)
  const busy = isRunning || bulkMark.isPending
  const none = n === 0 || busy

  const exit = () => {
    setMenu(null)
    setMultiMode(false)
  }

  const favorite = () => {
    if (busy) return
    bulkMark.mutate({ keys, favorite: true })
    toast(`${n} ${t("filters.statusToggles.favorite")}`, "success")
    setMenu(null)
  }

  const addTag = (tag: string) => {
    const clean = tag.trim()
    if (!clean || busy) return
    bulkMark.mutate({ keys, addTags: [clean] })
    toast(`${t("filters.tag")} «${clean}» ${n}`, "success")
    setTag("")
    setMenu(null)
  }

  const moveTo = async (box: number) => {
    if (busy) return
    setMenu(null)
    const { moves, placed, overflow } = planBulkMove(picked, box, boxes[box])
    if (!moves.length) {
      toast(t("toast.boxFull"), "error")
      return
    }
    const ok = await run(moves, `${t("bulk.moveTo")} ${boxName(boxMeta, box)}`)
    if (!ok) return
    toast(
      overflow > 0
        ? t("toast.movedOverflow", { count: placed, overflow })
        : t("toast.moved", { count: placed }),
      overflow > 0 ? "info" : "success",
    )
    exit()
  }

  return (
    <div className="pc-glass fixed bottom-[1.125rem] left-1/2 z-[75] flex max-w-[94vw] -translate-x-1/2 animate-pc-slide-up items-center gap-2 rounded-2xl border-pc-line-strong p-[0.5625rem] font-pc text-pc-fg shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)] motion-reduce:animate-none">
      <span className="flex items-center gap-2 pl-1.5 pr-2">
        <span className="flex h-[1.625rem] min-w-[1.625rem] items-center justify-center rounded-lg bg-pc-cyan px-1.5 font-pc-mono text-[0.8125rem] font-extrabold text-[#06222a]">
          {n}
        </span>
        <span className="whitespace-nowrap text-[0.78125rem] text-pc-fg-muted">{t("bulk.selected", { count: n })}</span>
      </span>

      <span className="h-6 w-px bg-pc-line" />

      {isRunning && progress ? (
        <span className="px-2 font-pc-mono text-[0.78125rem] text-pc-fg-muted">
          {progress.label} — {progress.done}/{progress.total}
        </span>
      ) : (
        <>
          <Button variant="ghost" icon disabled={none} onClick={favorite} aria-label={t("filters.statusToggles.favorite")} title={t("filters.statusToggles.favorite")}>
            <Icon name="heart" size={16} />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              icon
              disabled={none}
              onClick={() => setMenu(menu === "tag" ? null : "tag")}
              aria-label={t("filters.tag")}
              title={t("filters.tag")}
            >
              <Icon name="tag" size={16} />
            </Button>
            {menu === "tag" && (
              <div className="pc-glass absolute bottom-[2.875rem] left-1/2 w-[13.75rem] -translate-x-1/2 rounded-xl p-2.5 shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)]">
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy) addTag(tag)
                  }}
                  aria-label={t("filters.tag")}
                  placeholder={`${t("filters.tag")}…`}
                  className="mb-2"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map((t) => (
                    <ChipButton key={t} disabled={busy} onClick={() => addTag(t)}>
                      {t}
                    </ChipButton>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Button disabled={none} onClick={() => setMenu(menu === "move" ? null : "move")}>
              <Icon name="boxes" size={15} />
              {t("bulk.moveTo")}…
            </Button>
            {menu === "move" && (
              <div className="pc-glass absolute bottom-[2.875rem] left-0 max-h-[18.75rem] w-[15rem] overflow-auto rounded-xl p-[0.4375rem] shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)]">
                {Array.from({ length: TOTAL_BOXES }, (_, i) => {
                  const filled = boxes[i].filter(Boolean).length
                  const free = POKEMON_PER_BOX - filled
                  return (
                    <Button
                      key={i}
                      variant="ghost"
                      disabled={free === 0 || busy}
                      onClick={() => void moveTo(i)}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-pc-mono text-[0.6875rem] text-pc-fg-subtle">{i + 1}</span>
                        {boxName(boxMeta, i)}
                      </span>
                      <span className="text-[0.65625rem] text-pc-fg-subtle">{free} {t("filters.all")}</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          <span className="h-6 w-px bg-pc-line" />

          <Button
            variant="ghost"
            onClick={() => {
              if (n) {
                clearSelection()
                setMenu(null)
              } else {
                exit()
              }
            }}
          >
            {n ? t("bulk.deselectAll") : t("common.close")}
          </Button>
        </>
      )}
    </div>
  )
}
