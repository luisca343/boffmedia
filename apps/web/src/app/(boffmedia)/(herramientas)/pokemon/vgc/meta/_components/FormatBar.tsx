"use client";

import { useMemo, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SmogonSnapshot } from "@/services/api/boffmedia/vgcService";

const VALID_CUTOFFS = [1760, 1630, 1500, 0] as const;

interface FormatBarProps {
  format:         string;
  month:          string;
  cutoff:         number;
  snapshots:      SmogonSnapshot[];
  formatLabels:   Record<string, string>;
  onFormatChange: (format: string, month: string, cutoff: number) => void;
  onOptionsApply: (month: string, cutoff: number) => void;
}

export function FormatBar({
  format,
  month,
  cutoff,
  snapshots,
  formatLabels,
  onFormatChange,
  onOptionsApply,
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
    [snapshots, format]
  );

  // Cutoffs are always the full valid set — API returns an error if not yet imported
  const availableCutoffs = VALID_CUTOFFS;

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

            {/* Month select derived from snapshots */}
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

            {/* Cutoff select derived from snapshots */}
            <div className="space-y-1 mb-4">
              <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
                {t("pickers.cutoff")}
              </label>
              <select
                value={localCutoff}
                onChange={(e) => setLocalCutoff(Number(e.target.value))}
                className="w-full h-8 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {availableCutoffs.map((c) => (
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
    </div>
  );
}
