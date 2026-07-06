"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { SchIcon } from "./sch-icon"
import { AssetThumb } from "./asset-thumb"
import { ReplaceSelect } from "./replace-select"
import { STATUS_META, type SchDiffEntry, type ThumbRenderer } from "./lib"

export interface MappingCardProps {
  entry: SchDiffEntry
  options: string[]
  resolution?: string
  onResolve: (blockId: string, target: string) => void
  selected?: boolean
  onSelect?: () => void
  renderThumb?: ThumbRenderer
}

// Verbose mapping card for renamed / state-changed rows: adds the target thumb,
// the automatic rule, instance count and state chips (incompatible flagged red).
export function MappingCard({ entry, options, resolution, onResolve, selected, onSelect, renderThumb }: MappingCardProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  const meta = STATUS_META[entry.status]
  const auto = entry.autoCandidate
  const effective = resolution || auto
  // Every non-compatible block can be overridden — renamed / state-changed carry
  // an automatic pick to override, missing / mod-only need one chosen outright.
  const replaceable = entry.status !== "safe"
  const isModOnly = entry.status === "mod-only"
  const stateKeys = Object.keys(entry.block.states || {})
  const thumb = (id: string, size: number, ring?: typeof meta.ring) =>
    renderThumb?.(id, size, ring) ?? <AssetThumb id={id} size={size} ring={ring} />

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      className={cn(
        "p-[0.6rem] rounded-[var(--radius)] border cursor-pointer",
        "transition-[background,border-color] duration-[var(--dur)] ease-[var(--ease)]",
        selected
          ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)]"
          : "border-edge bg-[color-mix(in_srgb,var(--layer-2)_45%,transparent)] hover:bg-layer-2",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-[0.6rem]">
          {thumb(entry.block.id, 42, meta.ring)}
          {effective ? (
            <div className="flex items-center gap-1.5 self-center shrink-0">
              <SchIcon name="arrow" size={16} className="text-ink-dim" />
              {thumb(effective, 34)}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[0.4rem]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
              <span className="font-mono text-[length:var(--t-xs)] text-ink truncate">{entry.block.id}</span>
              {isModOnly ? (
                <span className="shrink-0 py-[0.1rem] px-[0.4rem] rounded-[var(--radius-pill)] font-mono text-[9px] font-bold tracking-[0.08em] uppercase bg-[color-mix(in_srgb,var(--rose-500)_12%,transparent)] text-[color:var(--rose-400)] border border-[color-mix(in_srgb,var(--rose-500)_35%,transparent)]">
                  mod
                </span>
              ) : null}
            </div>
            {effective ? (
              <div
                className={cn(
                  "font-mono text-[11px] pl-[0.65rem] truncate",
                  resolution ? "text-[color:var(--accent-bright)]" : "text-[color:color-mix(in_srgb,var(--emerald-400)_90%,var(--text))]",
                )}
              >
                → {effective}
                {resolution ? " · " + t("diff.manual") : ""}
              </div>
            ) : null}
            <div className="pl-[0.65rem] text-[11px] text-ink-dim">{t("diff.instances", { count: entry.instanceCount })}</div>
            {stateKeys.length > 0 ? (
              <div className="flex flex-wrap gap-[0.3rem] pl-[0.65rem] mt-[0.35rem]">
                {stateKeys.map((k) => {
                  const bad = entry.incompatibleStates?.includes(k)
                  return (
                    <span
                      key={k}
                      className={cn(
                        "py-[0.1rem] px-[0.4rem] rounded-[4px] font-mono text-[10px]",
                        bad
                          ? "bg-[color-mix(in_srgb,var(--rose-500)_16%,transparent)] text-[color:var(--rose-400)]"
                          : "bg-layer-3 text-ink-muted",
                      )}
                    >
                      {k}={String(entry.block.states?.[k])}
                    </span>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Full-width replace row — never squeezed by the thumbnails on the left. */}
        {replaceable ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-dim shrink-0">{t("diff.replace")}</span>
            <ReplaceSelect
              fluid
              value={resolution}
              placeholder={auto || t("diff.choose")}
              options={options}
              onChange={(v) => onResolve(entry.block.id, v)}
              renderThumb={renderThumb}
            />
            {resolution ? (
              <button
                type="button"
                onClick={() => onResolve(entry.block.id, "")}
                className="bg-transparent border-0 text-ink-dim text-[10px] cursor-pointer underline underline-offset-2 shrink-0 hover:text-ink-muted"
              >
                {auto ? t("diff.auto") : t("diff.clear")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
