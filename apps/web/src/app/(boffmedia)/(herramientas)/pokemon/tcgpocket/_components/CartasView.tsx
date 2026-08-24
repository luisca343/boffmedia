"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Select, SearchInput, Seg, Toggle, Empty, ToolBar, ToolBarSpacer, ToolHeader } from "@boffmedia/ui"
import type { TcgCard } from "@boffmedia/shared"
import type { TcgpData } from "../_lib/useTcgpCards"
import { normType, rarityMeta, typeColor, cssVars, TYPE_ORDER } from "../_lib/tcgp-maps"
import { TcgCardGrid, TcgSetProgress, TcgTypePip, type Density } from "./tcgp-kit"

const PAGE = 60

interface Props {
  data: TcgpData
  effective: (id: string) => number
  initialQ?: string
  onOpenCard: (card: TcgCard, list: TcgCard[]) => void
}

export function CartasView({ data, effective, initialQ, onOpenCard }: Props) {
  const t = useTranslations("tcgpocket")
  const tl = (key: string, fallback: string) => (t.has(key as never) ? t(key as never) : fallback)
  const [q, setQ] = useState(initialQ || "")
  const [setF, setSetF] = useState("")
  const [catF, setCatF] = useState("")
  const [types, setTypes] = useState<string[]>([])
  const [sort, setSort] = useState("num")
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [density, setDensity] = useState<Density>("comoda")
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => { setLimit(PAGE) }, [q, setF, catF, types, sort, ownedOnly])

  const setIndex = useMemo(() => new Map(data.sets.map((s, i) => [s.id, i])), [data.sets])
  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const c of data.cards) if (c.category) seen.add(c.category)
    return Array.from(seen)
  }, [data.cards])
  const presentTypes = useMemo(() => {
    const seen = new Set<string>()
    for (const c of data.cards) for (const ty of c.types || []) seen.add(normType(ty))
    return TYPE_ORDER.filter((ty) => seen.has(ty))
  }, [data.cards])

  const toggleType = (ty: string) => setTypes((v) => (v.includes(ty) ? v.filter((x) => x !== ty) : v.concat(ty)))

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = data.cards.filter((c) =>
      (!term || c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term)) &&
      (!setF || c.setId === setF) &&
      (!catF || c.category === catF) &&
      (!types.length || (c.types || []).some((ty) => types.includes(normType(ty)))) &&
      (!ownedOnly || effective(c.id) > 0))
    return list.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "hp") return (b.hp || 0) - (a.hp || 0)
      if (sort === "rarity") return rarityMeta(b.rarity).order - rarityMeta(a.rarity).order
      if (a.setId !== b.setId) return (setIndex.get(a.setId) ?? 0) - (setIndex.get(b.setId) ?? 0)
      return (parseInt(a.localId) || 0) - (parseInt(b.localId) || 0)
    })
  }, [data.cards, q, setF, catF, types, sort, ownedOnly, effective, setIndex])

  const shown = filtered.slice(0, limit)
  const grouped = sort === "num" && !setF
  const bySet = useMemo(() => {
    if (!grouped) return null
    const m = new Map<string, TcgCard[]>()
    for (const c of shown) { if (!m.has(c.setId)) m.set(c.setId, []); m.get(c.setId)!.push(c) }
    return Array.from(m.entries())
  }, [shown, grouped])

  const clear = () => { setQ(""); setSetF(""); setCatF(""); setTypes([]); setOwnedOnly(false) }

  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      <ToolHeader
        eyebrow={t("app.tabs.cartas")}
        title={t("app.cartas.title")}
        sub={t("app.cartas.lead", { cards: data.cards.length, sets: data.sets.length })}
      />

      <ToolBar
        filters={
          presentTypes.length > 0 &&
            presentTypes.map((ty) => {
              const on = types.includes(ty)
              return (
                <button key={ty} type="button" onClick={() => toggleType(ty)}
                  className="cut cut-edge-slant [--cut:5px] inline-flex items-center gap-[6px] border border-solid px-[10px] py-[6px] font-mono text-[11px] uppercase tracking-[0.04em] transition-colors"
                  style={cssVars({
                    color: on ? "var(--text)" : "var(--muted)",
                    borderColor: on ? `color-mix(in srgb, ${typeColor(ty)} 65%, transparent)` : "var(--line-2)",
                    // The slants are painted geometry — they need the colour by name.
                    "--cut-line": on ? `color-mix(in srgb, ${typeColor(ty)} 65%, transparent)` : "var(--line-2)",
                    background: on ? `color-mix(in srgb, ${typeColor(ty)} 15%, transparent)` : "transparent",
                  })}>
                  <TcgTypePip type={ty} size={16} />{tl(`types.${ty}`, ty)}
                </button>
              )
            })
        }
        note={t("app.showing", { shown: Math.min(limit, filtered.length), total: filtered.length })}
      >
        <SearchInput value={q} onChange={setQ} placeholder={t("app.searchCards")} className="min-w-[200px] flex-1" />
        <Select value={setF} onChange={setSetF} ariaLabel={t("app.filters.expansion")} className="w-auto min-w-[200px]"
          options={[{ value: "", label: t("app.filters.allSets") }].concat(data.sets.map((s) => ({ value: s.id, label: `${s.id} · ${s.name}` })))} />
        {categories.length > 1 && (
          <Select value={catF} onChange={setCatF} ariaLabel={t("app.filters.category")} className="w-auto min-w-[160px]"
            options={[{ value: "", label: t("app.filters.allCategories") }].concat(categories.map((c) => ({ value: c, label: tl(`app.category.${c.toLowerCase()}`, c) })))} />
        )}
        <Select value={sort} onChange={setSort} ariaLabel={t("app.sort.label")} className="w-auto min-w-[180px]"
          options={["num", "name", "rarity", "hp"].map((s) => ({ value: s, label: `${t("app.sort.label")}: ${t(`app.sort.${s}`)}` }))} />
        <ToolBarSpacer />
        <label className="inline-flex cursor-pointer items-center gap-2">
          <Toggle on={ownedOnly} onChange={setOwnedOnly} />
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-txt-muted">{t("app.ownedOnly")}</span>
        </label>
        <Seg value={density} onChange={(v) => setDensity(v as Density)}
          options={[{ value: "compacta", label: "S" }, { value: "comoda", label: "M" }, { value: "espaciosa", label: "L" }]} />
      </ToolBar>

      {filtered.length === 0 ? (
        <Empty icon="search" title={t("app.empty.title")} lead={t("app.empty.lead")}>
          <Button size="sm" variant="pri" onClick={clear}>{t("app.clearFilters")}</Button>
        </Empty>
      ) : grouped && bySet ? (
        bySet.map(([sid, cards]) => {
          // `sid` comes off the cards (`c.setId`), while `data.sets` is keyed by the
          // grouped endpoint's `setId` — the two can disagree (promos, a group that
          // came back without a setId). Fall back to this group's own cards instead
          // of asserting the set exists — a `!` here crashes the whole view.
          const s = data.sets.find((x) => x.id === sid)
          const pool = s?.cards ?? cards
          const have = pool.filter((c) => effective(c.id) > 0).length
          return (
            <section key={sid} className="mb-[26px]">
              <div className="mb-3"><TcgSetProgress label={s?.name ?? sid} sub={sid} have={have} total={pool.length} /></div>
              <TcgCardGrid cards={cards} effective={effective} allColored density={density} onOpen={(c) => onOpenCard(c, filtered)} />
            </section>
          )
        })
      ) : (
        <TcgCardGrid cards={shown} effective={effective} allColored density={density} onOpen={(c) => onOpenCard(c, filtered)} />
      )}

      {limit < filtered.length && (
        <div className="mt-6 text-center">
          <Button variant="pri" icon="chevronDown" onClick={() => setLimit((l) => l + PAGE)}>{t("app.loadMore", { n: filtered.length - limit })}</Button>
        </div>
      )}
    </div>
  )
}
