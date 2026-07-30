"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon, Seg } from "@boffmedia/ui"
import { PokemonSprite } from "./ui/PokemonSprite"
import { TypeBadge } from "./ui/TypeBadge"
import { useCalculatorStore } from "../_store/calculatorStore"
import { useLegalPokemon } from "../_hooks/useLegalPokemon"
import { ALL_TYPES, getTypeEff, getBestOffenseEff } from "../_lib/typeChart"

type Poke = { name: string; types: string[] }
type TypesT = ReturnType<typeof useTranslations>

function effLabel(eff: number): string {
  if (eff === 0) return "0"
  if (eff === 0.25) return "¼"
  if (eff === 0.5) return "½"
  if (eff === 1) return ""
  if (eff === 4) return "4×"
  return "2×"
}
function effCell(eff: number): React.CSSProperties {
  if (eff === 0) return { background: "color-mix(in srgb, var(--dim) 14%, transparent)", color: "var(--dim)" }
  if (eff <= 0.25) return { background: "color-mix(in srgb, var(--ok) 20%, transparent)", color: "var(--ok)" }
  if (eff < 1) return { background: "color-mix(in srgb, var(--ok) 10%, transparent)", color: "var(--ok)" }
  if (eff === 1) return {}
  if (eff >= 4) return { background: "color-mix(in srgb, var(--bad) 18%, transparent)", color: "var(--bad)" }
  return { background: "color-mix(in srgb, var(--warn) 13%, transparent)", color: "var(--warn)" }
}

function CoverageTable({ pokes, mode, t }: { pokes: Poke[]; mode: "offense" | "defense"; t: TypesT }) {
  const cell = "border border-solid border-[color-mix(in_srgb,var(--line)_70%,transparent)] px-[7px] py-[5px] text-center"
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[11px]/none font-semibold">
        <thead>
          <tr>
            <th className={cell} scope="col" />
            {pokes.map((p) => (
              <th key={p.name} className={cell} scope="col">
                <PokemonSprite name={p.name} size={30} />
              </th>
            ))}
            <th className={`${cell} tracking-[0.08em]`} scope="col" style={{ color: "var(--bad)" }}>
              {mode === "offense" ? t("nve") : t("weak")}
            </th>
            <th className={`${cell} tracking-[0.08em]`} scope="col" style={{ color: "var(--ok)" }}>
              {mode === "offense" ? t("se") : t("res")}
            </th>
          </tr>
        </thead>
        <tbody>
          {ALL_TYPES.map((rt) => {
            const effs = pokes.map((p) => (mode === "offense" ? getBestOffenseEff(p.types, rt) : getTypeEff(rt, p.types)))
            const bad = mode === "offense" ? effs.filter((e) => e > 0 && e < 1).length : effs.filter((e) => e >= 2).length
            const good = mode === "offense" ? effs.filter((e) => e >= 2).length : effs.filter((e) => e > 0 && e < 1).length
            return (
              <tr key={rt}>
                <td className={`${cell} !text-left`}>
                  <TypeBadge type={rt} small />
                </td>
                {effs.map((e, j) => (
                  <td key={j} className={cell} style={effCell(e)}>
                    {effLabel(e)}
                  </td>
                ))}
                <td className={cell} style={{ color: bad ? "var(--bad)" : "var(--dim)" }}>{bad || ""}</td>
                <td className={cell} style={{ color: good ? "var(--ok)" : "var(--dim)" }}>{good || ""}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// TypesView — offensive coverage + defensive profile.
export function TypesView() {
  const t = useTranslations("vgc.calc.typeCalc")
  const tv = useTranslations("vgc.calc")
  const { team, many, regulation } = useCalculatorStore()
  const legal = useLegalPokemon(regulation)
  const [view, setView] = React.useState<"team" | "rivals">("team")

  const toPokes = (list: typeof team): Poke[] =>
    list.map((p) => {
      const sp = legal.find((lp) => lp.name === p.name)
      return sp ? { name: p.name, types: sp.types } : null
    }).filter((p): p is Poke => !!p)

  const teamP = toPokes(team)
  const manyP = toPokes(many)
  const hasRivals = manyP.length > 0
  const active = view === "team" ? teamP : manyP
  const isRivals = view === "rivals"

  if (!teamP.length && !manyP.length) {
    return (
      <div className="grid place-items-center gap-[10px] border border-dashed border-line-2 px-5 py-14 text-center font-body text-[13px]/[1.5] text-txt-dim">
        <Icon name="shield" size={28} />
        <p>{tv("ui.typesEmpty")}</p>
      </div>
    )
  }

  const offIns = active.map((p) => {
    let se = 0, nve = 0, imm = 0
    for (const dt of ALL_TYPES) {
      const e = getBestOffenseEff(p.types, dt)
      if (e >= 2) se++
      else if (e === 0) imm++
      else if (e < 1) nve++
    }
    return { ...p, se, nve, imm }
  })
  const defIns = active.map((p) => {
    let w = 0, r = 0, im = 0, q = 0
    for (const at of ALL_TYPES) {
      const e = getTypeEff(at, p.types)
      if (e >= 4) { w++; q++ }
      else if (e >= 2) w++
      else if (e === 0) im++
      else if (e < 1) r++
    }
    return { ...p, w, r, im, q }
  })

  const col = "border border-solid border-line bg-panel px-4 py-[14px] grid gap-2 content-start"

  return (
    <div className="grid gap-4">
      {hasRivals && (
        <div>
          <Seg
            value={view}
            onChange={(v) => setView(v as "team" | "rivals")}
            options={[
              { value: "team", label: t("myTeamToggle") },
              { value: "rivals", label: t("rivalsToggle") },
            ]}
          />
        </div>
      )}

      {!active.length ? (
        <div className="grid place-items-center gap-[10px] border border-dashed border-line-2 px-5 py-14 text-center font-body text-[13px]/[1.5] text-txt-dim">
          <Icon name="shield" size={26} />
          <p>{isRivals ? t("noThreats") : t("noTeam")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            <div className={col}>
              <div className="font-mono text-[11px]/none font-bold uppercase tracking-[0.12em]" style={{ color: "var(--accent)" }}>
                {isRivals ? t("rivalsCanThreaten") : t("offensiveCoverage")}
              </div>
              {offIns.map((p) => (
                <div key={p.name} className="flex items-center gap-[10px] font-body text-[12px]/[1.4] text-txt-muted">
                  <PokemonSprite name={p.name} size={26} />
                  <span>
                    {t("canHit")} <b className="font-mono text-txt">{p.se}</b> {t("typesSe")}
                    {p.nve ? <span>, {p.nve} {t("notVeryEffective")}</span> : null}
                    {p.imm ? <span>, {p.imm} {t("insightImmune")}</span> : null}
                  </span>
                </div>
              ))}
            </div>
            <div className={col}>
              <div className="font-mono text-[11px]/none font-bold uppercase tracking-[0.12em]" style={{ color: "var(--info)" }}>
                {isRivals ? t("rivalsVulnerabilities") : t("defensiveProfile")}
              </div>
              {defIns.map((p) => (
                <div key={p.name} className="flex items-center gap-[10px] font-body text-[12px]/[1.4] text-txt-muted">
                  <PokemonSprite name={p.name} size={26} />
                  <span>
                    {p.im ? <span><b className="font-mono text-txt">{p.im}</b> {t("insightImmune")}, </span> : null}
                    <b className="font-mono text-txt">{p.r}</b> {t("resists")}
                    {p.w ? <span style={{ color: "var(--bad)" }}>, {p.w} {t("insightWeak")}{p.q ? ` (${p.q}×4)` : ""}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
            <div className="border border-solid border-line bg-panel">
              <div className="flex items-baseline gap-[10px] border-b border-solid border-line px-4 py-3 font-display text-[13px]/none font-bold uppercase tracking-[0.05em]" style={{ color: "var(--accent)" }}>
                {t("offensiveCoverageTitle")}
                <span className="font-mono text-[10px]/[1.3] font-normal normal-case tracking-normal text-txt-dim">{t("stabVsDefenderType")}</span>
              </div>
              <CoverageTable pokes={active} mode="offense" t={t} />
            </div>
            <div className="border border-solid border-line bg-panel">
              <div className="flex items-baseline gap-[10px] border-b border-solid border-line px-4 py-3 font-display text-[13px]/none font-bold uppercase tracking-[0.05em]" style={{ color: "var(--info)" }}>
                {t("defensiveCoverageTitle")}
                <span className="font-mono text-[10px]/[1.3] font-normal normal-case tracking-normal text-txt-dim">{t("stabByDefenderType")}</span>
              </div>
              <CoverageTable pokes={active} mode="defense" t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
