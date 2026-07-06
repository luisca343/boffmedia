"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia-v2/primitives/icon"
import { ToolPanel } from "@/components/boffmedia-v2/primitives/tool-panel"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import { EvSpread } from "./spread"
import { VgcTeamRow } from "./team-row"
import { fmtCount, TYPE_COLORS } from "./meta-data"

interface PokeData {
  id: string
  name: string
  dex: number
  types: string[]
  base: Record<string, number>
  abilities: { name: string; pct: number }[]
  items: { name: string; pct: number }[]
  moves: { name: string; pct: number }[]
  tera: { name: string; pct: number }[]
  mates: { id: string; pct: number }[]
  spreads: { nature: string; ev: number[]; pct: number }[]
}

interface UsageEntry {
  id: string
  usage: number
  count: number
}

interface TeamSlot {
  dex: number
  name: string
  tera: string
  item: string
  moves: string[]
}

interface TeamEntry {
  slug: string
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

interface PokemonDetailProps {
  detail: PokeData
  entry: UsageEntry
  pokeMap: Record<string, PokeData>
  onSelect: (id: string) => void
  onBack?: () => void
  drill?: boolean
  teams?: TeamEntry[]
}

function TypeBadge({ type }: { type: string }) {
  const bg = TYPE_COLORS[type] || "var(--layer-3)"
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.04em] px-2 py-[0.2rem] rounded text-white"
      style={{ background: bg, textShadow: "0 1px 1px rgba(0,0,0,0.25)" }}
    >
      {type}
    </span>
  )
}

function StatPanel({ title, items, max = 8 }: { title: string; items: { name: string; pct: number }[]; max?: number }) {
  return (
    <div className="border border-edge rounded-[var(--radius)] p-3 bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-[0.55rem]">
        {title}
      </p>
      <div className="flex flex-col">
        {items.slice(0, max).map((it, i) => (
          <div key={i} className="flex items-center gap-2 py-[0.3rem] border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)] last:border-b-0">
            <span className="flex-1 min-w-0 text-xs text-ink truncate">{it.name}</span>
            <span className="font-mono text-xs text-ink-muted shrink-0">{it.pct.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeammateRow({ id, pct, pokeMap, onSelect }: { id: string; pct: number; pokeMap: Record<string, PokeData>; onSelect: (id: string) => void }) {
  const p = pokeMap[id]
  if (!p) return null
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="flex items-center gap-2 w-full text-left py-[0.3rem] border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)] last:border-b-0 bg-transparent border-x-0 border-t-0 cursor-pointer hover:bg-[color-mix(in_srgb,var(--layer-3)_55%,transparent)]"
    >
      <img src={spriteUrl(p.name)} alt={p.name} width={30} height={30} className="object-contain shrink-0" onError={handleSpriteError} />
      <span className="flex-1 min-w-0 text-xs truncate text-ink">{p.name}</span>
      <span className="font-mono text-xs text-ink-muted shrink-0">{pct.toFixed(2)}%</span>
    </button>
  )
}

function BaseStatBars({ base }: { base: Record<string, number> }) {
  const STAT_META_LOCAL = {
    hp:  { label: "PS",  color: "#ff5959" },
    atk: { label: "Atq", color: "#f5ac78" },
    def: { label: "Def", color: "#fae078" },
    spa: { label: "AtE", color: "#9db7f5" },
    spd: { label: "DfE", color: "#a7db8d" },
    spe: { label: "Vel", color: "#fa92b2" },
  }
  const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"]
  const maxStat = Math.max(...STAT_ORDER.map((k) => base[k] || 0), 1)
  const total = STAT_ORDER.reduce((a, k) => a + (base[k] || 0), 0)

  return (
    <div className="border border-edge rounded-[var(--radius)] p-3 bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-2">
        Stats base
      </p>
      {STAT_ORDER.map((k) => {
        const v = base[k] || 0
        const meta = STAT_META_LOCAL[k as keyof typeof STAT_META_LOCAL]
        return (
          <div key={k} className="grid grid-cols-[34px_32px_1fr] gap-2 items-center mb-[0.38rem]">
            <span className="font-mono text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
            <span className="font-mono text-xs text-ink-muted text-right">{v}</span>
            <div className="h-[7px] rounded-full bg-[color-mix(in_srgb,var(--layer-3)_80%,transparent)] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(v / maxStat) * 100}%`, background: meta.color }} />
            </div>
          </div>
        )
      })}
      <div className="flex justify-between text-xs mt-[0.45rem] pt-[0.45rem] border-t border-edge">
        <span className="font-mono text-ink-dim">BST</span>
        <span className="font-mono font-bold text-secondary-hover">{total}</span>
      </div>
    </div>
  )
}

function featuringTeams(
  selId: string,
  pokeData: PokeData,
  entries: UsageEntry[],
): TeamEntry[] {
  const teamSlots: TeamSlot[] = entries.slice(0, 6).map((e) => {
    const p = pokeData
    return {
      dex: p.dex,
      name: p.name,
      tera: p.tera[0]?.name || "Nada",
      item: p.items[0]?.name || "",
      moves: p.moves.slice(0, 4).map((m) => m.name),
    }
  })
  return [
    { slug: `${selId}-feat-0`, name: "Top 8 · Día 2", record: "7-2", team: teamSlots, rawText: teamSlots.map((s) => `${s.name} @ ${s.item}\nTera Type: ${s.tera}\n- ${s.moves.join("\n- ")}`).join("\n\n") },
    { slug: `${selId}-feat-1`, name: "Top 16", record: "6-3", team: teamSlots, rawText: "" },
    { slug: `${selId}-feat-2`, name: "Top 32", record: "6-3", team: teamSlots, rawText: "" },
  ]
}

export function VgcPokemonDetail({ detail, entry, pokeMap, onSelect, onBack, drill, teams: externalTeams }: PokemonDetailProps) {
  const tera = detail.tera.filter((t) => t.name !== "Nada")
  const generatedTeams = useMemo(() => featuringTeams(detail.id, detail, [entry]), [detail, entry])
  const teams = externalTeams && externalTeams.length > 0 ? externalTeams : generatedTeams

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-[6] flex items-center gap-3 px-[1.1rem] py-[0.85rem] border-b border-edge bg-[color-mix(in_srgb,var(--layer-1)_92%,transparent)] backdrop-blur-[10px]">
        {drill && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-[0.55rem] py-[0.35rem] mr-1 rounded-[var(--radius)] border border-edge-strong bg-layer-2 text-ink-muted text-xs font-semibold cursor-pointer hover:text-ink hover:border-secondary"
          >
            <Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} />
            Lista
          </button>
        )}
        <img src={spriteUrl(detail.name)} alt={detail.name} width={62} height={62} className="object-contain shrink-0" onError={handleSpriteError} />
        <div className="min-w-0">
          <p className="font-display font-extrabold text-xl leading-tight text-ink">{detail.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
            {detail.types.map((t) => <TypeBadge key={t} type={t} />)}
            <span className="font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-edge text-ink-dim">
              {entry.usage.toFixed(2)}% uso
            </span>
            <span className="font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-edge text-ink-dim">
              {fmtCount(entry.count)} batallas
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(248px,1fr))] gap-3 p-[1rem_1.1rem]">
        <BaseStatBars base={detail.base} />
        <StatPanel title="Movimientos" items={detail.moves.slice(0, 10)} />
        <StatPanel title="Objetos" items={detail.items.slice(0, 8)} />
        <div className="flex flex-col gap-3">
          <StatPanel title="Habilidades" items={detail.abilities.slice(0, 4)} />
          {tera.length > 0 && (
            <div className="border border-edge rounded-[var(--radius)] p-3 bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-[0.55rem]">
                Teratipos
              </p>
              <div className="flex flex-col">
                {tera.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 py-[0.3rem] border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)] last:border-b-0">
                    <TypeBadge type={t.name} />
                    <span className="font-mono text-xs text-ink-muted shrink-0 ml-auto">{t.pct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border border-edge rounded-[var(--radius)] p-3 bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-[0.55rem]">
            Parejas frecuentes
          </p>
          <div className="flex flex-col">
            {detail.mates.map((m) => (
              <TeammateRow key={m.id} id={m.id} pct={m.pct} pokeMap={pokeMap} onSelect={onSelect} />
            ))}
          </div>
        </div>
        <div className="border border-edge rounded-[var(--radius)] p-3 bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-[0.55rem]">
            Repartos de EVs
          </p>
          <div className="flex flex-col">
            {detail.spreads.map((s, i) => (
              <EvSpread key={i} data={s} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-[1.1rem] pb-[1.3rem]">
        <p className="flex items-center gap-[0.45rem] font-mono text-[10px] tracking-[0.16em] uppercase text-ink-dim mb-[0.6rem]">
          <Icon name="users" size={14} />
          Equipos con {detail.name}
        </p>
        <div className="flex flex-col gap-2">
          {teams.map((t) => (
            <VgcTeamRow key={t.slug} entry={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
