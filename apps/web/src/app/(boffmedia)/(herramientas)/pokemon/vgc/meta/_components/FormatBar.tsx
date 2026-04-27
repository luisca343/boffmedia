"use client";

import { useMemo, useRef, useState } from "react";
import { Settings2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SmogonSnapshot, ChampionsRegulation, VgcMetaService } from "@/services/api/boffmedia/vgcService";

const VALID_CUTOFFS = [1760, 1630, 1500, 0] as const;

function RefreshButton({ regulation }: { regulation: string }) {
  const t = useTranslations("vgc.meta");
  const [spinning, setSpinning] = useState(false);

  if (!regulation) return null;

  const handleRefresh = async () => {
    setSpinning(true);
    try {
      await VgcMetaService.refreshChampions(regulation);
      window.location.reload();
    } finally {
      setSpinning(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={spinning}
      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-700 text-xs font-medium text-surface-400 hover:border-surface-500 hover:text-surface-200 transition-colors shrink-0 disabled:opacity-50"
    >
      <RefreshCw className={cn("w-3.5 h-3.5", spinning && "animate-spin")} />
      {t("refresh")}
    </button>
  );
}

interface FormatBarProps {
  tab:                string;
  format:             string;
  month:              string;
  cutoff:             number;
  regulation:         string;
  snapshots:          SmogonSnapshot[];
  regulations:        ChampionsRegulation[];
  formatLabels:       Record<string, string>;
  onTabChange:        (tab: string) => void;
  onFormatChange:     (format: string, month: string, cutoff: number) => void;
  onOptionsApply:     (month: string, cutoff: number) => void;
  onRegulationChange: (regulationId: string) => void;
}

export function FormatBar({
  tab,
  format,
  month,
  cutoff,
  regulation,
  snapshots,
  regulations,
  formatLabels,
  onTabChange,
  onFormatChange,
  onOptionsApply,
  onRegulationChange,
}: FormatBarProps) {
  const t = useTranslations("vgc.meta");

  const [open,        setOpen]        = useState(false);
  const [localMonth,  setLocalMonth]  = useState(month);
  const [localCutoff, setLocalCutoff] = useState(cutoff);
  const [panelStyle,  setPanelStyle]  = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonWrapRef = useRef<HTMLDivElement>(null);

  const uniqueFormats = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of snapshots) {
      if (!seen.has(s.formatId)) { seen.add(s.formatId); result.push(s.formatId); }
    }
    return result;
  }, [snapshots]);

  const availableMonths = useMemo(
    () =>
      [...new Set(snapshots.filter((s) => s.formatId === format).map((s) => s.month))]
        .sort()
        .reverse(),
    [snapshots, format],
  );

  const handleFormatClick = (fmtId: string) => {
    const snap = snapshots.find((s) => s.formatId === fmtId);
    if (snap) onFormatChange(snap.formatId, snap.month, snap.cutoff);
  };

  const handleToggle = () => {
    if (!open && buttonWrapRef.current) {
      const rect = buttonWrapRef.current.getBoundingClientRect();
      setPanelStyle({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setLocalMonth(month);
    setLocalCutoff(cutoff);
    setOpen((v) => !v);
  };

  const handleApply = () => {
    onOptionsApply(localMonth, localCutoff);
    setOpen(false);
  };

  return (
    <div className="shrink-0 h-12 flex items-center gap-2 px-3 bg-surface-950 border-b border-surface-800 overflow-x-auto">
      {/* Tab toggle */}
      <div className="flex gap-1 shrink-0 border border-surface-700 rounded-lg p-0.5">
        {(["ladder", "champions"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => onTabChange(t2)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
              tab === t2
                ? "bg-primary-500/20 text-primary-300"
                : "text-surface-400 hover:text-surface-200"
            )}
          >
            {t(`tabs.${t2}`)}
            {t2 === "champions" && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 leading-none">
                {t("tabs.previewBadge")}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-surface-800 shrink-0" />

      {tab === "ladder" ? (
        <>
          {/* Format pills */}
          <div className="flex gap-1 shrink-0">
            {uniqueFormats.map((fmtId) => (
              <button
                key={fmtId}
                onClick={() => handleFormatClick(fmtId)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                  format === fmtId
                    ? "bg-primary-500/20 border-primary-500/60 text-primary-300"
                    : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
                )}
              >
                {formatLabels[fmtId] ?? fmtId}
              </button>
            ))}
          </div>

          {/* Options button */}
          <div ref={buttonWrapRef} className="relative ml-auto shrink-0">
            <button
              onClick={handleToggle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                open
                  ? "border-primary-500/60 text-primary-300 bg-primary-500/10"
                  : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              {t("options")}
              {(month || cutoff !== 1760) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              )}
            </button>
          </div>

          {/* Options panel — fixed so it escapes overflow-auto ancestors */}
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div
                className="fixed z-50 bg-surface-900 border border-surface-700 rounded-xl p-4 w-60 shadow-2xl"
                style={{ top: panelStyle.top, right: panelStyle.right }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 mb-3">
                  {t("options")}
                </p>

                <div className="space-y-1 mb-3">
                  <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
                    {t("pickers.month")}
                  </label>
                  <select
                    value={localMonth}
                    onChange={(e) => setLocalMonth(e.target.value)}
                    className="w-full h-8 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 mb-4">
                  <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
                    {t("pickers.cutoff")}
                  </label>
                  <select
                    value={localCutoff}
                    onChange={(e) => setLocalCutoff(Number(e.target.value))}
                    className="w-full h-8 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {VALID_CUTOFFS.map((c) => (
                      <option key={c} value={c}>
                        {c === 0 ? "0 (all)" : `${c}+`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full py-2 rounded-lg bg-primary-500/20 border border-primary-500/40 text-primary-300 text-sm font-medium hover:bg-primary-500/30 transition-colors"
                >
                  {t("pickers.load")}
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        /* Champions regulation pills + refresh */
        <>
          <div className="flex gap-1 shrink-0">
            {regulations.map((reg) => (
              <button
                key={reg.id}
                onClick={() => onRegulationChange(reg.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                  regulation === reg.id
                    ? "bg-primary-500/20 border-primary-500/60 text-primary-300"
                    : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
                )}
              >
                {reg.name}
              </button>
            ))}
          </div>
          <RefreshButton regulation={regulation} />
        </>
      )}
    </div>
  );
}
