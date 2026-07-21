"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Chip, Empty } from "@/components/boffmedia/primitives"
import { BuildDataWithIds, Skill } from "@/types/tools/mhwilds"
import { MhLabel, MhTag } from "../../../_components/ui/mh-kit"
import { elementColor } from "../../../_components/mh-helpers"
import { resolveBuild, getSavedBuilds, type BuildResolvers } from "../_utils/buildUtils"
import { calculateStats, calculateTotalSkills } from "../_utils/calculationUtils"

interface Metric {
  weaponName: string | null
  attack: number
  affinity: number
  element?: { type: string; damage: number }
  defense: number
  resTotal: number
  skillCount: number
  wasted: number
  top: Skill[]
}

// numeric metric keys eligible for best-of-row highlighting
type NumKey = "attack" | "affinity" | "defense" | "resTotal" | "skillCount" | "wasted"

function computeMetric(build: BuildDataWithIds, g: BuildResolvers, skillsData: Record<string, any>): Metric {
  const full = resolveBuild(build, g)
  const stats = calculateStats(full)
  const skills = calculateTotalSkills(full, skillsData)
  const wasted = skills.filter((s) => s.level > s.maxLevel).reduce((n, s) => n + (s.level - s.maxLevel), 0)
  const resTotal = stats.fireRes + stats.waterRes + stats.thunderRes + stats.iceRes + stats.dragonRes
  const top = [...skills].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)).slice(0, 4)
  return {
    weaponName: full.weapon ? full.weapon.name : null,
    attack: stats.attack,
    affinity: stats.affinity,
    element: stats.element,
    defense: stats.defenseMin,
    resTotal,
    skillCount: skills.length,
    wasted,
    top,
  }
}

export function PlannerCompare({
  currentBuild,
  resolvers,
  skillsData,
  onBack,
}: {
  currentBuild: BuildDataWithIds
  resolvers: BuildResolvers
  skillsData: Record<string, any>
  onBack: () => void
}) {
  const t = useTranslations("mhwilds")
  const [saved] = React.useState(() => getSavedBuilds())
  const [sel, setSel] = React.useState<string[]>([])
  const toggle = (key: string) =>
    setSel((a) => (a.includes(key) ? a.filter((x) => x !== key) : a.length >= 2 ? [a[1], key] : [...a, key]))

  const cols = React.useMemo(() => {
    const base = { key: "__current", name: `${currentBuild.name} · ${t("build_planner.compare.current")}`, build: currentBuild }
    const chosen = sel
      .map((key) => saved.find((s) => s.key === key))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ key: s.key, name: s.name, build: s.build }))
    return [base, ...chosen].map((c) => ({ ...c, m: computeMetric(c.build, resolvers, skillsData) }))
  }, [currentBuild, sel, saved, resolvers, skillsData, t])

  const best = (key: NumKey, lowerBetter = false) => {
    const vals = cols.map((c) => c.m[key])
    return lowerBetter ? Math.min(...vals) : Math.max(...vals)
  }
  const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

  const rows: { label: string; get: (m: Metric) => React.ReactNode; key?: NumKey; low?: boolean }[] = [
    { label: t("weapon"), get: (m) => m.weaponName ?? "—" },
    { label: t("attack"), get: (m) => m.attack, key: "attack" },
    { label: t("affinity"), get: (m) => `${signed(m.affinity)}%`, key: "affinity" },
    {
      label: t("element"),
      get: (m) =>
        m.element ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: elementColor(m.element.type) }} />
            {t(m.element.type)} {m.element.damage}
          </span>
        ) : (
          "—"
        ),
    },
    { label: t("defense"), get: (m) => m.defense, key: "defense" },
    { label: t("build_planner.compare.res_total"), get: (m) => signed(m.resTotal), key: "resTotal" },
    { label: t("build_planner.active_skills"), get: (m) => m.skillCount, key: "skillCount" },
    { label: t("build_planner.compare.wasted"), get: (m) => m.wasted, key: "wasted", low: true },
  ]

  const gridStyle = { gridTemplateColumns: `minmax(116px,150px) repeat(${cols.length}, minmax(132px,1fr))` }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <div className="font-display text-[22px] leading-none italic font-extrabold uppercase text-txt">
            {t("build_planner.compare.title")}
          </div>
          <div className="mt-1 font-mono text-[12px] leading-snug text-txt-muted">{t("build_planner.compare.lead")}</div>
        </div>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" icon="back" onClick={onBack}>
          {t("build_planner.compare.back")}
        </Button>
      </div>

      {saved.length === 0 ? (
        <Empty icon="bookmark" title={t("build_planner.compare.emptyTitle")} lead={t("build_planner.compare.emptyLead")} />
      ) : (
        <>
          <div>
            <MhLabel>{t("build_planner.compare.pick", { count: sel.length })}</MhLabel>
            <div className="flex flex-wrap gap-1.5">
              {saved.map((s) => (
                <Chip key={s.key} on={sel.includes(s.key)} onClick={() => toggle(s.key)}>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[440px] gap-px border border-line bg-line" style={gridStyle}>
              <div className="bg-panel" />
              {cols.map((c) => (
                <div
                  key={c.key}
                  className="truncate bg-panel-2 px-3 py-2.5 font-display text-[13px] leading-tight font-bold uppercase tracking-[0.02em] text-txt"
                >
                  {c.name}
                </div>
              ))}

              {rows.map((row) => {
                const bestVal = row.key ? best(row.key, row.low) : null
                return (
                  <React.Fragment key={row.label}>
                    <div className="flex items-center bg-panel px-3 py-2.5 font-mono text-[10px] leading-none font-bold uppercase tracking-[0.12em] text-txt-dim">
                      {row.label}
                    </div>
                    {cols.map((c) => {
                      const raw = row.key ? c.m[row.key] : null
                      const isBest = row.key != null && cols.length > 1 && raw === bestVal
                      return (
                        <div
                          key={c.key}
                          className={cn(
                            "bg-panel px-3 py-2.5 font-display text-[15px] leading-none font-bold tabular-nums",
                            isBest ? "text-[var(--mh-bright)]" : "text-txt",
                          )}
                        >
                          {row.get(c.m)}
                        </div>
                      )
                    })}
                  </React.Fragment>
                )
              })}

              <div className="flex items-center bg-panel px-3 py-2.5 font-mono text-[10px] leading-none font-bold uppercase tracking-[0.12em] text-txt-dim">
                {t("build_planner.compare.topSkills")}
              </div>
              {cols.map((c) => (
                <div key={c.key} className="flex flex-wrap content-start gap-1 bg-panel px-3 py-2.5">
                  {c.m.top.length ? (
                    c.m.top.map((sk) => (
                      <MhTag key={sk.id} sk>
                        {sk.name} {sk.level}
                      </MhTag>
                    ))
                  ) : (
                    <span className="font-mono text-[12px] text-txt-dim">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
