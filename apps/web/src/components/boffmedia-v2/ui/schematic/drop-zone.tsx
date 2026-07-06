"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { BoffBadge } from "@/components/boffmedia-v2/primitives/badge"
import { SchIcon } from "./sch-icon"

export interface DropZoneFile {
  name: string
  size: string
  dims: string
}

export interface DropZoneProps {
  file?: DropZoneFile | null
  onPick: () => void
}

// Schematic file picker with empty / dragging / loaded states. Empty shows the
// accepted formats; loaded collapses to a row with name, size, dims and a badge.
export function DropZone({ file, onPick }: DropZoneProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  const [over, setOver] = useState(false)

  if (file) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
        className={cn(
          "flex flex-row items-stretch text-left cursor-pointer p-[1rem_0.8rem] rounded-[var(--radius)]",
          "border-[1.5px] border-solid border-[color-mix(in_srgb,var(--emerald-500)_45%,var(--border))]",
          "bg-[color-mix(in_srgb,var(--emerald-500)_7%,var(--layer-2))]",
          "transition-[border-color,background] duration-[var(--dur)] ease-[var(--ease)]",
        )}
      >
        <div className="flex items-center gap-[0.6rem] w-full">
          <SchIcon name="file" size={22} style={{ color: "var(--emerald-400)" }} />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[length:var(--t-xs)] text-ink font-semibold truncate">{file.name}</div>
            <div className="font-mono text-[10px] text-ink-muted">
              {file.size} · {file.dims}
            </div>
          </div>
          <BoffBadge kind="live" className="shrink-0">
            {t("setup.loaded")}
          </BoffBadge>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onPick()
      }}
      className={cn(
        "flex flex-col items-center gap-[0.4rem] text-center cursor-pointer p-[1rem_0.8rem] rounded-[var(--radius)]",
        "border-[1.5px] border-dashed",
        "transition-[border-color,background] duration-[var(--dur)] ease-[var(--ease)]",
        over
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-edge-strong bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]",
      )}
    >
      <SchIcon name="upload" size={22} className="text-ink-muted" />
      <div className="text-[length:var(--t-sm)] font-semibold text-ink">{t("setup.dropHere")}</div>
      <div className="font-mono text-[length:var(--t-xs)] text-ink-dim">.schem · .litematic · .nbt · .mca · .prefab</div>
    </div>
  )
}
