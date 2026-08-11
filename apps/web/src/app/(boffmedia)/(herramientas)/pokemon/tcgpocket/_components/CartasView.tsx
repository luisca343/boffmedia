"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Select, Seg, Toggle, Empty, Icon } from "@boffmedia/ui"
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
      <div className="mb-5">
        <h1 className="font-display text-[clamp(26px,4vw,38px)] font-bold uppercase leading-none tracking-[0.01em] text-txt">{t("app.cartas.title")}</h1>
        <p className="mt-[6px] max-w-[60ch] text-[14px] leading-relaxed text-txt-muted">{t("app.cartas.lead", { cards: data.cards.length, sets: data.sets.length })}</p>
      </div>

      {/* toolbar */}
      <div className="cut cut-edge-slant mb-[18px] flex flex-wrap items-center gap-[10px] border border-solid border-line bg-panel p-[12px_14px]">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 border border-solid border-line-2 bg-base px-3 py-2">
          <Icon name="search" size={18} className="text-txt-dim" />
          <input className="w-full bg-transparent font-body text-[14px] text-txt outline-none placeholder:text-txt-dim" placeholder={t("app.searchCards")} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select value={setF} onChange={setSetF} ariaLabel={t("app.filters.expansion")}
          options={[{ value: "", label: t("app.filters.allSets") }].concat(data.sets.map((s) => ({ value: s.id, label: `${s.id} · ${s.name}` })))} />
        {categories.length > 1 && (
          <Select value={catF} onChange={setCatF} ariaLabel={t("app.filters.category")}
            options={[{ value: "", label: t("app.filters.allCategories") }].concat(categories.map((c) => ({ value: c, label: tl(`app.category.${c.toLowerCase()}`, c) })))} />
        )}
        <Select value={sort} onChange={setSort} ariaLabel={t("app.sort.label")}
          options={["num", "name", "rarity", "hp"].map((s) => ({ value: s, label: `${t("app.sort.label")}: ${t(`app.sort.${s}`)}` }))} />
        <span className="flex-1" />
        <label className="inline-flex cursor-pointer items-center gap-2">
          <Toggle on={ownedOnly} onChange={setOwnedOnly} />
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-txt-muted">{t("app.ownedOnly")}</span>
        </label>
        <Seg value={density} onChange={(v) => setDensity(v as Density)}
          options={[{ value: "compacta", label: "S" }, { value: "comoda", label: "M" }, { value: "espaciosa", label: "L" }]} />
      </div>

      {/* type chips */}
      {presentTypes.length > 0 && (
        <div className="mb-[18px] flex flex-wrap gap-[7px]">
          {presentTypes.map((ty) => {
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
          })}
        </div>
      )}

      <div className="mb-[14px] font-mono text-[12px] text-txt-dim">{t("app.showing", { shown: Math.min(limit, filtered.length), total: filtered.length })}</div>

      {filtered.length === 0 ? (
        <Empty icon="search" title={t("app.empty.title")} lead={t("app.empty.lead")}>
          <Button size="sm" variant="pri" onClick={clear}>{t("app.clearFilters")}</Button>
        </Empty>
      ) : grouped && bySet ? (
        bySet.map(([sid, cards]) => {
          // `sid` comes off the cards (`c.setId`), while `data.sets` is keyed by the
          // grouped endpoint's `setId` — the two can disagree (promos, a group that
          // came back without a setId). Fall back to this group's own cards instead
          // of asserting the set exists; the `!` here used to crash the whole view.
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
