"use client"

import { useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives/button"
import { DkSearch, DkSprite, DkEmpty, DkSkelList } from "@/components/boffmedia/ui/tools/datakit"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import { fmtCount, type PokeData, type UsageEntry } from "../_lib/meta-types"

interface MvListProps {
  entries: UsageEntry[]
  pokeMap: Record<string, PokeData>
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  error?: string | null
  className?: string
}

export function MvList({ entries, pokeMap, selectedId, onSelect, loading, error, className }: MvListProps) {
  const t = useTranslations("vgc.meta")
  const [q, setQ] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return entries
    return entries.filter((e) => (pokeMap[e.id]?.name ?? e.id).toLowerCase().includes(term))
  }, [q, entries, pokeMap])

  const peak = entries.length ? entries[0].usage : 1

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const idx = filtered.findIndex((x) => x.id === selectedId)
    const next = filtered[Math.min(filtered.length - 1, Math.max(0, idx + (e.key === "ArrowDown" ? 1 : -1)))]
    if (next) onSelect(next.id)
  }

  return (
    <aside className={cn("flex min-h-0 flex-col bg-base", className)} aria-label={t("aria.usageRanking")}>
      <div className="flex-none border-b border-solid border-line px-3 py-[10px]">
        <DkSearch value={q} onChange={setQ} placeholder={t("sidebar.search")} className="w-full" />
      </div>
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKey}
        role="listbox"
        aria-label={t("aria.usageRanking")}
        className="min-h-0 flex-1 overflow-y-auto p-[6px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-line max-[980px]:overflow-visible"
      >
        {loading ? (
          <div className="p-[10px]">
            <DkSkelList rows={12} h={46} />
          </div>
        ) : error ? (
          <div className="p-3">
            <DkEmpty icon="alert" title={t("table.error")} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-3">
            <DkEmpty icon="search" title={t("sidebar.noResults")} lead={t("empty.noMatch", { q })}>
              <Button size="sm" onClick={() => setQ("")}>{t("empty.clear")}</Button>
            </DkEmpty>
          </div>
        ) : (
          filtered.map((e) => {
            const p = pokeMap[e.id]
            const rank = entries.indexOf(e) + 1
            const on = e.id === selectedId
            return (
              <button
                key={e.id}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => onSelect(e.id)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-[10px] border border-solid border-l-[3px] px-[9px] py-[7px] text-left transition-[background,border-color]",
                  on ? "border-line border-l-accent bg-panel" : "border-transparent border-l-transparent hover:bg-panel",
                )}
              >
                <span className={cn("w-[22px] flex-none text-right font-mono text-[10px] font-bold leading-none", on ? "text-accent-bright" : "text-txt-dim")}>
                  {String(rank).padStart(2, "0")}
                </span>
                <DkSprite src={spriteUrl(p?.name ?? e.id)} alt={p?.name ?? e.id} size={32} onError={handleSpriteError} />
                <span className="grid min-w-0 flex-1">
                  <b className="truncate font-display text-[13px] font-bold uppercase leading-[1.15] tracking-[0.03em]">{p?.name ?? e.id}</b>
                  <i className="truncate font-mono text-[9.5px] not-italic leading-[1.3] text-txt-dim">{t("list.appearances", { count: fmtCount(e.count) })}</i>
                </span>
                <span className="grid w-[58px] flex-none justify-items-end gap-1">
                  <b className="font-mono text-[12px] font-bold leading-none">{e.usage.toFixed(1)}%</b>
                  <i aria-hidden="true" className="block h-[3px] w-full overflow-hidden border border-solid border-line bg-base-2">
                    <u className="block h-full bg-accent no-underline" style={{ width: `${(e.usage / peak) * 100}%` }} />
                  </i>
                </span>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
