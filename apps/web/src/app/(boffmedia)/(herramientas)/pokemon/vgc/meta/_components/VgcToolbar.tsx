"use client"

import { useTranslations } from "next-intl"
import { DkBar, DkTitle, DkDivider, DkSeg, DkSelect, DkSpacer, DkChip } from "@/components/boffmedia/ui/tools/datakit"
import type { SmogonSnapshot, ChampionsRegulation, LimitlessTournament } from "@/services/api/boffmedia/vgcService"
import { fmtCount } from "../_lib/meta-types"

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
  // A registered regulation is ALWAYS keyed by its own id in the picker, never
  // by formatId — otherwise a regulation whose id and formatId are the same
  // string (the common case) would produce two identical-looking options.
  const regulationById = new Map(sortedRegulations.map((r) => [r.id, r]))
  const regulationByFormatId = new Map(sortedRegulations.map((r) => [r.formatId, r]))
  // Older URLs carry a bare formatId — resolve those to the regulation too so
  // the picker still highlights the right option.
  const selectedRegulation = regulationById.get(format) ?? regulationByFormatId.get(format)
  const resolvedFormat = selectedRegulation?.formatId ?? format
  const selectValue = selectedRegulation?.id ?? format

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

  // Smogon is the preferred source whenever a snapshot exists; the VGCPastes
  // sheet is the fallback for regulations that have no ladder data yet.
  const hasSnapshot = snapshots.some((s) => s.formatId === resolvedFormat)
  const isChampionsFormat = Boolean(selectedRegulation?.vgcPastesGid) && !hasSnapshot

  const availableMonths = [...new Set(snapshots.filter((s) => s.formatId === resolvedFormat).map((s) => s.month))].sort().reverse()
  const existingCutoffs = new Set(snapshots.filter((s) => s.formatId === resolvedFormat).map((s) => s.cutoff))
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
    // Keep the picked key in the URL (regulation id or bare formatId) and only
    // resolve it to a formatId when looking the snapshot up.
    const snapshot = pickLatestSnapshot(regulationById.get(value)?.formatId ?? value, cutoff)
    onFormatChange(value, snapshot?.month ?? "", snapshot?.cutoff ?? 1760)
  }

  const formatOptions = [
    // One option per regulation…
    ...sortedRegulations.map((r) => ({ value: r.id, label: r.name })),
    // …plus any snapshot whose format has no regulation registered for it.
    ...uniqueFormats
      .filter((id) => !regulationByFormatId.has(id))
      .map((id) => ({ value: id, label: formatLabels[id] ?? id })),
  ]

  const tournamentOptions = [
    { value: "combined", label: t("tabs.combined") },
    ...[...tournaments]
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .map((tour) => ({
        value: String(tour.id),
        label: tour.name ?? String(tour.limitlessId) + (tour.date ? ` — ${tour.date.slice(0, 10)}` : ""),
      })),
  ]

  return (
    <DkBar>
      <DkTitle icon="trending" label={t("barTitle")} sub={tab === "stats" ? t("barSub.ladder") : t("barSub.tournament")} />
      <DkDivider />
      <DkSeg
        value={tab}
        ariaLabel={t("aria.source")}
        onChange={onTabChange}
        options={[
          { value: "stats", label: t("tabs.stats") },
          { value: "tournament", label: t("tabs.tournament") },
        ]}
      />
      {tab === "stats" ? (
        <>
          <DkSelect value={selectValue} ariaLabel={t("pickers.format")} minWidth="180px" onChange={handleFormatSelect} options={formatOptions} />
          {!isChampionsFormat && availableCutoffs.length > 0 && (
            <>
              <DkSelect
                value={month || "__all__"}
                ariaLabel={t("pickers.month")}
                onChange={(v) => onOptionsApply(v === "__all__" ? "" : v, cutoff)}
                options={[{ value: "__all__", label: t("pickers.monthPlaceholder") }, ...availableMonths.map((m) => ({ value: m, label: m }))]}
              />
              <DkSelect
                value={cutoffValue}
                ariaLabel={t("pickers.cutoff")}
                onChange={(v) => onOptionsApply(month, Number(v))}
                options={availableCutoffs.map((c) => ({ value: String(c), label: c === 0 ? t("cutoff.all") : `${c}+ ELO` }))}
              />
            </>
          )}
        </>
      ) : (
        <>
          <DkSelect
            value={regulation}
            ariaLabel={t("pickers.regulation")}
            onChange={onRegulationChange}
            options={sortedRegulations.map((r) => ({ value: r.id, label: r.name }))}
          />
          <DkSelect value={tournamentId || "combined"} ariaLabel={t("pickers.tournament")} minWidth="200px" onChange={onTournamentChange} options={tournamentOptions} />
        </>
      )}
      <DkSpacer />
      <DkChip icon="database">{tab === "stats" ? t("chip.battles", { count: fmtCount(totalBattles) }) : t("chip.teams", { count: fmtCount(totalTeams) })}</DkChip>
    </DkBar>
  )
}
