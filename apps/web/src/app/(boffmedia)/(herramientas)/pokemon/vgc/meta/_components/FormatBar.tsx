"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SmogonSnapshot, ChampionsRegulation, LimitlessTournament } from "@/services/api/boffmedia/vgcService";
import { DEFAULT_CUTOFF } from "../_hooks/useMetaNavigation";
import { ENABLE_PREVIEW_FORMATS } from "../constants";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
} from "@/components/ui/primitives/select";

const VALID_CUTOFFS = [1760, 1630, 1500, 0] as const;

const TRIGGER_CLS = "h-8 w-auto min-w-[8.75rem] sm:min-w-[10.5rem] text-xs px-2.5 shrink-0 ring-offset-surface-900 bg-surface-800/75 border-surface-700/80 text-surface-100 hover:bg-surface-800 focus:border-primary-400 focus:ring-primary-400/30";

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
    () => (ENABLE_PREVIEW_FORMATS ? sortedRegulations.filter((r) => Boolean(r.vgcPastesGid)) : []),
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
    <div className="shrink-0 px-3 py-2 bg-gradient-to-r from-surface-900 via-surface-900 to-surface-800/85 border-b border-surface-700 shadow-sm">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-surface-700/70 scrollbar-track-transparent">
        <div className="min-w-max flex items-center gap-2 pr-1">
          {/* Tab toggle — Stats | Tournament */}
          <div className="flex gap-1 shrink-0 rounded-xl border border-surface-700/80 bg-surface-800/70 p-1">
            {(["stats", "tournament"] as const).map((t2) => (
              <button
                key={t2}
                onClick={() => onTabChange(t2)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  tab === t2
                    ? "bg-primary-500/20 text-primary-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                    : "text-surface-400 hover:text-surface-100 hover:bg-surface-700/40"
                )}
              >
                {t(`tabs.${t2}`)}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-surface-700/90 shrink-0" />

          {tab === "stats" ? (
            <>
          {/* Unified format select — Smogon + Preview in groups */}
          {(uniqueFormats.length > 0 || previewRegulations.length > 0) && (
            <Select value={format} onValueChange={handleFormatSelect}>
              <SelectTrigger className={TRIGGER_CLS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uniqueFormats.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Smogon</SelectLabel>
                    {uniqueFormats.map(fmtId => (
                      <SelectItem key={fmtId} value={fmtId} className="text-xs">
                        {regulationNameByFormatId.get(fmtId) ?? formatLabels[fmtId] ?? fmtId}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {previewRegulations.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Champions · Preview</SelectLabel>
                    {previewRegulations.map(reg => (
                      <SelectItem key={reg.id} value={reg.id} className="text-xs">
                        {reg.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          )}

          {/* Month + cutoff selects — only for Smogon formats */}
          {!isPreviewFormat && uniqueFormats.length > 0 && (
            <>
              <div className="w-px h-5 bg-surface-700 shrink-0" />

              {/* Month select — "__all__" sentinel maps to empty string */}
              <Select
                value={month || "__all__"}
                onValueChange={(val) => onOptionsApply(val === "__all__" ? "" : val, cutoff)}
              >
                <SelectTrigger className={`${TRIGGER_CLS} min-w-[7.25rem] sm:min-w-[8.5rem]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">
                    {t("pickers.monthPlaceholder")}
                  </SelectItem>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(cutoff)}
                onValueChange={(val) => onOptionsApply(month, Number(val))}
              >
                <SelectTrigger className={`${TRIGGER_CLS} min-w-[6.5rem] sm:min-w-[7.5rem]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_CUTOFFS.map(c => (
                    <SelectItem key={c} value={String(c)} className="text-xs">
                      {c === 0 ? "All ELO" : `${c}+ ELO`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
            </>
          ) : (
            <>
          {/* Regulation select */}
          {sortedRegulations.length > 0 && (
            <Select value={regulation} onValueChange={onRegulationChange}>
              <SelectTrigger className={TRIGGER_CLS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedRegulations.map(reg => (
                  <SelectItem key={reg.id} value={reg.id} className="text-xs">
                    {reg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {sortedRegulations.length > 0 && <div className="w-px h-5 bg-surface-700/90 shrink-0" />}

          {/* Tournament select — Combined + individual */}
          <Select
            value={tournamentId || "combined"}
            onValueChange={onTournamentChange}
          >
            <SelectTrigger className={`${TRIGGER_CLS} min-w-[13rem] sm:min-w-[16rem]`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combined" className="text-xs">
                {t("tabs.combined")}
              </SelectItem>
              {[...tournaments]
                .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
                .map(t2 => (
                  <SelectItem key={t2.id} value={String(t2.id)} className="text-xs">
                    {t2.name ?? t2.limitlessId}{t2.date ? ` — ${t2.date.slice(0, 10)}` : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
