"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { BoffButton } from "@/components/boffmedia-v2/primitives/button"
import { SchIcon } from "./sch-icon"
import type { SchGame } from "./lib"

const FMT: Record<SchGame, [string, string][]> = {
  minecraft: [
    [".schem (v2)", "schem"],
    [".schem (v3)", "schem3"],
    [".litematic", "litematic"],
    [".nbt", "nbt"],
  ],
  hytale: [[".prefab.json", "prefab"]],
}

export interface ExportBarProps {
  targetGame: SchGame
  canExport: boolean
  ruleCount: number
  exporting: boolean
  onExport: (format: string) => void
  onImportRules?: () => void
  onExportRules?: () => void
}

// Footer export bar: import / export the rule pack on the left, a format select
// (changes by target game) and the export button on the right, with a busy state.
export function ExportBar({
  targetGame,
  canExport,
  ruleCount,
  exporting,
  onExport,
  onImportRules,
  onExportRules,
}: ExportBarProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  const formats = FMT[targetGame] || FMT.minecraft
  const [fmt, setFmt] = useState(formats[0][1])

  useEffect(() => {
    if (!formats.some((f) => f[1] === fmt)) setFmt(formats[0][1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetGame])

  return (
    <footer className="shrink-0 flex items-center gap-[0.6rem] py-[0.6rem] px-4 border-t border-edge bg-[color-mix(in_srgb,var(--layer-1)_60%,transparent)]">
      <BoffButton variant="ghost" size="sm" onClick={onImportRules}>
        <SchIcon name="upload" size={16} />
        {t("export.importRules")}
      </BoffButton>
      <BoffButton variant="ghost" size="sm" disabled={ruleCount === 0} onClick={onExportRules}>
        <SchIcon name="filedown" size={16} />
        {t("export.exportRules")} {ruleCount > 0 ? `(${ruleCount})` : ""}
      </BoffButton>

      <div className="ml-auto" />

      {exporting ? (
        <span className="inline-flex items-center gap-[0.4rem] text-[length:var(--t-xs)] text-ink-dim">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[color-mix(in_srgb,currentColor_30%,transparent)] border-t-current animate-spin shrink-0" />
          {t("export.exporting")}
        </span>
      ) : null}

      <select
        value={fmt}
        disabled={exporting}
        onChange={(e) => setFmt(e.target.value)}
        className="h-8 bg-layer-2 border border-edge-strong rounded-[var(--radius)] px-2 font-mono text-[length:var(--t-xs)] text-ink-muted cursor-pointer focus:outline-none focus:border-[var(--accent)]"
      >
        {formats.map(([lbl, v]) => (
          <option key={v} value={v}>
            {lbl}
          </option>
        ))}
      </select>

      <BoffButton variant="accent" size="sm" disabled={!canExport || exporting} onClick={() => onExport(fmt)}>
        <SchIcon name="download" size={16} />
        {t("export.exportSchematic")}
      </BoffButton>
    </footer>
  )
}
