"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { SchIcon } from "./sch-icon"

export type BulkAction = "skip" | "remap" | "air"

export interface BulkNsGroup {
  namespace: string
  entries: unknown[]
  remap: number
}

export interface BulkRulesSheetProps {
  open: boolean
  groups: BulkNsGroup[]
  onClose: () => void
  onApply: (actions: Record<string, BulkAction>) => void
}

// Side panel to resolve missing blocks by namespace in one pass. Each group
// offers Skip / Remap / → Air with a live preview of how many it would resolve.
export function BulkRulesSheet({ open, groups, onClose, onApply }: BulkRulesSheetProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  const acts: [BulkAction, string][] = [
    ["skip", t("diff.bulkAction.skip")],
    ["remap", t("diff.bulkAction.remap")],
    ["air", t("diff.bulkAction.air")],
  ]
  const [actions, setActions] = useState<Record<string, BulkAction>>({})

  useEffect(() => {
    if (!open) setActions({})
  }, [open])

  if (!open) return null

  const set = (ns: string, a: BulkAction) => setActions((p) => ({ ...p, [ns]: a }))
  const canApply = Object.values(actions).some((a) => a && a !== "skip")

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-[color-mix(in_srgb,var(--bg)_60%,rgba(0,0,0,0.6))] backdrop-blur-[6px] animate-[k-fade_0.2s_var(--ease)]"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-[min(400px,92vw)] h-full flex flex-col border-l border-edge-strong",
          "bg-[color-mix(in_srgb,var(--layer-1)_92%,transparent)] backdrop-blur-[18px]",
          "shadow-[-20px_0_60px_-20px_var(--shadow-color)] animate-[k-toast-in_0.3s_var(--ease)]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-[1.2rem_1.3rem_1rem] border-b border-edge">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("diff.close")}
            className="absolute top-4 right-4 bg-transparent border-0 text-ink-dim cursor-pointer p-[0.3rem] rounded-[var(--radius)] hover:text-ink hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
          >
            <SchIcon name="x" size={16} />
          </button>
          <h3 className="text-[length:var(--t-lg)]">{t("diff.bulkRulesTitle")}</h3>
          <p className="text-[length:var(--t-xs)] text-ink-dim mt-[0.3rem]">
            {t("diff.bulkRulesDesc")}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {groups.map((g) => {
            const a = actions[g.namespace] || "skip"
            const wouldResolve = a === "air" ? g.entries.length : a === "remap" ? g.remap : 0
            return (
              <div key={g.namespace} className="p-[0.85rem_1.3rem] border-b border-edge">
                <div className="flex items-center justify-between mb-[0.55rem]">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[length:var(--t-xs)] font-bold text-ink">{g.namespace}</span>
                    <span className="font-mono text-[10px] py-[0.05rem] px-[0.4rem] rounded-[var(--radius-pill)] bg-layer-3 text-ink-muted">
                      {g.entries.length}
                    </span>
                  </span>
                  {a !== "skip" && wouldResolve > 0 ? (
                    <span className="inline-flex items-center gap-[0.25rem] text-[10px] font-semibold text-[color:var(--emerald-400)]">
                      <SchIcon name="check" size={11} stroke={2.6} />
                      {t("diff.bulkWouldResolve", { count: wouldResolve })}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-[0.4rem]">
                  {acts.map(([k, lbl]) => {
                    const disabled = k === "remap" && g.remap === 0
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={disabled}
                        onClick={() => set(g.namespace, k)}
                        className={cn(
                          "flex-1 py-[0.4rem] px-[0.3rem] rounded-[var(--radius)] border text-[11px] font-semibold cursor-pointer",
                          "transition-all duration-[var(--dur)] ease-[var(--ease)] disabled:opacity-40 disabled:cursor-not-allowed",
                          a === k
                            ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)] text-[color:var(--accent-bright)]"
                            : "border-edge-strong text-ink-muted enabled:hover:bg-layer-2 enabled:hover:text-ink",
                        )}
                      >
                        {lbl}
                        {k === "remap" && g.remap > 0 ? ` (${g.remap})` : ""}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-[0.6rem] p-[0.85rem_1.3rem] border-t border-edge">
          <BoffButton variant="ghost" size="sm" onClick={onClose}>
            {t("diff.bulkCancel")}
          </BoffButton>
          <BoffButton variant="accent" size="sm" disabled={!canApply} onClick={() => onApply(actions)}>
            {t("diff.bulkApply")}
          </BoffButton>
        </div>
      </div>
    </div>
  )
}
