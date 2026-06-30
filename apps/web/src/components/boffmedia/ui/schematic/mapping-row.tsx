"use client"

import { cn } from "@/lib/utils"
import { AssetThumb } from "./asset-thumb"
import { ReplaceSelect } from "./replace-select"
import { STATUS_META, type SchDiffEntry, type ThumbRenderer } from "./lib"

export interface MappingRowProps {
  entry: SchDiffEntry
  options: string[]
  resolution?: string
  onResolve: (blockId: string, target: string) => void
  selected?: boolean
  onSelect?: () => void
  renderThumb?: ThumbRenderer
}

// Compact mapping line for long lists of missing / mod-only blocks: thumb,
// status dot, id, instance count and the replacement combobox.
export function MappingRow({ entry, options, resolution, onResolve, selected, onSelect, renderThumb }: MappingRowProps) {
  const meta = STATUS_META[entry.status]
  // Missing and mod-only share the same red "Ausentes" treatment; mod-only is
  // distinguished by a "mod" pill rather than a separate colour.
  const isBad = entry.status === "missing" || entry.status === "mod-only"
  const isModOnly = entry.status === "mod-only"
  const thumb = (id: string, size: number, ring?: typeof meta.ring) =>
    renderThumb?.(id, size, ring) ?? <AssetThumb id={id} size={size} ring={ring} />
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-[0.55rem] py-[0.45rem] px-[0.55rem] rounded-[var(--radius)] border cursor-pointer",
        "transition-[background,border-color] duration-[var(--dur)] ease-[var(--ease)]",
        selected
          ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
          : isBad
            ? "border-[color-mix(in_srgb,var(--rose-500)_22%,transparent)] bg-[color-mix(in_srgb,var(--rose-500)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--rose-500)_9%,transparent)]"
            : "border-edge bg-[color-mix(in_srgb,var(--layer-2)_45%,transparent)] hover:bg-layer-2",
      )}
    >
      {thumb(entry.block.id, 30, meta.ring)}
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
      <span className="flex-1 min-w-0 font-mono text-[length:var(--t-xs)] text-ink truncate">{entry.block.id}</span>
      {isModOnly ? (
        <span className="shrink-0 py-[0.1rem] px-[0.4rem] rounded-[var(--radius-pill)] font-mono text-[9px] font-bold tracking-[0.08em] uppercase bg-[color-mix(in_srgb,var(--rose-500)_12%,transparent)] text-[color:var(--rose-400)] border border-[color-mix(in_srgb,var(--rose-500)_35%,transparent)]">
          mod
        </span>
      ) : null}
      <span
        className={cn(
          "shrink-0 py-[0.1rem] px-[0.4rem] rounded-[var(--radius-pill)] font-mono text-[10px] font-semibold tabular-nums",
          isBad
            ? "bg-[color-mix(in_srgb,var(--rose-500)_14%,transparent)] text-[color:var(--rose-400)]"
            : "bg-layer-3 text-ink-muted",
        )}
      >
        ×{entry.instanceCount.toLocaleString()}
      </span>
      <ReplaceSelect
        value={resolution}
        placeholder="Reemplazar…"
        options={options}
        onChange={(v) => onResolve(entry.block.id, v)}
        renderThumb={renderThumb}
      />
      {resolution ? thumb(resolution, 30) : null}
    </div>
  )
}
