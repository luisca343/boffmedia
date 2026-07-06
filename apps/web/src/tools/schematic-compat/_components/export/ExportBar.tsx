"use client";

import { useRef } from "react";
import { ExportBar as ExportBarUI } from "@/components/boffmedia-v2/ui/schematic";
import { useToolStore } from "../../_store/tool.store";
import type { ExportFormat } from "../../_lib/pipeline/exporter";

interface ExportBarProps {
  onExport: (format: ExportFormat) => void;
  onExportRuleSet: () => void;
  onImportRuleSet: (file: File) => void;
}

export function ExportBar({ onExport, onExportRuleSet, onImportRuleSet }: ExportBarProps) {
  const schematic = useToolStore((s) => s.schematic);
  const isExporting = useToolStore((s) => s.isExporting);
  const ruleCount = useToolStore((s) => Object.keys(s.resolutions).length);
  const targetGame = useToolStore((s) => s.targetGame);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
      <ExportBarUI
        targetGame={targetGame}
        canExport={!!schematic}
        ruleCount={ruleCount}
        exporting={isExporting}
        onExport={(fmt) => onExport(fmt as ExportFormat)}
        onExportRules={onExportRuleSet}
        onImportRules={() => fileInputRef.current?.click()}
      />
    </>
  );
}
