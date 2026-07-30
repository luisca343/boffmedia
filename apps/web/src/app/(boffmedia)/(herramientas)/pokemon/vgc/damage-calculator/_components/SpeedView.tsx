"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { calcStat, Generations } from "@smogon/calc"
import { cn } from "@/lib/utils"
import { Icon, Seg } from "@boffmedia/ui"
import { PokemonSprite } from "./ui/PokemonSprite"
import { TogglePill } from "./ui/TogglePill"
import { INPUT_CLASS } from "./ui/controls"
import { ATK_COLOR, DEF_COLOR, cssVars } from "./ui/theme"
import { useCalculatorStore } from "../_store/calculatorStore"
import { useLegalPokemon } from "../_hooks/useLegalPokemon"
import {
  applySpeedMods, applyItemSpeed, EMPTY_SPEED_MODS, SPEED_MOD_KEYS, type SpeedMods,
} from "../_lib/speedCalc"

const GEN9 = Generations.get(9)
const spToEv = (sp: number) => Math.floor((sp * 252) / 32)

type SpeedT = ReturnType<typeof useTranslations>

function Divider({ label, sub, color }: { label: React.ReactNode; sub?: React.ReactNode; color?: string }) {
  return (
    <div className="my-1.5 flex items-center gap-3 font-mono text-[11px]/none font-bold uppercase tracking-[0.14em] text-txt-muted" style={color ? { color } : undefined}>
      <span>
        {label}
        {sub && <span className="font-medium normal-case tracking-normal text-txt-dim"> {sub}</span>}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function ModBox({ mods, toggle, label, color, t }: { mods: SpeedMods; toggle: (k: keyof SpeedMods) => void; label: string; color: string; t: SpeedT }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-dashed border-line px-[10px] py-2" role="group" aria-label={label} style={cssVars({ "--cxc": color })}>
      <span className="flex-none font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cxc)" }}>{label}</span>
      {SPEED_MOD_KEYS.map((m) => (
        <TogglePill key={m.k} on={!!mods[m.k]} label={t(m.i18n)} tone={color} onClick={() => toggle(m.k)} />
      ))}
    </div>
  )
}

function SpeedCard({
  name, base, color, big, val, plus, neutral, baseLabel,
}: {
  name: string
  base: number
  color?: string
  big?: boolean
  val?: number
  plus?: number
  neutral?: number
  baseLabel: string
}) {
  return (
    <div
      className={cn("grid justify-items-center gap-1 border border-solid px-2 py-3 text-center", !color && "border-line bg-panel")}
      style={color ? cssVars({ "--cxc": color, borderColor: "color-mix(in srgb, var(--cxc) 50%, var(--line))", background: "color-mix(in srgb, var(--cxc) 6%, var(--panel))" }) : undefined}
    >
      <PokemonSprite name={name} size={32} />
      <span className="max-w-full truncate font-display text-[11px]/[1.15] font-bold uppercase tracking-[0.03em]" title={name}>{name}</span>
      {big ? (
        <span className="font-display text-[22px]/none font-extrabold italic" style={{ color }}>{val}</span>
      ) : (
        <span className="flex items-baseline gap-[7px] font-mono text-[12px]/none font-semibold">
          <b style={{ color: color || "var(--text)" }}>{plus}</b>
          <i className="text-[10px] not-italic text-txt-dim">{neutral}</i>
        </span>
      )}
      <span className="font-mono text-[9px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">{baseLabel}</span>
    </div>
  )
}

interface SpeedEntry { name: string; base: number; val: number; item: string; side: "mine" | "foe" }

export function SpeedView() {
  const t = useTranslations("vgc.calc.speedView")
  const tv = useTranslations("vgc.calc")
  const { team, many, regulation, useChampions } = useCalculatorStore()
  const legal = useLegalPokemon(regulation)

  const [level, setLevel] = React.useState<50 | 100>(50)
  const [myMods, setMyMods] = React.useState<SpeedMods>({ ...EMPTY_SPEED_MODS })
  const [foeMods, setFoeMods] = React.useState<SpeedMods>({ ...EMPTY_SPEED_MODS })
  const [filter, setFilter] = React.useState("")
  const [rivalsOnly, setRivalsOnly] = React.useState(many.length > 0)

  const hasRivals = many.length > 0
  const tw = myMods.trickRoom

  React.useEffect(() => {
    if (hasRivals) setRivalsOnly(true)
  }, [hasRivals])

  const baseSpe = React.useCallback((name: string) => legal.find((p) => p.name === name)?.baseStats.spe ?? 0, [legal])
  const speedOf = React.useCallback(
    (p: (typeof team)[number], mods: SpeedMods) => {
      const ev = useChampions ? spToEv(p.evs.spe) : p.evs.spe
      const stat = calcStat(GEN9, "spe", baseSpe(p.name), p.ivs.spe, ev, level, p.nature)
      return applyItemSpeed(applySpeedMods(stat, mods), p.item)
    },
    [baseSpe, level, useChampions],
  )

  const mine = React.useMemo<SpeedEntry[]>(
    () => team.map((p) => ({ name: p.name, base: baseSpe(p.name), val: speedOf(p, myMods), item: p.item, side: "mine" as const })).sort((a, b) => (tw ? a.val - b.val : b.val - a.val)),
    [team, myMods, speedOf, baseSpe, tw],
  )
  const foes = React.useMemo<SpeedEntry[]>(
    () => many.map((p) => ({ name: p.name, base: baseSpe(p.name), val: speedOf(p, foeMods), item: p.item, side: "foe" as const })).sort((a, b) => (tw ? a.val - b.val : b.val - a.val)),
    [many, foeMods, speedOf, baseSpe, tw],
  )

  const ref = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    return legal
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .map((p) => {
        const base = p.baseStats.spe
        return {
          name: p.name,
          base,
          neutral: applySpeedMods(calcStat(GEN9, "spe", base, 31, 0, level, "Serious"), myMods),
          plus: applySpeedMods(calcStat(GEN9, "spe", base, 31, 252, level, "Timid"), myMods),
        }
      })
      .sort((a, b) => (tw ? a.neutral - b.neutral : b.neutral - a.neutral))
      .slice(0, q ? 200 : 120)
  }, [legal, filter, level, myMods, tw])

  const showRivals = hasRivals && rivalsOnly
  const merged = React.useMemo(() => [...mine, ...foes].sort((a, b) => (tw ? a.val - b.val : b.val - a.val)), [mine, foes, tw])
  const teamNames = React.useMemo(() => new Set(team.map((p) => p.name)), [team])
  const manyNames = React.useMemo(() => new Set(many.map((p) => p.name)), [many])

  return (
    <div className="grid gap-4">
      {/* Controls */}
      <div className="grid gap-3 border border-solid border-line bg-panel px-4 py-[14px]">
        <div className="flex flex-wrap items-center gap-[14px]">
          <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("level")}</span>
          <Seg
            value={String(level)}
            onChange={(v) => setLevel(Number(v) as 50 | 100)}
            options={[
              { value: "50", label: "Lv 50" },
              { value: "100", label: "Lv 100" },
            ]}
          />
          {hasRivals && (
            <Seg
              value={rivalsOnly ? "riv" : "all"}
              onChange={(v) => setRivalsOnly(v === "riv")}
              options={[
                { value: "riv", label: t("vsRivals") },
                { value: "all", label: t("allPokemon") },
              ]}
            />
          )}
          {!showRivals && (
            <input
              className={cn(INPUT_CLASS, "max-w-[240px]")}
              value={filter}
              placeholder={t("filterPlaceholder")}
              aria-label={t("filterPlaceholder")}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
          {tw && <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-warn">{tv("ui.twHint")}</span>}
        </div>
        <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          <ModBox mods={myMods} toggle={(k) => setMyMods((m) => ({ ...m, [k]: !m[k] }))} label={t("modMyTeam")} color={ATK_COLOR} t={t} />
          <ModBox mods={foeMods} toggle={(k) => setFoeMods((m) => ({ ...m, [k]: !m[k] }))} label={t("modRivals")} color={DEF_COLOR} t={t} />
        </div>
      </div>

      {showRivals ? (
        <div className="grid gap-1.5">
          {merged.map((e, i) => {
            const opps = e.side === "mine" ? foes : mine
            const col = e.side === "mine" ? ATK_COLOR : DEF_COLOR
            return (
              <div key={`${e.side}-${e.name}-${i}`} className="flex items-center gap-3 border border-l-[3px] border-solid border-line bg-panel px-[14px] py-[9px]" style={cssVars({ "--cxc": col, borderLeftColor: "var(--cxc)" })}>
                <span className="w-6 flex-none text-right font-mono text-[12px]/none font-bold text-txt-dim">{i + 1}</span>
                <PokemonSprite name={e.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14px]/[1.15] font-bold uppercase tracking-[0.03em]">{e.name}</div>
                  <div className="flex flex-wrap gap-[10px] font-mono text-[10px]/[1.4] text-txt-dim">
                    <span>{t("baseSpeed", { speed: e.base })}</span>
                    {e.item !== "None" && <span>{e.item}</span>}
                    <b style={{ color: col }}>{e.side === "mine" ? t("myTeam") : t("rival")}</b>
                  </div>
                  {opps.length > 0 && (
                    <div className="mt-[5px] flex flex-wrap gap-[5px]">
                      {opps.map((o, j) => {
                        const res = tw ? o.val - e.val : e.val - o.val
                        const c = res > 0 ? "var(--ok)" : res === 0 ? "var(--warn)" : "var(--bad)"
                        return (
                          <span key={j} title={`${o.name} (${o.val})`} className="inline-flex" style={{ outline: `2px solid ${c}`, outlineOffset: 1 }}>
                            <PokemonSprite name={o.name} size={20} />
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <span className="ml-auto font-display text-[26px]/none font-extrabold italic" style={{ color: col }}>{e.val}</span>
              </div>
            )
          })}
          {!merged.length && (
            <div className="grid place-items-center gap-[10px] border border-dashed border-line-2 px-5 py-14 text-center font-body text-[13px]/[1.5] text-txt-dim">
              <Icon name="zap" size={26} />
              <p>{tv("ui.speedEmpty")}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {mine.length > 0 && (
            <>
              <Divider label={t("sectionMyTeam")} color="var(--accent)" />
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                {mine.map((p) => (
                  <SpeedCard key={p.name} name={p.name} base={p.base} color={ATK_COLOR} big val={p.val} baseLabel={t("baseSpeed", { speed: p.base })} />
                ))}
              </div>
            </>
          )}
          {foes.length > 0 && (
            <>
              <Divider label={t("sectionRivals")} color="var(--info)" />
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                {foes.map((p) => (
                  <SpeedCard key={p.name} name={p.name} base={p.base} color={DEF_COLOR} big val={p.val} baseLabel={t("baseSpeed", { speed: p.base })} />
                ))}
              </div>
            </>
          )}
          <Divider label={`${tv("ui.reference")} · ${ref.length}`} sub={tv("ui.referenceSub")} />
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
            {ref.map((p) => {
              const col = teamNames.has(p.name) ? ATK_COLOR : manyNames.has(p.name) ? DEF_COLOR : undefined
              return <SpeedCard key={p.name} name={p.name} base={p.base} color={col} plus={p.plus} neutral={p.neutral} baseLabel={t("baseSpeed", { speed: p.base })} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}
