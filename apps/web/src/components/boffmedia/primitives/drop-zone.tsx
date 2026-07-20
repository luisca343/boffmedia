"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Icon, type IconName } from "./icon"

/** The loaded file, already formatted for display — the caller owns the units. */
export interface DropZoneFile {
  name: string
  /** Human-readable size, e.g. "1.2 MB". */
  size: string
  /** Free-form second line next to the size, e.g. dimensions. */
  meta?: string
}

export interface DropZoneProps {
  file?: DropZoneFile | null
  /** Headline in the empty state. */
  label: string
  /** Mono sub-line in the empty state, typically the accepted extensions. */
  hint?: string
  /** Badge text once a file is loaded. */
  loadedLabel: string
  /** Icon for the loaded row. */
  loadedIcon?: IconName
  /** Opens the caller's file dialog — also fired on drop. */
  onPick: () => void
  className?: string
}

/**
 * File drop target: empty / dragging / loaded. Dropping calls `onPick` rather
 * than reading the dropped file, so the caller keeps a single intake path.
 */
export function DropZone({
  file,
  label,
  hint,
  loadedLabel,
  loadedIcon = "cube",
  onPick,
  className,
}: DropZoneProps) {
  const [over, setOver] = React.useState(false)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onPick()
    }
  }

  if (file) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={onKeyDown}
        className={cn(
          "flex flex-row items-center gap-2.5 text-left cursor-pointer p-3 bg-panel border border-solid",
          "border-[color-mix(in_srgb,var(--ok)_40%,var(--line))]",
          className,
        )}
      >
        <Icon name={loadedIcon} size={20} className="text-ok shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12.5px] text-txt font-semibold truncate">{file.name}</div>
          <div className="font-mono text-[10.5px] text-txt-dim">
            {file.size}
            {file.meta ? ` · ${file.meta}` : ""}
          </div>
        </div>
        <Badge tone="ok">{loadedLabel}</Badge>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={onKeyDown}
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
        "flex flex-col items-center gap-1.5 text-center cursor-pointer py-5 px-3.5 bg-panel border border-dashed",
        "transition-[border-color,background] duration-[140ms]",
        over ? "border-accent bg-accent-soft" : "border-line-2 hover:border-accent hover:bg-accent-soft",
        className,
      )}
    >
      <Icon name="upload" size={22} className={over ? "text-accent-bright" : "text-txt-dim"} />
      <div className="text-[14px] font-semibold text-txt">{label}</div>
      {hint ? (
        <div className="font-mono text-[10.5px] tracking-[0.04em] text-txt-dim">{hint}</div>
      ) : null}
    </div>
  )
}
