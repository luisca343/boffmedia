"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia-v2/primitives/icon"
import { SegTabs } from "@/components/boffmedia-v2/primitives/seg-tabs"
import { ToolSelect } from "@/components/boffmedia-v2/primitives/tool-select"
import type { SmogonSnapshot, ChampionsRegulation, LimitlessTournament } from "@/services/api/boffmedia/vgcService"
import { ENABLE_PREVIEW_FORMATS } from "../constants"

interface VgcToolbarProps {
  tab: string
  format: string
  month: string
  cutoff: number
  regulation: string
  tournamentId: string
  snapshots: SmogonSnapshot[]
  regulations: ChampionsRegulation[]
  tournaments: LimitlessTournament[]
  formatLabels: Record<string, string>
  totalBattles: number
  totalTeams: number
  onTabChange: (tab: string) => void
  onFormatChange: (format: string, month: string, cutoff: number) => void
  onOptionsApply: (month: string, cutoff: number) => void
  onRegulationChange: (regulationId: string) => void
  onTournamentChange: (tournamentId: string) => void
}

const VALID_CUTOFFS = [1760, 1630, 1500, 0] as const

export function VgcToolbar({
  tab,
  format,
  month,
  cutoff,
  regulation,
  tournamentId,
  snapshots,
  regulations,
  tournaments,
  formatLabels,
  totalBattles,
  totalTeams,
  onTabChange,
  onFormatChange,
  onOptionsApply,
  onRegulationChange,
  onTournamentChange,
}: VgcToolbarProps) {
  const t = useTranslations("vgc.meta")

  const sortedRegulations = [...regulations].sort((a, b) => b.id.localeCompare(a.id))
  const previewRegulations = ENABLE_PREVIEW_FORMATS
    ? sortedRegulations.filter((r) => Boolean(r.vgcPastesGid))
    : []
  const isPreviewFormat = previewRegulations.some((r) => r.id === format)

  const regulationNameByFormatId = new Map(sortedRegulations.map((r) => [r.formatId, r.name]))

  const latestMonthByFormat = new Map<string, string>()
  for (const s of snapshots) {
    const prev = latestMonthByFormat.get(s.formatId)
    if (!prev || s.month > prev) latestMonthByFormat.set(s.formatId, s.month)
  }
  const uniqueFormats = [...latestMonthByFormat.keys()].sort((a, b) => {
    const monthA = latestMonthByFormat.get(a) ?? ""
    const monthB = latestMonthByFormat.get(b) ?? ""
    return monthB.localeCompare(monthA) || a.localeCompare(b)
  })

  const availableMonths = [...new Set(snapshots.filter((s) => s.formatId === format).map((s) => s.month))].sort().reverse()

  const existingCutoffs = new Set(snapshots.filter((s) => s.formatId === format).map((s) => s.cutoff))
  const availableCutoffs = VALID_CUTOFFS.filter((c) => existingCutoffs.has(c))
  const cutoffValue = availableCutoffs.includes(cutoff as (typeof VALID_CUTOFFS)[number])
    ? String(cutoff)
    : String(availableCutoffs[0] ?? 1760)

  const pickLatestSnapshot = (targetFormat: string, preferredCutoff?: number) => {
    const formatSnapshots = snapshots.filter((s) => s.formatId === targetFormat)
    if (formatSnapshots.length === 0) return null
    const preferred = preferredCutoff === undefined ? [] : formatSnapshots.filter((s) => s.cutoff === preferredCutoff)
    const pool = preferred.length > 0 ? preferred : formatSnapshots
    return [...pool].sort((a, b) => b.month.localeCompare(a.month) || b.cutoff - a.cutoff)[0]
  }

  const handleFormatSelect = (value: string) => {
    if (value === format) return
    const previewReg = previewRegulations.find((r) => r.id === value)
    if (previewReg) { onFormatChange(value, "", 1760); return }
    const snapshot = pickLatestSnapshot(value, cutoff)
    if (snapshot) { onFormatChange(snapshot.formatId, snapshot.month, snapshot.cutoff); return }
    onFormatChange(value, "", 1760)
  }

  const formatItems = [
    { header: "Smogon" },
    ...uniqueFormats.map((fmtId) => ({ value: fmtId, label: regulationNameByFormatId.get(fmtId) ?? formatLabels[fmtId] ?? fmtId })),
    ...(previewRegulations.length > 0
      ? [{ header: "Champions · Preview" }, ...previewRegulations.map((r) => ({ value: r.id, label: r.name }))]
      : []),
  ]

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
      <SegTabs
        value={tab}
        options={[
          { value: "stats", label: t("tabs.stats") },
          { value: "tournament", label: t("tabs.tournament") },
        ]}
        onChange={onTabChange}
        size="sm"
      />
      <span className="w-px h-5 bg-[var(--border)] mx-0.5" />
      {tab === "stats" ? (
        <>
          <ToolSelect
            value={format}
            icon="filter"
            width="220px"
            minWidth="150px"
            items={formatItems}
            onSelect={handleFormatSelect}
          />
          {!isPreviewFormat && uniqueFormats.length > 0 && (
            <>
              <ToolSelect
                value={month || "__all__"}
                width="150px"
                minWidth="120px"
                items={[
                  { value: "__all__", label: t("pickers.monthPlaceholder") },
                  ...availableMonths.map((m) => ({ value: m, label: m })),
                ]}
                onSelect={(v) => onOptionsApply(v === "__all__" ? "" : v, cutoff)}
              />
              <ToolSelect
                value={cutoffValue}
                width="140px"
                minWidth="110px"
                items={availableCutoffs.map((c) => ({ value: String(c), label: c === 0 ? "All ELO" : `${c}+ ELO` }))}
                onSelect={(v) => onOptionsApply(month, Number(v))}
              />
            </>
          )}
        </>
      ) : (
        <>
          <ToolSelect
            value={regulation}
            icon="filter"
            width="160px"
            minWidth="120px"
            items={sortedRegulations.map((r) => ({ value: r.id, label: r.name }))}
            onSelect={onRegulationChange}
          />
          <ToolSelect
            value={tournamentId || "combined"}
            width="270px"
            minWidth="200px"
            align="right"
            items={[
              { value: "combined", label: t("tabs.combined") },
              ...[...tournaments]
                .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
                .map((t2) => ({ value: String(t2.id), label: t2.name ?? t2.limitlessId + (t2.date ? ` — ${t2.date.slice(0, 10)}` : "") })),
            ]}
            onSelect={onTournamentChange}
          />
        </>
      )}
      <div className="flex-1" />
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-edge text-ink-dim">
        <Icon name="database" size={13} />
        {tab === "stats" ? `${totalBattles.toLocaleString("es-ES")} batallas` : `${totalTeams.toLocaleString("es-ES")} equipos`}
      </span>
    </div>
  )
}
