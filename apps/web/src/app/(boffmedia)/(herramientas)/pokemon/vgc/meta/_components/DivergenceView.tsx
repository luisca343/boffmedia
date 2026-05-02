"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DivergenceBadge, DivergenceResult, DivergenceRow } from "@/services/api/boffmedia/vgcService";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";

type SortKey = "ladder" | "tournament" | "delta";
type SortDir = "asc" | "desc";

interface Props {
  result:  DivergenceResult | null;
  loading: boolean;
  error:   string | null;
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ChevronsUpDown className="w-3 h-3 ml-0.5 shrink-0 text-surface-600" />;
  return dir === "desc"
    ? <ChevronDown className="w-3 h-3 ml-0.5 shrink-0 text-primary-400" />
    : <ChevronUp   className="w-3 h-3 ml-0.5 shrink-0 text-primary-400" />;
}

function BadgeChip({ badge, t }: { badge: DivergenceBadge; t: (k: string) => string }) {
  if (!badge) return null;
  const isLadder = badge === "ladder-trap";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border",
        isLadder
          ? "border-amber-500/30 text-amber-300 bg-amber-500/15"
          : "border-blue-500/30 text-blue-300 bg-blue-500/15",
      )}
      title={t(isLadder ? "badges.ladderTrapTitle" : "badges.tournamentStapleTitle")}
    >
      {t(isLadder ? "badges.ladderTrap" : "badges.tournamentStaple")}
    </span>
  );
}

export function DivergenceView({ result, loading, error }: Props) {
  const t = useTranslations("vgc.meta.divergence");
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    if (!result?.rows) return [];
    return [...result.rows].sort((a, b) => {
      const sign = sortDir === "desc" ? -1 : 1;
      if (sortKey === "ladder")     return sign * (a.ladderPercent - b.ladderPercent);
      if (sortKey === "tournament") return sign * (a.tournamentPercent - b.tournamentPercent);
      return sign * (a.absDeltaPercent - b.absDeltaPercent);
    });
  }, [result, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("selectTournament")}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("empty")}
      </div>
    );
  }

  const cutoffLabel = result.ladderCutoff === 0 ? t("allElo") : `${result.ladderCutoff}+ ELO`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Info strip */}
      <div className="shrink-0 px-4 py-1.5 border-b border-surface-700 flex items-center gap-2 text-xs text-surface-400">
        <span className="text-surface-500">Smogon</span>
        <span>{result.ladderFormat}</span>
        <span className="text-surface-700">·</span>
        <span>{result.ladderMonth}</span>
        <span className="text-surface-700">·</span>
        <span>{cutoffLabel}</span>
        <span className="ml-auto text-surface-500">{t("rowCount", { count: result.rowCount })}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-surface-900 z-10">
            <tr className="border-b border-surface-700 text-left text-surface-400 text-xs uppercase tracking-wide">
              <th className="py-2 px-3 w-8 font-medium">#</th>
              <th className="py-2 px-3 font-medium">{t("col.pokemon")}</th>
              <th
                className="py-2 px-3 w-24 font-medium cursor-pointer hover:text-surface-100 select-none"
                onClick={() => handleSort("ladder")}
              >
                <span className="flex items-center">
                  {t("col.ladder")}
                  <SortIcon col="ladder" active={sortKey} dir={sortDir} />
                </span>
              </th>
              <th
                className="py-2 px-3 w-24 font-medium cursor-pointer hover:text-surface-100 select-none"
                onClick={() => handleSort("tournament")}
              >
                <span className="flex items-center">
                  {t("col.tournament")}
                  <SortIcon col="tournament" active={sortKey} dir={sortDir} />
                </span>
              </th>
              <th
                className="py-2 px-3 w-16 font-medium cursor-pointer hover:text-surface-100 select-none"
                onClick={() => handleSort("delta")}
              >
                <span className="flex items-center">
                  {t("col.delta")}
                  <SortIcon col="delta" active={sortKey} dir={sortDir} />
                </span>
              </th>
              <th className="py-2 px-3 w-40 font-medium">{t("col.badge")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <DivergenceTableRow key={row.speciesId} row={row} rank={idx + 1} t={t as (k: string) => string} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DivergenceTableRow({
  row,
  rank,
  t,
}: {
  row:  DivergenceRow;
  rank: number;
  t:    (key: string) => string;
}) {
  const positive = row.deltaPercent > 0;

  return (
    <tr className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
      <td className="py-2 px-3 text-surface-500 font-mono text-xs">{rank}</td>

      <td className="py-2 px-3">
        <span className="flex items-center gap-2">
          <img
            src={spriteUrl(row.speciesName)}
            alt={row.speciesName}
            width={36}
            height={36}
            className="object-contain shrink-0"
            onError={handleSpriteError}
          />
          <span className="text-surface-100 font-medium text-xs">{row.speciesName}</span>
        </span>
      </td>

      <td className="py-2 px-3 text-surface-300 text-xs tabular-nums">
        {row.ladderPercent.toFixed(2)}%
      </td>

      <td className="py-2 px-3 text-surface-300 text-xs tabular-nums">
        {row.tournamentPercent.toFixed(2)}%
      </td>

      <td className={cn(
        "py-2 px-3 text-xs font-semibold tabular-nums",
        positive ? "text-amber-400" : "text-blue-400",
      )}>
        {positive ? "+" : ""}{row.deltaPercent.toFixed(2)}%
      </td>

      <td className="py-2 px-3">
        <BadgeChip badge={row.badge} t={t} />
      </td>
    </tr>
  );
}
