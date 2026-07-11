"use client"

import { useTranslations } from "next-intl"
import { calcStat, Generations } from "@smogon/calc"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import type { CalcPokemon, StatKey, BoostKey } from "../../_types/calculator"
import { NATURES } from "../../_hooks/usePokemonData"

const GEN9 = Generations.get(9)
const STAT_KEYS: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"]
const STAGES = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]

type BaseStats = Record<StatKey, number>

// Compact cell control.
const CELL =
  "w-full cut-tag [--cut-tag:5px] border border-solid border-line-2 bg-base [[data-theme=light]_&]:bg-panel-2 px-[7px] py-[5px] font-mono text-[11px] text-txt outline-none focus:border-accent"

const CELL_CARET: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 11px) 55%, calc(100% - 8px) 55%",
  backgroundSize: "4px 4px",
  backgroundRepeat: "no-repeat",
}

// base / stage / IV / EV / total, with a 510 (or 66 SP) budget.
export function StatEditor({
  poke,
  baseStats,
  onChange,
  useChampions = false,
}: {
  poke: CalcPokemon
  baseStats: BaseStats
  onChange: (patch: Partial<CalcPokemon>) => void
  useChampions?: boolean
}) {
  const t = useTranslations("vgc.calc.panel")
  const nature = NATURES.find((n) => n.name === poke.nature)
  const plus = nature?.plus ?? null
  const minus = nature?.minus ?? null
  const evMax = useChampions ? 32 : 252
  const evTotal = useChampions ? 66 : 510
  const total = STAT_KEYS.reduce((a, k) => a + poke.evs[k], 0)
  const over = total > evTotal

  const labels: Record<StatKey, string> = {
    hp: t("statHp"), atk: t("statAtk"), def: t("statDef"), spa: t("statSpa"), spd: t("statSpd"), spe: t("statSpe"),
  }
  const live = (k: StatKey) => {
    const ev = useChampions ? Math.floor((poke.evs[k] * 252) / 32) : poke.evs[k]
    return calcStat(GEN9, k, baseStats[k], poke.ivs[k], ev, poke.level, poke.nature)
  }
  const set = (obj: "boosts" | "ivs" | "evs", k: StatKey, v: number, lo: number, hi: number) =>
    onChange({ [obj]: { ...poke[obj], [k]: Math.min(hi, Math.max(lo, v)) } } as Partial<CalcPokemon>)

  const th = "border-b border-solid border-line px-1.5 py-1 font-mono text-[9px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim"
  const td = "border-b border-solid border-[color-mix(in_srgb,var(--line)_50%,transparent)] px-1.5 py-1"

  return (
    <div>
      <table className="w-full border-collapse font-mono text-[12px]/[1.2]">
        <thead>
          <tr>
            <th className={cn(th, "text-left")}>{t("colStat")}</th>
            <th className={cn(th, "text-left")}>{t("colBase")}</th>
            <th className={cn(th, "text-left")}>{t("colStage")}</th>
            <th className={cn(th, "text-left")}>{t("colIvs")}</th>
            <th className={cn(th, "text-left")}>{useChampions ? t("colSp") : t("colEvs")}</th>
            <th className={cn(th, "text-right")}>{t("colTotal")}</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">
          {STAT_KEYS.map((k) => {
            const up = plus === k
            const down = minus === k
            const toneCls = up ? "text-ok" : down ? "text-bad" : ""
            return (
              <tr key={k}>
                <td className={cn(td, "whitespace-nowrap font-bold", toneCls)}>
                  {labels[k]}
                  {up ? " ▲" : down ? " ▼" : ""}
                </td>
                <td className={cn(td, "text-txt-muted")}>{baseStats[k]}</td>
                <td className={td}>
                  {k !== "hp" ? (
                    <select
                      value={poke.boosts[k as BoostKey]}
                      aria-label={`${t("colStage")} ${labels[k]}`}
                      onChange={(e) => set("boosts", k, parseInt(e.target.value, 10), -6, 6)}
                      className={cn(CELL, "cursor-pointer appearance-none pr-[22px]")}
                      style={CELL_CARET}
                    >
                      {STAGES.map((v) => (
                        <option key={v} value={v}>
                          {v > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-txt-dim">—</span>
                  )}
                </td>
                <td className={td}>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={poke.ivs[k]}
                    aria-label={`${t("colIvs")} ${labels[k]}`}
                    onChange={(e) => set("ivs", k, parseInt(e.target.value, 10) || 0, 0, 31)}
                    className={CELL}
                  />
                </td>
                <td className={td}>
                  <input
                    type="number"
                    min={0}
                    max={evMax}
                    step={useChampions ? 1 : 4}
                    value={poke.evs[k]}
                    aria-label={`${useChampions ? t("colSp") : t("colEvs")} ${labels[k]}`}
                    onChange={(e) => set("evs", k, parseInt(e.target.value, 10) || 0, 0, evMax)}
                    className={cn(CELL, over && "border-bad")}
                  />
                </td>
                <td className={cn(td, "text-right font-bold", toneCls)}>{live(k)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div
        className={cn("flex items-center gap-2 pt-1.5 font-mono text-[11px]/[1.3] text-txt-dim", over && "text-bad")}
        role={over ? "alert" : undefined}
      >
        {over && <Icon name="alert" size={13} />}
        {useChampions ? t("totalSp") : t("totalEvs")}:{" "}
        <b className={over ? "text-bad" : "text-txt-muted"}>
          {total} / {evTotal}
        </b>
        {over && <span>— {t("overBudget")}</span>}
      </div>
    </div>
  )
}
