"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Upload, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { useToolStore } from "../../_store/tool.store";

type ExportFormat = "schem" | "schem3" | "litematic" | "nbt" | "prefab";

interface ExportBarProps {
  onExport: (format: ExportFormat) => void;
  onExportRuleSet: () => void;
  onImportRuleSet: (file: File) => void;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  schem: ".schem (v2)",
  schem3: ".schem (v3)",
  litematic: ".litematic",
  nbt: ".nbt",
  prefab: ".prefab.json",
};

const MINECRAFT_FORMATS: ExportFormat[] = ["schem", "schem3", "litematic", "nbt"];
const HYTALE_FORMATS: ExportFormat[] = ["prefab"];

export function ExportBar({ onExport, onExportRuleSet, onImportRuleSet }: ExportBarProps) {
  const t = useTranslations("games.minecraft.schematicCompat.export");
  const schematic = useToolStore((s) => s.schematic);
  const isExporting = useToolStore((s) => s.isExporting);
  const resolutionCount = useToolStore((s) => Object.keys(s.resolutions).length);
  const targetGame = useToolStore((s) => s.targetGame);
  const formats = targetGame === "hytale" ? HYTALE_FORMATS : MINECRAFT_FORMATS;
  const [format, setFormat] = useState<ExportFormat>(formats[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the selected format valid for the current target game.
  useEffect(() => {
    if (!formats.includes(format)) setFormat(formats[0]);
  }, [formats, format]);

  const canExport = !!schematic && !isExporting;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      {/* Rule pack import / export */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.ruleset.json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportRuleSet(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondaryOutline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 gap-1.5 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        {t("importRules")}
      </Button>
      <Button
        type="button"
        variant="secondaryOutline"
        size="sm"
        onClick={onExportRuleSet}
        disabled={resolutionCount === 0}
        className="h-8 gap-1.5 text-xs"
      >
        <FileDown className="h-3.5 w-3.5" />
        {t("exportRules")}
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {isExporting && (
          <span className="flex items-center gap-1.5 text-xs text-ink-dim">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("exporting")}
          </span>
        )}
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          disabled={isExporting}
          className="h-8 rounded-md border border-edge/50 bg-layer-2/50 px-2 text-xs text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40"
        >
          {formats.map((f) => (
            <option key={f} value={f}>
              {FORMAT_LABELS[f]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => onExport(format)}
          disabled={!canExport}
          className="h-8 gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          {t("exportButton")}
        </Button>
      </div>
    </div>
  );
}
