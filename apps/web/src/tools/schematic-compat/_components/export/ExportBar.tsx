"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ExportBarUI } from "./ExportBarUI";
import { CompatMeter } from "./CompatMeter";
import { selectEnv, useToolStore } from "../../_store/tool.store";
import type { CompatDiff } from "@/lib/schematic/types";
import type { ExportFormat } from "@/lib/schematic/types";

interface ExportBarProps {
  onExport: (format: ExportFormat) => void;
  onExportRuleSet: () => void;
  onImportRuleSet: (file: File) => void;
}

/**
 * Readiness = entries that will land resolved on export: `safe` (unchanged),
 * anything with a manual resolution, and renamed / state-changed blocks (they
 * carry an automatic candidate the exporter applies). Mirrors the export
 * resolution map in useToolActions.
 */
function readiness(diff: CompatDiff | undefined, resolutions: Record<string, unknown>) {
  if (!diff) return { resolved: 0, total: 0, blocked: 0 };
  let resolved = 0;
  for (const e of diff.entries) {
    if (e.status === "safe" || resolutions[e.block.id] || e.autoCandidate) resolved++;
  }
  return { resolved, total: diff.entries.length, blocked: diff.entries.length - resolved };
}

export function ExportBar({ onExport, onExportRuleSet, onImportRuleSet }: ExportBarProps) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const schematic = useToolStore((s) => s.schematic);
  const isExporting = useToolStore((s) => s.isExporting);
  const resolutions = useToolStore((s) => s.resolutions);
  const diff = useToolStore((s) => s.diff);
  const ruleCount = Object.keys(resolutions).length;
  const targetGame = useToolStore(selectEnv("target")).game;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { resolved, total, blocked } = readiness(diff, resolutions);

  // Unresolved blocks don't stop an export — they're written as-is (same game)
  // or dropped to air (cross-game, see stripForeignBlocks). Both are silent data
  // loss, so confirm rather than let it happen unannounced.
  const handleExport = (fmt: ExportFormat) => {
    if (blocked > 0 && !window.confirm(t("export.blockedWarning", { count: blocked }))) return;
    onExport(fmt);
  };

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
        onExport={(fmt) => handleExport(fmt as ExportFormat)}
        onExportRules={onExportRuleSet}
        onImportRules={() => fileInputRef.current?.click()}
        meter={diff ? <CompatMeter resolved={resolved} total={total} blocked={blocked} /> : undefined}
      />
    </>
  );
}
