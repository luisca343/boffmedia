"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { DkStat, DkSeg, DkSplit, DkTrend, DkHeat } from "@/components/boffmedia/ui/tools/datakit"
import { useSessionStats } from "@/features/vgc-tracker/hooks/useSessionStats"
import type { PokemonUsage, LeadPairStats } from "@/features/vgc-tracker/utils/sessionStats"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { TrPanel, TrSprite, TrSub, TrNone } from "../../_components/ui/tr-ui"

type TableTab = "myTeam" | "preview" | "leads" | "backs"

export function TrStats({ sessionId, startElo }: { sessionId: string; startElo?: number }) {
  const t = useTranslations("vgc.tracker.sessionStats")
  const { stats, loading } = useSessionStats(sessionId, startElo)
  const [tab, setTab] = useState<TableTab>("myTeam")

  const { record: r, elo: e, eloTimeline } = stats
  const played = r.played

  const streakLabel = (s: { type: "win" | "loss"; count: number } | null) =>
    s === null ? "—" : s.type === "win" ? t("kpi.streakWin", { count: s.count }) : t("kpi.streakLoss", { count: s.count })
  const wr = r.winRate === null ? "—" : `${Math.round(r.winRate * 100)}%`
  const fmtDelta = (v: number | null) => (v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)

  const tabItems: Record<TableTab, PokemonUsage[]> = {
    myTeam: stats.myPokemon,
    preview: stats.opponentPreview,
    leads: stats.opponentLeads,
    backs: stats.opponentBacks,
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
        <DkStat value={played} label={t("kpi.played")} />
        <DkStat value={wr} label={t("kpi.winRate")} tone={r.winRate === null ? "neutral" : r.winRate >= 0.5 ? "pos" : "neg"} />
        <DkStat
          value={e.current ?? "—"}
          label={t("kpi.eloNow")}
          tone={e.current == null || startElo == null ? "neutral" : e.current >= startElo ? "pos" : "neg"}
        />
        <DkStat value={streakLabel(r.streak)} label={t("kpi.streak")} tone={r.streak?.type === "win" ? "pos" : r.streak ? "neg" : "neutral"} small />
        <DkStat value={streakLabel(r.bestStreak)} label={t("kpi.bestStreak")} tone="accent" small />
        <DkStat value={e.best ?? "—"} label={t("kpi.eloBest")} tone="pos" small />
        <DkStat value={e.worst ?? "—"} label={t("kpi.eloWorst")} tone="neg" small />
        <DkStat
          value={fmtDelta(e.avgDeltaPerMatch)}
          label={t("kpi.avgDelta")}
          tone={e.avgDeltaPerMatch == null ? "neutral" : e.avgDeltaPerMatch >= 0 ? "pos" : "neg"}
          small
        />
      </div>

      {eloTimeline.length > 0 && (
        <TrPanel
          title={t("chart.title")}
          icon="trending"
          right={<span className="font-mono text-[10.5px] text-txt-muted">{startElo ?? "—"} → {e.current ?? "—"}</span>}
        >
          <DkTrend
            height={170}
            baseline={startElo}
            lines={[{ values: eloTimeline.map((p) => p.elo), color: "var(--accent)", dots: eloTimeline.map((p) => p.result) }]}
          />
        </TrPanel>
      )}

      <TrPanel
        title={t("table.title")}
        icon="chart"
        right={
          <DkSeg
            size="sm"
            value={tab}
            onChange={(v) => setTab(v as TableTab)}
            ariaLabel={t("table.title")}
            options={[
              { value: "myTeam", label: t("table.tabs.myTeam") },
              { value: "preview", label: t("table.tabs.preview") },
              { value: "leads", label: t("table.tabs.leads") },
              { value: "backs", label: t("table.tabs.backs") },
            ]}
          />
        }
      >
        <UsageTable items={tabItems[tab]} played={played} preview={tab === "preview"} />
      </TrPanel>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-3">
        <TrPanel title={t("pairs.title")} icon="users">
          <div className="grid grid-cols-2 gap-4">
            <PairList title={t("pairs.mine")} pairs={stats.myLeadPairs} />
            <PairList title={t("pairs.rivals")} pairs={stats.opponentLeadPairs} />
          </div>
        </TrPanel>
        <TrPanel title={t("archetype.title")} icon="shield">
          <VsRows
            rows={stats.archetypeBreakdown.map((a) => ({ key: a.archetype, name: a.archetype, w: a.wins, l: a.losses }))}
            empty={t("archetype.empty")}
          />
        </TrPanel>
      </div>

      <TrPanel title={t("matchup.title")} icon="target" right={<span className="font-mono text-[10.5px] text-txt-dim">{t("matchup.hint")}</span>}>
        {stats.opponentPreview.length === 0 ? (
          <TrNone>{t("matchup.empty")}</TrNone>
        ) : (
          <div className="grid">
            {stats.opponentPreview.slice(0, 12).map((m) => {
              const total = m.wins + m.losses
              return (
                <div key={m.speciesId} className="flex items-center gap-[10px] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-[5px] last:border-b-0">
                  <span className="inline-flex w-[160px] flex-none items-center gap-[7px] truncate font-body text-[12px]">
                    <TrSprite name={m.speciesName} size={24} />
                    <span className="truncate">{m.speciesName}</span>
                  </span>
                  <span className="w-[42px] flex-none text-right font-mono text-[11px] text-txt-muted">×{m.uses + m.discards}</span>
                  <span className="min-w-0 flex-1">
                    <DkSplit win={m.wins} loss={m.losses} draw={total > 0 ? 0 : 0} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </TrPanel>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-3">
        <TrPanel title={t("activity.title")} icon="calendar" right={<span className="font-mono text-[10.5px] text-txt-dim">{t("activity.hint")}</span>}>
          <ActivityHeat stats={stats} />
        </TrPanel>
        <TrPanel title={t("timeOfDay.title")} icon="clock">
          <VsRows
            rows={stats.timeSlots.map((s) => ({ key: s.slot, name: t(`timeOfDay.${s.slot}`), w: s.wins, l: s.losses, d: s.draws }))}
            empty={t("timeOfDay.empty")}
          />
        </TrPanel>
      </div>
    </div>
  )
}

// ─── usage table ─────────────────────────────────────────────────────────────
function UsageTable({ items, played, preview }: { items: PokemonUsage[]; played: number; preview: boolean }) {
  const t = useTranslations("vgc.tracker.sessionStats")
  if (!items.length) return <TrNone>{t("table.empty")}</TrNone>
  const counted = items.map((it) => ({ ...it, n: preview ? it.uses + it.discards : it.uses }))
  const peak = Math.max(...counted.map((i) => i.n), 1)
  return (
    <div className="grid">
      {counted.map((it) => {
        const wr = it.winRate == null ? null : Math.round(it.winRate * 100)
        const pct = played > 0 ? Math.round((it.n / played) * 100) : 0
        return (
          <div key={it.speciesId} className="flex items-center gap-[9px] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-1 last:border-b-0">
            <TrSprite name={it.speciesName} size={26} />
            <span className="min-w-0 flex-1 truncate font-body text-[12px]">{it.speciesName}</span>
            <span className="h-[5px] w-[90px] flex-none overflow-hidden border border-solid border-line bg-base" aria-hidden="true">
              <i className="block h-full bg-accent opacity-75" style={{ width: `${(it.n / peak) * 100}%` }} />
            </span>
            <span className="w-[42px] flex-none text-right font-mono text-[11px] text-txt-muted">{pct}%</span>
            <span className="w-[34px] flex-none text-right font-mono text-[10px] text-txt-dim">×{it.n}</span>
            <span className={cn("w-[44px] flex-none text-right font-mono text-[11px] font-bold", wr == null ? "text-txt-dim" : wr >= 50 ? "text-ok" : "text-bad")}>
              {wr == null ? "—" : `${wr}%`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── lead pair list ──────────────────────────────────────────────────────────
function PairList({ title, pairs }: { title: string; pairs: LeadPairStats[] }) {
  const t = useTranslations("vgc.tracker.sessionStats")
  return (
    <div className="min-w-0">
      <TrSub>{title}</TrSub>
      {pairs.length === 0 && <TrNone>{t("pairs.empty")}</TrNone>}
      {pairs.map((p) => {
        const wr = p.winRate == null ? null : Math.round(p.winRate * 100)
        return (
          <div key={p.key} className="flex items-center gap-[9px] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-1 last:border-b-0">
            <span className="inline-flex gap-px">
              <TrSprite name={p.lead1Name} size={24} />
              <TrSprite name={p.lead2Name} size={24} />
            </span>
            <span className="flex-1 font-mono text-[10.5px] text-txt-dim">×{p.games}</span>
            <span className={cn("font-mono text-[11px] font-bold", wr == null ? "text-txt-dim" : wr >= 50 ? "text-ok" : "text-bad")}>
              {wr == null ? "—" : `${wr}%`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── generic vs-rows (archetype / time-of-day) ───────────────────────────────
function VsRows({ rows, empty }: { rows: { key: string; name: string; w: number; l: number; d?: number }[]; empty: string }) {
  if (!rows.length) return <TrNone>{empty}</TrNone>
  return (
    <div className="grid">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-[10px] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-[5px] last:border-b-0">
          <span className="w-[130px] flex-none truncate font-body text-[12px]">{row.name}</span>
          <span className="w-[42px] flex-none text-right font-mono text-[11px] text-txt-muted">
            {row.w}-{row.l}
          </span>
          <span className="min-w-0 flex-1">
            <DkSplit win={row.w} loss={row.l} draw={row.d ?? 0} />
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── activity heatmap (day × time-slot) ──────────────────────────────────────
const HEAT_DAYS: { dow: number }[] = [{ dow: 1 }, { dow: 2 }, { dow: 3 }, { dow: 4 }, { dow: 5 }, { dow: 6 }, { dow: 0 }]
const HEAT_SLOTS = ["morning", "afternoon", "evening", "night"] as const

function ActivityHeat({ stats }: { stats: ReturnType<typeof useSessionStats>["stats"] }) {
  const t = useTranslations("vgc.tracker.sessionStats")
  const dayLabels = useTranslations("vgc.tracker.sessionStats.days")
  const grid = useMemo(() => {
    const map = new Map<string, number>()
    let max = 0
    for (const c of stats.heatmap) {
      map.set(`${c.dayOfWeek}:${c.slot}`, c.games)
      max = Math.max(max, c.games)
    }
    return { map, max: Math.max(1, max) }
  }, [stats.heatmap])

  return (
    <DkHeat
      rows={HEAT_DAYS.map((d) => dayLabels(String(d.dow)))}
      cols={HEAT_SLOTS.map((s) => t(`timeOfDay.${s}`))}
      max={grid.max}
      value={(ri, ci) => grid.map.get(`${HEAT_DAYS[ri].dow}:${HEAT_SLOTS[ci]}`) ?? 0}
    />
  )
}
