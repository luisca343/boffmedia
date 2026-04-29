"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SmogonSnapshot, ChampionsRegulation, LimitlessTournament } from "@/services/api/boffmedia/vgcService";
import { DEFAULT_CUTOFF } from "../_hooks/useMetaNavigation";

const VALID_CUTOFFS = [1760, 1630, 1500, 0] as const;

const SELECT_CLS =
  "h-8 rounded-md border border-surface-700 bg-surface-900 px-2.5 text-xs text-surface-100 " +
  "focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer shrink-0";

interface FormatBarProps {
  tab:                 string;
  format:              string;
  month:               string;
  cutoff:              number;
  regulation:          string;
  tournamentId:        string;
  snapshots:           SmogonSnapshot[];
  regulations:         ChampionsRegulation[];
  tournaments:         LimitlessTournament[];
  formatLabels:        Record<string, string>;
  onTabChange:         (tab: string) => void;
  onFormatChange:      (format: string, month: string, cutoff: number) => void;
  onOptionsApply:      (month: string, cutoff: number) => void;
  onRegulationChange:  (regulationId: string) => void;
  onTournamentChange:  (tournamentId: string) => void;
}

export function FormatBar({
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
  onTabChange,
  onFormatChange,
  onOptionsApply,
  onRegulationChange,
  onTournamentChange,
}: FormatBarProps) {
  const t = useTranslations("vgc.meta");

  const sortedRegulations = useMemo(
    () => [...regulations].sort((a, b) => b.id.localeCompare(a.id)),
    [regulations],
  );

  const previewRegulations = useMemo(
    () => sortedRegulations.filter((r) => Boolean(r.vgcPastesGid)),
    [sortedRegulations],
  );

  const regulationNameByFormatId = useMemo(
    () => new Map(sortedRegulations.map((r) => [r.formatId, r.name])),
    [sortedRegulations],
  );

  const isPreviewFormat = previewRegulations.some((r) => r.id === format);

  const uniqueFormats = useMemo(() => {
    const latestMonthByFormat = new Map<string, string>();
    for (const s of snapshots) {
      const prev = latestMonthByFormat.get(s.formatId);
      if (!prev || s.month > prev) latestMonthByFormat.set(s.formatId, s.month);
    }

    return [...latestMonthByFormat.keys()].sort((a, b) => {
      const monthA = latestMonthByFormat.get(a) ?? "";
      const monthB = latestMonthByFormat.get(b) ?? "";
      return monthB.localeCompare(monthA) || a.localeCompare(b);
    });
  }, [snapshots]);

  const availableMonths = useMemo(
    () =>
      [...new Set(snapshots.filter(s => s.formatId === format).map(s => s.month))]
        .sort()
        .reverse(),
    [snapshots, format],
  );

  const handleFormatSelect = (value: string) => {
    const snap = snapshots.find(s => s.formatId === value);
    if (snap) onFormatChange(snap.formatId, snap.month, snap.cutoff);
    else      onFormatChange(value, "", DEFAULT_CUTOFF);
  };

  return (
    <div className="shrink-0 h-12 flex items-center gap-2 px-3 bg-surface-950 border-b border-surface-800">
      {/* Tab toggle — Stats | Tournament */}
      <div className="flex gap-1 shrink-0 border border-surface-700 rounded-lg p-0.5">
        {(["stats", "tournament"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => onTabChange(t2)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
              tab === t2
                ? "bg-primary-500/20 text-primary-300"
                : "text-surface-400 hover:text-surface-200"
            )}
          >
            {t(`tabs.${t2}`)}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-surface-800 shrink-0" />

      {tab === "stats" ? (
        <>
          {/* Unified format select — Smogon + Preview in optgroups */}
          {(uniqueFormats.length > 0 || previewRegulations.length > 0) && (
            <select
              value={format}
              onChange={e => handleFormatSelect(e.target.value)}
              className={SELECT_CLS}
            >
              {previewRegulations.length > 0 && (
                <optgroup label="Champions · Preview">
                  {previewRegulations.map(reg => (
                    <option key={reg.id} value={reg.id}>{reg.name}</option>
                  ))}
                </optgroup>
              )}
              {uniqueFormats.length > 0 && (
                <optgroup label="Smogon">
                  {uniqueFormats.map(fmtId => (
                    <option key={fmtId} value={fmtId}>
                      {regulationNameByFormatId.get(fmtId) ?? formatLabels[fmtId] ?? fmtId}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}

          {/* Month + cutoff selects — only for Smogon formats */}
          {!isPreviewFormat && uniqueFormats.length > 0 && (
            <>
              <div className="w-px h-5 bg-surface-800 shrink-0" />

              <select
                value={month}
                onChange={e => onOptionsApply(e.target.value, cutoff)}
                className={SELECT_CLS}
              >
                <option value="">{t("pickers.monthPlaceholder")}</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={cutoff}
                onChange={e => onOptionsApply(month, Number(e.target.value))}
                className={SELECT_CLS}
              >
                {VALID_CUTOFFS.map(c => (
                  <option key={c} value={c}>
                    {c === 0 ? "All ELO" : `${c}+ ELO`}
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      ) : (
        <>
          {/* Regulation select */}
          {sortedRegulations.length > 0 && (
            <select
              value={regulation}
              onChange={e => onRegulationChange(e.target.value)}
              className={SELECT_CLS}
            >
              {sortedRegulations.map(reg => (
                <option key={reg.id} value={reg.id}>{reg.name}</option>
              ))}
            </select>
          )}

          {sortedRegulations.length > 0 && <div className="w-px h-5 bg-surface-800 shrink-0" />}

          {/* Tournament select — Combined + individual */}
          <select
            value={tournamentId || "combined"}
            onChange={e => onTournamentChange(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="combined">{t("tabs.combined")}</option>
            {[...tournaments]
              .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
              .map(t2 => (
                <option key={t2.id} value={String(t2.id)}>
                  {t2.name ?? t2.limitlessId}{t2.date ? ` — ${t2.date}` : ""}
                </option>
              ))}
          </select>
        </>
      )}
    </div>
  );
}
