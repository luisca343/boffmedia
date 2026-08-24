import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"

/** Tones a header metric can carry. `used` dims the icon without recolouring the
 *  value — it marks a count that is spent (delivered keys), not a good/bad one. */
export type StatChipTone = "ok" | "accent" | "used" | "bad"

// Each tone sets `--cut-line` alongside its border colour: the slanted edges are
// painted geometry, not a CSS border, so a tone that only swaps `border-*` leaves
// the two diagonals at the default `--line` and the pill reads half-outlined.
// (All four hand-rolled copies had exactly that defect.)
const TONE_BORDER: Record<StatChipTone, string> = {
  ok: "border-[color-mix(in_srgb,var(--ok)_35%,var(--line-2))] [--cut-line:color-mix(in_srgb,var(--ok)_35%,var(--line-2))] text-ok",
  accent: "border-accent-line [--cut-line:var(--accent-line)] text-accent",
  bad: "border-[color-mix(in_srgb,var(--bad)_35%,var(--line-2))] [--cut-line:color-mix(in_srgb,var(--bad)_35%,var(--line-2))] text-bad",
  used: "border-line-2 [--cut-line:var(--line-2)] text-txt-muted",
}
const TONE_ICON: Record<StatChipTone, string> = {
  ok: "text-ok",
  accent: "text-accent",
  bad: "text-bad",
  used: "text-txt-dim",
}
const TONE_VALUE: Record<StatChipTone, string> = {
  ok: "text-ok",
  accent: "text-accent",
  bad: "text-bad",
  used: "text-txt",
}

export interface StatChipProps {
  /** Optional leading glyph. The `tile` variant ignores it — a tile's accent
   *  top-bar already carries the emphasis an icon would duplicate. */
  icon?: IconName
  value: React.ReactNode
  label: React.ReactNode
  tone?: StatChipTone
  /** `chip` (default) is the inline pill for a header meta row; `tile` is the
   *  taller KPI slab with the accent top-bar, for a header that reports two or
   *  three headline numbers rather than a row of small counts. */
  variant?: "chip" | "tile"
  className?: string
}

/**
 * The one header metric of the system. Replaces the two hand-rolled `StatChip`
 * copies (Keys, SteamFree), the two `Kpi` copies (biblioteca's ct-kit,
 * myrient's my-kit) and the inline `<span className="cut cut-edge-slant …">`
 * pairs in Sorteos — five spellings of the same object, which had drifted on
 * border colour, icon size and value scale.
 *
 * The pill is a `.cut` parallelogram because it IS a pill; the slants are
 * painted by `cut-edge-slant` since a clip-path eats the left/right borders.
 * The tile keeps square edges — it is a container, and containers in this
 * system carry the top-right chamfer or nothing, never the parallelogram.
 */
export function StatChip({ icon, value, label, tone, variant = "chip", className }: StatChipProps) {
  if (variant === "tile") {
    return (
      <div
        className={cn(
          "flex flex-col gap-[3px] border border-solid border-line border-t-[3px] bg-panel px-4 py-3",
          tone === "ok" ? "border-t-ok" : tone === "bad" ? "border-t-bad" : "border-t-accent",
          className,
        )}
      >
        <b className={cn("font-display text-[26px] font-extrabold italic leading-none", tone ? TONE_VALUE[tone] : "text-txt")}>
          {value}
        </b>
        <small className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
          {label}
        </small>
      </div>
    )
  }
  return (
    <span
      className={cn(
        "cut cut-edge-slant [--cut:4px]",
        "inline-flex items-center gap-[9px] border border-solid bg-panel-2 px-3 py-[9px]",
        "font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em]",
        tone ? TONE_BORDER[tone] : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted",
        className,
      )}
    >
      {icon && <Icon name={icon} size={14} className={tone ? TONE_ICON[tone] : "text-txt-muted"} />}
      <b className={cn("font-display text-[16px] font-extrabold italic leading-none", tone ? TONE_VALUE[tone] : "text-txt")}>
        {value}
      </b>
      {label}
    </span>
  )
}
