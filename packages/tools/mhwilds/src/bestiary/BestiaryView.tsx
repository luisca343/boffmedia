"use client"

import * as React from "react"
import { useToolT } from "../i18n"
import { cn } from "@boffmedia/ui/cn"
import { Icon, Empty, Spinner } from "@boffmedia/ui"
import { MhApp, MhBar, MhBody, MhSeal, MhSearch, MhPanel, MhLabel, MhTypeChip } from "../ui/mh-kit"
import { elementColor } from "../ui/mh-helpers"
import type { MhMonster } from "../types"
import { useMonsters } from "./useMonsters"
import {
  MonsterCard,
  MonsterRow,
  WeakCell,
  VulnRow,
  Tag2,
  chanceTone,
  vulnColor,
  vulnLabel,
} from "./bst-kit"

type View = "grid" | "list"
type Sort = "name" | "health"

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

function ailmentLabel(a: unknown): string | null {
  if (!a || typeof a !== "object") return null
  const o = a as Record<string, any>
  return o.name ?? o.ailment?.name ?? null
}

export function BestiaryView() {
  const t = useToolT("tools.mhwilds.bestiary")
  const { monsters, loading, error } = useMonsters()

  const [q, setQ] = React.useState("")
  const [view, setView] = React.useState<View>("grid")
  const [sort, setSort] = React.useState<Sort>("name")
  const [species, setSpecies] = React.useState<string | null>(null)
  const [element, setElement] = React.useState<string | null>(null)
  const [kind, setKind] = React.useState<string | null>(null)
  const [selId, setSelId] = React.useState<number | null>(null)
  const detailRef = React.useRef<HTMLDivElement>(null)

  // facets
  const speciesList = React.useMemo(() => {
    const m = new Map<string, number>()
    monsters.forEach((x) => m.set(x.species, (m.get(x.species) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [monsters])

  const elementList = React.useMemo(() => {
    const s = new Set<string>()
    monsters.forEach((x) => x.weaknesses.forEach((w) => w.kind === "element" && w.element && s.add(w.element)))
    return [...s].sort()
  }, [monsters])

  const filtered = React.useMemo(() => {
    const nq = q.trim().toLowerCase()
    let out = monsters.filter((m) => {
      if (nq && !m.name.toLowerCase().includes(nq) && !m.species.toLowerCase().includes(nq)) return false
      if (species && m.species !== species) return false
      if (kind && m.kind !== kind) return false
      if (element && !m.weaknesses.some((w) => w.kind === "element" && w.element === element && (w.level ?? 0) >= 2)) return false
      return true
    })
    out = [...out].sort((a, b) =>
      sort === "health" ? (b.baseHealth ?? 0) - (a.baseHealth ?? 0) : a.name.localeCompare(b.name),
    )
    return out
  }, [monsters, q, species, element, kind, sort])

  // keep a valid selection
  React.useEffect(() => {
    if (!filtered.length) return
    if (selId == null || !filtered.some((m) => m.id === selId)) setSelId(filtered[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  const selected: MhMonster | undefined = monsters.find((m) => m.id === selId)

  const pick = (m: MhMonster) => {
    setSelId(m.id)
    if (window.matchMedia("(max-width: 1023px)").matches)
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40)
  }

  return (
    <MhApp>
      <MhBar>
        <MhSeal name="paw" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] leading-none uppercase tracking-[0.14em] text-[var(--mh-bright)]">{t("kicker")}</div>
          <h1 className="font-display text-[22px] font-extrabold italic leading-none uppercase mt-1">{t("title")}</h1>
        </div>
        {!loading && !error && (
          <span className="ml-auto font-mono text-[11px] leading-none uppercase tracking-[0.1em] text-txt-dim">
            {t("count", { count: monsters.length })}
          </span>
        )}
      </MhBar>

      <MhBody>
        {loading ? (
          <div className="grid place-items-center py-24"><Spinner size={30} className="text-[var(--mh)]" /></div>
        ) : error ? (
          <div className="py-16"><Empty icon="alert" title={t("errorTitle")} lead={error} /></div>
        ) : (
          // Master/detail: the roster is a sticky, self-scrolling column and the
          // detail rides the page scroll — MhApp no longer bounds their height.
          <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
            {/* ── roster ── */}
            {/* `--tool-vh` is the height of the box the host gives a tool. A
                self-scrolling column is the one case a document-layout tool
                cannot express without it: its height must match the SCROLLPORT,
                and only the host knows how tall that is. Falls back to the full
                viewport, which is right for a host that is the whole window. */}
            <div className="flex flex-col min-h-0 lg:sticky lg:top-[calc(var(--tool-sticky-top,0px)_+_58px)] lg:h-[calc(var(--tool-vh,100dvh)_-_58px)] lg:border-r border-solid border-line bg-base-2">
              <div className="flex flex-col gap-2.5 p-[12px_13px] border-b border-solid border-line">
                <div className="flex gap-2 items-center">
                  <MhSearch value={q} onChange={setQ} placeholder={t("searchPlaceholder")} />
                  <div className="flex border border-solid border-line bg-panel">
                    {(["grid", "list"] as View[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        aria-label={v}
                        className={cn("w-[34px] h-[30px] grid place-items-center transition-colors", view === v ? "bg-[var(--mh-soft)] text-[var(--mh-bright)]" : "text-txt-dim hover:text-txt")}
                      >
                        <Icon name={v === "grid" ? "grid" : "list"} size={15} />
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="appearance-none bg-panel border border-solid border-line text-txt cursor-pointer font-mono text-[12px] p-[8px_10px] focus:outline-none focus:border-[var(--mh)]"
                >
                  <option value="name">{t("sortName")}</option>
                  <option value="health">{t("sortHealth")}</option>
                </select>

                {/* kind + species + element filters */}
                <div className="flex flex-col gap-1.5">
                  <MhLabel className="mb-0">{t("filterKind")}</MhLabel>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { v: null, label: t("all") },
                      { v: "large", label: t("kindLarge") },
                      { v: "small", label: t("kindSmall") },
                    ].map((o) => (
                      <MhTypeChip key={String(o.v)} label={o.label} on={kind === o.v} onClick={() => setKind(o.v)} />
                    ))}
                  </div>
                </div>

                {elementList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <MhLabel className="mb-0">{t("filterWeakness")}</MhLabel>
                    <div className="flex flex-wrap gap-1">
                      <MhTypeChip label={t("all")} on={element === null} onClick={() => setElement(null)} />
                      {elementList.map((el) => (
                        <button
                          key={el}
                          onClick={() => setElement(element === el ? null : el)}
                          className={cn(
                            "inline-flex items-center gap-1.5 p-[5px_8px] bg-panel border border-solid font-mono text-[11px] leading-none capitalize transition-colors",
                            element === el ? "text-txt border-line-2" : "text-txt-muted border-line hover:text-txt",
                          )}
                          style={element === el ? { borderColor: elementColor(el), background: `color-mix(in srgb, ${elementColor(el)} 14%, transparent)` } : undefined}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: elementColor(el) }} />
                          {el}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-[12px_13px_40px] bm-scroll">
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim mb-2.5">
                  {t("results", { count: filtered.length })}
                </div>
                {filtered.length === 0 ? (
                  <p className="font-mono text-[12px] text-txt-dim py-6 text-center">{t("noResults")}</p>
                ) : view === "grid" ? (
                  <div className="grid grid-cols-2 gap-[9px]">
                    {filtered.map((m) => <MonsterCard key={m.id} m={m} active={m.id === selId} onClick={() => pick(m)} />)}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {filtered.map((m) => <MonsterRow key={m.id} m={m} active={m.id === selId} onClick={() => pick(m)} />)}
                  </div>
                )}
              </div>
            </div>

            {/* ── detail ── */}
            <div ref={detailRef} className="min-w-0">
              {selected ? <MonsterDetail m={selected} /> : null}
            </div>
          </div>
        )}
      </MhBody>
    </MhApp>
  )
}

function MonsterDetail({ m }: { m: MhMonster }) {
  const t = useToolT("tools.mhwilds.bestiary")
  const elemWeak = m.weaknesses.filter((w) => w.kind === "element")
  const bestLvl = Math.max(0, ...elemWeak.map((w) => w.level ?? 0))
  const statusVuln = m.weaknesses.filter((w) => w.kind === "status" || w.kind === "effect")
  const ailments = (m.ailments ?? []).map(ailmentLabel).filter(Boolean) as string[]
  const drops = m.rewards.flatMap((r) =>
    (r.conditions ?? []).map((c) => ({
      key: `${r.id}-${c.id}`,
      name: r.item?.name ?? "—",
      rarity: r.item?.rarity ?? 1,
      kind: c.kind,
      rank: c.rank,
      chance: c.chance ?? 0,
      qty: c.quantity ?? 1,
    })),
  )

  return (
    <div className="p-[clamp(16px,2.4vw,30px)] flex flex-col gap-4 max-w-[1000px]">
      {/* header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-display text-[clamp(26px,4vw,38px)] font-extrabold italic leading-[0.95] uppercase">{m.name}</h2>
            <Tag2 dot={`hsl(${(m.species.length * 47) % 360} 45% 60%)`}>{cap(m.species)}</Tag2>
            <Tag2>{m.kind === "large" ? t("kindLarge") : t("kindSmall")}</Tag2>
          </div>
          {m.description && <p className="mt-3 text-txt-muted text-[14.5px] leading-[1.55] max-w-[70ch] text-pretty">{m.description}</p>}
        </div>
      </div>

      {/* overview stats */}
      <MhPanel title={t("overview")} icon="target">
        <div className="flex flex-col">
          {m.baseHealth != null && <StatRow k={t("baseHealth")} v={m.baseHealth.toLocaleString()} />}
          {m.size?.base != null && <StatRow k={t("baseSize")} v={`${m.size.base.toFixed(0)}`} />}
          {m.size?.silver != null && <StatRow k={t("crownSilver")} v={`≥ ${m.size.silver.toFixed(0)}`} />}
          {m.size?.gold != null && <StatRow k={t("crownGold")} v={`≥ ${m.size.gold.toFixed(0)}`} />}
          {m.elements && m.elements.length > 0 && (
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 py-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-txt-dim">{t("elements")}</span>
              <span className="flex flex-wrap gap-1.5 justify-end">
                {m.elements.map((el) => <Tag2 key={el} dot={elementColor(el)}>{cap(el)}</Tag2>)}
              </span>
            </div>
          )}
        </div>
      </MhPanel>

      {/* weaknesses */}
      {elemWeak.length > 0 && (
        <MhPanel title={t("weaknesses")} icon="flame">
          <div className="grid gap-[7px] [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            {elemWeak.sort((a, b) => (b.level ?? 0) - (a.level ?? 0)).map((w) => (
              <WeakCell key={w.id} w={w} best={bestLvl > 0 && (w.level ?? 0) === bestLvl} />
            ))}
          </div>
        </MhPanel>
      )}

      {/* status / effect vulns */}
      {statusVuln.length > 0 && (
        <MhPanel title={t("statusVulns")} icon="zap">
          <div className="flex flex-col gap-[5px]">
            {statusVuln.sort((a, b) => (b.level ?? 0) - (a.level ?? 0)).map((w) => <VulnRow key={w.id} w={w} />)}
          </div>
        </MhPanel>
      )}

      {/* resistances */}
      {m.resistances.length > 0 && (
        <MhPanel title={t("resistances")} icon="shield">
          <div className="flex flex-wrap gap-1.5">
            {m.resistances.map((r) => <Tag2 key={r.id} dot={vulnColor(r)}>{cap(vulnLabel(r))}</Tag2>)}
          </div>
        </MhPanel>
      )}

      {/* ailments inflicted */}
      {ailments.length > 0 && (
        <MhPanel title={t("ailments")} icon="alert">
          <div className="flex flex-wrap gap-1.5">
            {ailments.map((a) => <Tag2 key={a}>{cap(a)}</Tag2>)}
          </div>
        </MhPanel>
      )}

      {/* locations */}
      <MhPanel title={t("locations")} icon="map">
        {m.locations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {m.locations.map((l) => <Tag2 key={l.id} good>{l.name}</Tag2>)}
          </div>
        ) : (
          <BstNone>{t("noLocations")}</BstNone>
        )}
      </MhPanel>

      {/* drops */}
      <MhPanel title={t("drops")} icon="gift" count={drops.length || undefined}>
        {drops.length > 0 ? (
          <div className="flex flex-col gap-[5px]">
            {drops.map((d) => {
              const tone = chanceTone(d.chance)
              return (
                <div key={d.key} className="grid grid-cols-[minmax(0,1.5fr)_auto_auto_minmax(84px,0.8fr)] items-center gap-3 p-[8px_11px] bg-base-2 border border-solid border-line">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-[11px] h-[11px] rotate-45 border border-solid" style={{ borderColor: `var(--rar${Math.min(8, d.rarity)})`, background: `var(--rar${Math.min(8, d.rarity)})` }} />
                    <span className="font-body text-[13px] font-semibold truncate">{d.name}</span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-txt-muted whitespace-nowrap">{d.rank ? `${d.rank} · ` : ""}{d.kind}</span>
                  <span className="font-mono text-[12px] font-bold text-txt">×{d.qty}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex-1 h-[7px] bg-base-deep border border-solid border-line overflow-hidden">
                      <span className="block h-full" style={{ width: `${d.chance}%`, background: tone.color }} />
                    </span>
                    <span className="font-mono text-[11px] font-bold min-w-[30px] text-right" style={{ color: tone.color }}>{d.chance}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <BstNone>{t("noDrops")}</BstNone>
        )}
      </MhPanel>
    </div>
  )
}

function BstNone({ children }: { children: React.ReactNode }) {
  return <p className="m-0 py-1 font-mono text-[11.5px] leading-[1.5] text-txt-dim">{children}</p>
}

function StatRow({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 py-2 border-b border-dashed border-line last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-txt-dim">{k}</span>
      <span className="font-body text-[13px] font-semibold text-txt text-right">{v}</span>
    </div>
  )
}
