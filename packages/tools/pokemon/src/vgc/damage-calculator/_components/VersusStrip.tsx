"use client"

import * as React from "react"
import { useVgcT } from "../../i18n";
import { calcStat, Generations } from "@smogon/calc"
import { cn } from "@boffmedia/ui/cn"
import { RoleTag } from "./ui/RoleTag"
import { MiniCard } from "./ui/MiniCard"
import { KoVerdict } from "./ui/KoVerdict"
import { DamageBar } from "./ui/DamageBar"
import { CopyButton } from "./ui/CopyButton"
import { damageColor, damageTone, cssVars, ATK_COLOR, DEF_COLOR, type DamageTone } from "./ui/theme"
import type { CalcPokemon, CalcField, DamageResult } from "../_types/calculator"
import { calcAllMoves, getKOVerdict } from "../_lib/smogonAdapter"
import { useLegalPokemon } from "../_hooks/useLegalPokemon"
import { useCalculatorStore } from "../_store/calculatorStore"

const GEN9 = Generations.get(9)

const KO_TONE: Record<string, DamageTone> = {
  guaranteedOHKO: "red",
  possibleOHKO: "red",
  guaranteed2HKO: "orange",
  possible2HKO: "amber",
  noKO: "dim",
}

export type Sel = { side: 1 | 2; idx: number } | null

function bestIdx(results: (DamageResult | null)[]): number | null {
  let best: number | null = null
  let bi: number | null = null
  results.forEach((r, i) => {
    if (r && (best === null || r.maxPct > best)) {
      best = r.maxPct
      bi = i
    }
  })
  return bi
}

function MoveList({
  poke,
  results,
  active,
  color,
  reversed,
  emptyLabel,
  onPick,
}: {
  poke: CalcPokemon
  results: (DamageResult | null)[]
  active: number | null
  color: string
  reversed?: boolean
  emptyLabel: string
  onPick: (idx: number) => void
}) {
  return (
    <div className="grid gap-1">
      {poke.moves.map((m, i) => {
        const r = results[i]
        const tone = r ? damageTone(r.maxPct) : "dim"
        return (
          <button
            key={i}
            type="button"
            aria-pressed={active === i}
            onClick={() => onPick(i)}
            style={cssVars({ "--cxc": color })}
            className={cn(
              "cut-tag cut-tag-edge [--cut-tag:7px] flex w-full items-center gap-[0.625rem] border border-solid border-line bg-base px-3 py-2 text-left font-body text-[0.8125rem]/none text-txt",
              "transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2",
              "aria-pressed:border-[var(--cxc)] aria-pressed:bg-[color-mix(in_srgb,var(--cxc)_8%,var(--bg))]",
              reversed && "flex-row-reverse text-right",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{m.name || emptyLabel}</span>
            <span
              className={cn("whitespace-nowrap font-mono text-[0.75rem]/none font-semibold", reversed ? "mr-auto" : "ml-auto")}
              style={{ color: damageColor(tone) }}
            >
              {r && r.max > 0 ? `${r.minPct.toFixed(1)}–${r.maxPct.toFixed(1)}%` : m.name ? "0%" : ""}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  poke1: CalcPokemon
  poke2: CalcPokemon
  field: CalcField
  useChampions: boolean
  sel: Sel
  setSel: (sel: Sel) => void
}

// results strip: attacker moves ← verdict → defender moves.
export function VersusStrip({ poke1, poke2, field, useChampions, sel, setSel }: Props) {
  const t = useVgcT("calc")
  const { regulation } = useCalculatorStore()
  const legal = useLegalPokemon(regulation)

  const r1 = React.useMemo(() => calcAllMoves(poke1, poke2, field, useChampions), [poke1, poke2, field, useChampions])
  const r2 = React.useMemo(() => calcAllMoves(poke2, poke1, field, useChampions), [poke1, poke2, field, useChampions])

  const eff: Sel =
    sel ||
    (bestIdx(r1) !== null ? { side: 1, idx: bestIdx(r1)! } : bestIdx(r2) !== null ? { side: 2, idx: bestIdx(r2)! } : null)
  const res = eff ? (eff.side === 1 ? r1[eff.idx] : r2[eff.idx]) : null
  const move = eff ? (eff.side === 1 ? poke1.moves[eff.idx] : poke2.moves[eff.idx]) : null
  const atkName = eff ? (eff.side === 1 ? poke1.name : poke2.name) : ""
  const pick = (side: 1 | 2) => (i: number) =>
    setSel(sel && sel.side === side && sel.idx === i ? null : { side, idx: i })

  const subFor = (poke: CalcPokemon) => {
    const entry = legal.find((p) => p.name === poke.name)
    const hp = entry
      ? calcStat(GEN9, "hp", entry.baseStats.hp, poke.ivs.hp, useChampions ? Math.floor((poke.evs.hp * 252) / 32) : poke.evs.hp, poke.level, poke.nature)
      : 0
    const item = poke.item !== "None" ? ` · ${poke.item}` : ""
    return `${hp} ${t("panel.hpLabel")}${item}`
  }

  const koKey = res ? getKOVerdict(res).labelKey : "noKO"

  return (
    <section
      aria-label={t("title")}
      className="cut-corner cut-corner-edge mb-5 grid grid-cols-[minmax(0,1fr)_minmax(17.5rem,21.25rem)_minmax(0,1fr)] border border-solid border-line bg-panel max-[920px]:grid-cols-1"
    >
      <div className="min-w-0 px-4 py-[0.875rem]">
        <div className="mb-[0.625rem] flex items-center gap-[0.625rem]">
          <RoleTag color={ATK_COLOR}>{t("ui.attacker")}</RoleTag>
          <MiniCard name={poke1.name} sub={subFor(poke1)} />
        </div>
        <MoveList poke={poke1} results={r1} color={ATK_COLOR} emptyLabel={t("ui.emptyMove")} onPick={pick(1)} active={eff && eff.side === 1 ? eff.idx : null} />
      </div>

      <div
        aria-live="polite"
        className="relative flex flex-col items-center justify-center gap-2 border-x border-solid border-line bg-base-2 px-5 py-4 text-center max-[920px]:order-3 max-[920px]:border-x-0 max-[920px]:border-y"
      >
        {res && move && move.name ? (
          <>
            <span className="font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.14em] text-txt-dim">
              {atkName} · {move.name}
            </span>
            <KoVerdict text={t(`moveStrip.${koKey}`)} tone={KO_TONE[koKey]} />
            <span className="font-mono text-[0.9375rem]/none font-bold" style={{ color: damageColor(damageTone(res.maxPct)) }}>
              {res.min}–{res.max} {t("panel.hpLabel")} · {res.minPct.toFixed(1)}–{res.maxPct.toFixed(1)}%
            </span>
            <DamageBar minPct={res.minPct} maxPct={res.maxPct} tone={damageTone(res.maxPct)} />
            <span className="max-w-[40ch] break-words font-mono text-[0.75rem]/[1.5] text-txt-muted">{res.desc}</span>
            <CopyButton text={res.desc} label={t("saved.copy")} copiedLabel={t("saved.copied")} />
          </>
        ) : (
          <span className="font-body text-[0.8125rem]/[1.5] text-txt-dim">{t("ui.verdictEmpty")}</span>
        )}
      </div>

      <div className="min-w-0 px-4 py-[0.875rem] text-right">
        <div className="mb-[0.625rem] flex flex-row-reverse items-center gap-[0.625rem] max-[920px]:flex-row">
          <RoleTag color={DEF_COLOR}>{t("ui.defender")}</RoleTag>
          <MiniCard name={poke2.name} sub={subFor(poke2)} />
        </div>
        <MoveList poke={poke2} results={r2} color={DEF_COLOR} reversed emptyLabel={t("ui.emptyMove")} onPick={pick(2)} active={eff && eff.side === 2 ? eff.idx : null} />
      </div>
    </section>
  )
}
