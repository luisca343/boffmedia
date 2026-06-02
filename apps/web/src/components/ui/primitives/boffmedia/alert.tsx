"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

const ALERT_ICONS: Record<string, string> = { info: "info", success: "check", warning: "flame", error: "x", neutral: "sparkles" }

interface BoffAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "error" | "neutral"
  title?: string
  onClose?: () => void
  action?: React.ReactNode
}

export const BoffAlert = React.forwardRef<HTMLDivElement, BoffAlertProps>(
  ({ tone = "info", title, onClose, action, className, children, ...props }, ref) => {
    return (
      <div ref={ref} role={tone === "error" ? "alert" : "status"} className={cn("k-alert", `k-alert--${tone}`, className)} {...props}>
        <span className="k-alert__icon"><Icon name={ALERT_ICONS[tone] || "info"} size={18} /></span>
        <div className="k-alert__body">
          {title && <p className="k-alert__title">{title}</p>}
          {children && <div className="k-alert__text">{children}</div>}
          {action && <div className="k-alert__action">{action}</div>}
        </div>
        {onClose && <button className="k-alert__x" aria-label="Cerrar" onClick={onClose}><Icon name="x" size={15} /></button>}
      </div>
    )
  }
)
BoffAlert.displayName = "BoffAlert"
