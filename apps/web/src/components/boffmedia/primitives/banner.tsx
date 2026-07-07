import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export type BannerTone = "info" | "success" | "error" | "warn"

const TONES: Record<BannerTone, { wrap: string; ico: string; def: string }> = {
  info: {
    wrap: "border-[color-mix(in_srgb,var(--info)_45%,transparent)] bg-signal-soft",
    ico: "text-signal",
    def: "info",
  },
  success: {
    wrap: "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft",
    ico: "text-ok",
    def: "check",
  },
  error: {
    wrap: "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft",
    ico: "text-bad",
    def: "alert",
  },
  warn: {
    wrap: "border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft",
    ico: "text-warn",
    def: "alert",
  },
}

export interface BannerProps {
  tone?: BannerTone
  title?: React.ReactNode
  children?: React.ReactNode
  icon?: string
  onClose?: () => void
  actions?: React.ReactNode
  className?: string
}

export function Banner({ tone = "info", title, children, icon, onClose, actions, className }: BannerProps) {
  const t = TONES[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-[11px] py-3 px-[14px] border border-solid",
        "[clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%_-_var(--cut)),calc(100%_-_var(--cut))_100%,0_100%)]",
        t.wrap,
        className,
      )}
    >
      <span className={cn("flex-none grid place-items-center mt-px", t.ico)}>
        <Icon name={icon || t.def} size={16} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-[2px] font-body text-[13px] leading-[1.45] text-txt-muted">
        {title && <b className="font-bold text-[13px] leading-[1.3] text-txt">{title}</b>}
        {children && <span>{children}</span>}
      </div>
      {actions}
      {onClose && (
        <button
          type="button"
          aria-label="Descartar"
          onClick={onClose}
          className="flex-none text-txt-dim p-[2px] cursor-pointer hover:text-txt"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
