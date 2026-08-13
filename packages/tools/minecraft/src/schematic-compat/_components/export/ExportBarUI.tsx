"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useToolT } from "../../../i18n";
import { Button } from "@boffmedia/ui";
import type { SchGame } from "../ui/sch-tokens";

const FMT_KEYS: Record<SchGame, [string, string][]> = {
  minecraft: [
    ["export.formatSchem2", "schem"],
    ["export.formatSchem3", "schem3"],
    ["export.formatLitematic", "litematic"],
    ["export.formatNbt", "nbt"],
  ],
  hytale: [["export.formatPrefab", "prefab"]],
};

/** Footer: meter · rule import/export · target-game format list · export. */
export function ExportBarUI({
  targetGame,
  canExport,
  ruleCount,
  exporting,
  onExport,
  onImportRules,
  onExportRules,
  meter,
}: {
  targetGame: SchGame;
  canExport: boolean;
  ruleCount: number;
  exporting: boolean;
  onExport: (format: string) => void;
  onImportRules?: () => void;
  onExportRules?: () => void;
  meter?: ReactNode;
}) {
  const t = useToolT("tools.schematicCompat");
  const formats = (FMT_KEYS[targetGame] || FMT_KEYS.minecraft).map(([key, val]) => [t(key), val] as [string, string]);
  const [fmt, setFmt] = useState(formats[0][1]);
  useEffect(() => {
    if (!formats.some((f) => f[1] === fmt)) setFmt(formats[0][1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetGame]);

  return (
    <footer className="shrink-0 flex items-center flex-wrap gap-3.5 py-2.5 px-4 bg-base-deep border-t-2 border-line">
      {meter}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon="upload" onClick={onImportRules}>
          {t("export.importRules")}
        </Button>
        <Button variant="ghost" size="sm" icon="download" disabled={ruleCount === 0} onClick={onExportRules}>
          {t("export.exportRules")}
          {ruleCount > 0 ? ` (${ruleCount})` : ""}
        </Button>
      </div>

      <div className="flex-1" />

      {exporting ? (
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent-bright">
          <span className="w-[13px] h-[13px] rounded-full border-2 border-line-2 border-t-accent animate-spin shrink-0" />
          {t("export.exporting")}
        </span>
      ) : null}

      <select
        value={fmt}
        disabled={exporting}
        onChange={(e) => setFmt(e.target.value)}
        aria-label={t("export.title")}
        className="h-[34px] min-w-[128px] bg-panel border border-solid border-line px-2 font-mono text-[12px] text-txt-muted cursor-pointer focus:outline-none focus:border-accent-line"
      >
        {formats.map(([lbl, v]) => (
          <option key={v} value={v}>
            {lbl}
          </option>
        ))}
      </select>

      <Button variant="pri" size="sm" icon="download" disabled={!canExport || exporting} onClick={() => onExport(fmt)}>
        {t("export.exportSchematic")}
      </Button>
    </footer>
  );
}
