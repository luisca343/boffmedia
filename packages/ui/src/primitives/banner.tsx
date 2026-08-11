import * as React from "react"
import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon, type IconName } from "./icon"

export type BannerTone = "info" | "success" | "error" | "warn"

/** `--cut-line` repeats each tone's border colour because `.cut-seal-edge` draws
 *  the two chamfer diagonals as its own paint, and it cannot read the `border-*`
 *  utility — see the shape note on the wrapper below. */
const TONES: Record<BannerTone, { wrap: string; ico: string; def: IconName }> = {
  info: {
    wrap: "border-[color-mix(in_srgb,var(--info)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--info)_45%,transparent)] bg-signal-soft",
    ico: "text-signal",
    def: "info",
  },
  success: {
    wrap: "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft",
    ico: "text-ok",
    def: "check",
  },
  error: {
    wrap: "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft",
    ico: "text-bad",
    def: "alert",
  },
  warn: {
    wrap: "border-[color-mix(in_srgb,var(--warn)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft",
    ico: "text-warn",
    def: "alert",
  },
}

export interface BannerProps {
  tone?: BannerTone
  title?: React.ReactNode
  children?: React.ReactNode
  icon?: IconName
  onClose?: () => void
  actions?: React.ReactNode
  className?: string
}

export function Banner({ tone = "info", title, children, icon, onClose, actions, className }: BannerProps) {
  const t = useT()
  const toneCfg = TONES[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-[11px] py-3 px-[14px] border border-solid",
        // `.cut-seal`, not a hand-written polygon: the inline one this replaced
        // was the seal path MINUS its closing `0 var(--cut)` vertex, so instead
        // of chamfering the top-left corner it closed straight from the
        // bottom-left corner to a point along the top edge — one long diagonal
        // down the whole left side. `-edge` then strokes the two chamfers the
        // clip takes out of the border. Not `.cut-frame`: every tone fill is a
        // translucent `*-soft`, and a translucent --cut-fill composites over the
        // stroke slab instead of over the page behind it.
        "cut-seal cut-seal-edge",
        toneCfg.wrap,
        className,
      )}
    >
      <span className={cn("flex-none grid place-items-center mt-px", toneCfg.ico)}>
        <Icon name={icon || toneCfg.def} size={16} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-[2px] font-body text-[13px] leading-[1.45] text-txt-muted">
        {title && <b className="font-bold text-[13px] leading-[1.3] text-txt">{title}</b>}
        {children && <span>{children}</span>}
      </div>
      {actions}
      {onClose && (
        <button
          type="button"
          aria-label={t("dismiss")}
          onClick={onClose}
          className="flex-none text-txt-dim p-[2px] cursor-pointer hover:text-txt"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
