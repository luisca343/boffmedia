"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

const ALERT_ICONS: Record<string, string> = { info: "info", success: "check", warning: "flame", error: "x", neutral: "sparkles" }

const toneStyles: Record<string, { box: string; icon: string }> = {
  info: {
    box: "border-[color-mix(in_srgb,var(--cyan-500)_38%,transparent)]",
    icon: "text-cyan-400 bg-[color-mix(in_srgb,var(--cyan-500)_14%,transparent)]",
  },
  success: {
    box: "border-[color-mix(in_srgb,var(--emerald-500)_38%,transparent)]",
    icon: "text-emerald-400 bg-[color-mix(in_srgb,var(--emerald-500)_14%,transparent)]",
  },
  warning: {
    box: "border-[color-mix(in_srgb,var(--amber-400)_42%,transparent)]",
    icon: "text-amber-400 bg-[color-mix(in_srgb,var(--amber-400)_14%,transparent)]",
  },
  error: {
    box: "border-[color-mix(in_srgb,var(--rose-500)_42%,transparent)]",
    icon: "text-rose-400 bg-[color-mix(in_srgb,var(--rose-500)_14%,transparent)]",
  },
  neutral: {
    box: "",
    icon: "text-ink-muted bg-layer-3",
  },
}

interface BoffAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "error" | "neutral"
  title?: string
  onClose?: () => void
  action?: React.ReactNode
}

export const BoffAlert = React.forwardRef<HTMLDivElement, BoffAlertProps>(
  ({ tone = "info", title, onClose, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={tone === "error" ? "alert" : "status"}
        className={cn(
          "flex gap-3.5 items-start p-4",
          "rounded-[var(--radius-lg,22px)]",
          "border border-solid border-edge-strong",
          "bg-layer-2",
          "relative",
          "data-[direction=hud]:shadow-[4px_4px_0_0_var(--hud-shadow)]",
          toneStyles[tone]?.box,
          className,
        )}
        {...props}
      >
        <span className={cn(
          "grid place-items-center w-[30px] h-[30px] rounded-[var(--radius,14px)] shrink-0",
          toneStyles[tone]?.icon,
        )}>
          <Icon name={ALERT_ICONS[tone] || "info"} size={18} />
        </span>
        <div className="flex-1 min-w-0">
          {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
          {children && <div className="text-sm text-ink-muted leading-relaxed">{children}</div>}
          {action && <div className="mt-2.5 flex gap-2">{action}</div>}
        </div>
        {onClose && (
          <button
            className="absolute top-2.5 right-2.5 border-0 bg-transparent text-ink-dim cursor-pointer p-1 rounded-md hover:text-ink hover:bg-layer-3"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
    )
  }
)
BoffAlert.displayName = "BoffAlert"
