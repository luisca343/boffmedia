import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"

/**
 * Admin «Señal» kit — the `av-*` broadcast control-room vocabulary from the
 * handoff, ported to Tailwind + v3 tokens. Dense panels, diagonal cuts, mono
 * data, orange as the live signal. Shared across every admin section.
 */

/* ---- section head ---------------------------------------------------------- */

export function AvSectionHead({
  title,
  desc,
  actions,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className={cn("mb-5", actions && "flex items-start justify-between gap-[18px] flex-wrap")}>
      <div className="min-w-0">
        <h2 className="text-[clamp(26px,3.4vw,34px)]">{title}</h2>
        {desc && (
          <p className="mt-2 text-txt-muted max-w-[74ch] text-[14.5px] leading-[1.5] text-pretty">{desc}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

/* ---- dense panel ----------------------------------------------------------- */

export interface AvPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode
  icon?: IconName
  aside?: React.ReactNode
  flush?: boolean
  bodyClassName?: string
}

export function AvPanel({ title, icon, aside, flush, className, bodyClassName, children, ...rest }: AvPanelProps) {
  return (
    <section className={cn("cut-corner bg-panel border border-solid border-line mb-[18px]", className)} {...rest}>
      {title && (
        <header className="flex items-center gap-[9px] py-3 px-4 border-b border-solid border-line font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted">
          {icon && <Icon name={icon} size={15} className="text-accent shrink-0" />}
          <span>{title}</span>
          {aside && <span className="ml-auto flex items-center gap-2 normal-case tracking-normal">{aside}</span>}
        </header>
      )}
      <div className={cn(flush ? "py-1.5 px-4" : "p-4", bodyClassName)}>{children}</div>
    </section>
  )
}

/* ---- KPI cards ------------------------------------------------------------- */

export function AvKpis({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-3 mb-[18px] [grid-template-columns:repeat(auto-fill,minmax(184px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AvKpi({
  label,
  value,
  icon,
  live,
  foot,
}: {
  label: React.ReactNode
  value: React.ReactNode
  icon?: IconName
  live?: boolean
  foot?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "cut bg-panel border border-solid border-line border-t-[3px] p-[14px_15px] flex flex-col gap-[9px] min-w-0",
        live ? "border-t-accent" : "border-t-line-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] font-semibold leading-[1.1] uppercase tracking-[0.1em] text-txt-dim">
          {label}
        </span>
        {icon && (
          <span className="cut-seal [--cut:6px] grid place-items-center w-[26px] h-[26px] text-accent bg-accent-soft shrink-0">
            <Icon name={icon} size={14} />
          </span>
        )}
      </div>
      <span className="font-display font-extrabold italic text-[30px]/[0.95] tracking-[-0.01em] tabular-nums whitespace-nowrap">
        {value}
      </span>
      {foot && <div className="flex items-center gap-2 flex-wrap mt-auto">{foot}</div>}
    </div>
  )
}

/* ---- pill ------------------------------------------------------------------ */

const PILL_TONES: Record<string, string> = {
  default: "border-line-2 text-txt-muted bg-panel-2",
  green: "border-transparent text-ok bg-ok-soft",
  amber: "border-transparent text-warn bg-warn-soft",
  accent: "border-accent-line text-accent bg-accent-soft",
  rose: "border-transparent text-bad bg-bad-soft",
  muted: "border-transparent text-txt-dim",
}

export function AvPill({
  tone = "default",
  icon,
  children,
  className,
}: {
  tone?: keyof typeof PILL_TONES
  icon?: IconName
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "cut [--cut:4px] inline-flex items-center gap-[5px] font-mono text-[9.5px] font-bold leading-none uppercase tracking-[0.08em] py-[5px] px-[9px] whitespace-nowrap border border-solid",
        PILL_TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

/* ---- alert ----------------------------------------------------------------- */

const ALERT_TONES: Record<string, { bar: string; icon: string; ico: IconName }> = {
  info: { bar: "border-l-signal", icon: "text-signal", ico: "info" },
  success: { bar: "border-l-ok", icon: "text-ok", ico: "check" },
  warning: { bar: "border-l-warn", icon: "text-warn", ico: "alert" },
  error: { bar: "border-l-bad", icon: "text-bad", ico: "alert" },
}

export function AvAlert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof ALERT_TONES
  title?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const t = ALERT_TONES[tone]
  return (
    <div
      className={cn(
        "cut-tag flex gap-3 py-[13px] px-4 border border-solid border-line-2 border-l-[3px] bg-panel",
        t.bar,
        className,
      )}
    >
      <Icon name={t.ico} size={17} className={cn("shrink-0 mt-px", t.icon)} />
      <div className="min-w-0">
        {title && (
          <p className="font-display text-[14px] font-bold leading-[1.2] uppercase tracking-[0.03em]">{title}</p>
        )}
        {children && <div className="text-[13px] leading-[1.5] text-txt-muted mt-[3px]">{children}</div>}
      </div>
    </div>
  )
}

/* ---- live dot -------------------------------------------------------------- */

export function AvLiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-[7px] h-[7px] rounded-full bg-ok",
        "animate-[bm-pulse_1.8s_ease-out_infinite] motion-reduce:animate-none",
        className,
      )}
    />
  )
}

/* ---- inline metric grid ---------------------------------------------------- */

export function AvMetrics({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(92px,1fr))]", className)}>
      {children}
    </div>
  )
}

export function AvMetric({
  value,
  label,
  tone,
}: {
  value: React.ReactNode
  label: React.ReactNode
  tone?: "accent" | "pos" | "neg"
}) {
  return (
    <div className="py-[9px] px-[11px] border border-solid border-line bg-base-2">
      <div
        className={cn(
          "font-display font-extrabold italic text-[20px] leading-none tabular-nums",
          tone === "accent" && "text-accent",
          tone === "pos" && "text-ok",
          tone === "neg" && "text-bad",
        )}
      >
        {value}
      </div>
      <div className="mt-[3px] font-mono text-[9px] font-medium leading-none uppercase tracking-[0.07em] text-txt-dim">
        {label}
      </div>
    </div>
  )
}
