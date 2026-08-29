import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Button, Icon, type IconName } from "@boffmedia/ui"

/**
 * Admin «Señal» kit — the `av-*` broadcast control-room vocabulary on Tailwind
 * + v3 tokens. Dense panels, diagonal cuts, mono data, orange as the live
 * signal. Shared across every admin section.
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
    <section className={cn("bg-panel border border-solid border-line mb-[18px]", className)} {...rest}>
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
        "bg-panel border border-solid border-line border-t-[3px] p-[14px_15px] flex flex-col gap-[9px] min-w-0",
        live ? "border-t-accent" : "border-t-line-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] font-semibold leading-[1.1] uppercase tracking-[0.1em] text-txt-dim">
          {label}
        </span>
        {icon && (
          <span className="grid place-items-center w-[26px] h-[26px] text-accent bg-accent-soft shrink-0">
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
        "inline-flex items-center gap-[5px] font-mono text-[9.5px] font-bold leading-none uppercase tracking-[0.08em] py-[5px] px-[9px] whitespace-nowrap border border-solid",
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
        "flex gap-3 py-[13px] px-4 border border-solid border-line-2 border-l-[3px] bg-panel",
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

/* ---- view link -------------------------------------------------------------- */

/**
 * Link to the public page of an entity, opened in a new tab.
 * Header form: a ghost Button (same grammar as the "back to list" button it
 * sits beside). Compact form: an icon-only box for table-row action clusters.
 */
export function AvViewLink({
  href,
  label,
  className,
  compact,
  "aria-label": ariaLabel,
}: {
  href: string
  label?: React.ReactNode
  className?: string
  /** Compact icon-button style for table rows. */
  compact?: boolean
  "aria-label"?: string
}) {
  const tCrud = useTranslations("admin.crud")
  const text = label ?? tCrud("viewPage")
  const a11y = ariaLabel ?? (typeof text === "string" ? text : undefined)
  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={a11y}
        aria-label={a11y}
        className={cn(
          "grid place-items-center w-8 h-8 border border-solid border-line-2 text-txt-muted hover:text-accent hover:border-accent-line transition-colors",
          className,
        )}
      >
        <Icon name="external" size={15} />
      </a>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      iconRight="external"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={a11y}
      className={className}
    >
      {text}
    </Button>
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

/* ---- switch row ------------------------------------------------------------ */

/**
 * A window an operator opens and closes — registration, check-in, invites.
 * The reading is the point: a button labelled "Cerrar" is a claim about state,
 * and when that claim was wrong there was nowhere to notice it. Here the state
 * is printed beside the control that flips it.
 */
export function AvSwitchRow({
  label,
  on,
  reading,
  hint,
  action,
  className,
}: {
  label: React.ReactNode
  on: boolean
  /** What the switch currently reads — "Abierta", "Cerrado", "12 restantes". */
  reading: React.ReactNode
  hint?: React.ReactNode
  /** The control that changes it, on the `sm` chassis. */
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-dashed border-line py-2.5 last:border-b-0", className)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-[7px] w-[7px] flex-none rounded-full", on ? "bg-ok" : "bg-line-2")} />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-txt">{label}</span>
          <span className={cn("font-mono text-[10px] uppercase tracking-[0.08em]", on ? "text-ok" : "text-txt-dim")}>
            {reading}
          </span>
        </div>
        {hint && <p className="m-0 mt-0.5 font-body text-[11.5px] leading-[1.4] text-txt-dim">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---- attention list -------------------------------------------------------- */

export type AvAttentionTone = "error" | "warning" | "info"

export interface AvAttentionItem {
  id: React.Key
  tone: AvAttentionTone
  text: React.ReactNode
  /** Where fixing it starts. Rendered as a ghost button on the row. */
  action?: { label: React.ReactNode; onClick: () => void }
}

const ATTENTION_TONE: Record<AvAttentionTone, { icon: IconName; cls: string }> = {
  error: { icon: "alert", cls: "text-bad" },
  warning: { icon: "alert", cls: "text-warn" },
  info: { icon: "info", cls: "text-signal" },
}

/**
 * Things that need a human, each with the one click that starts fixing it.
 * An empty list is a result too, so it says so instead of rendering nothing.
 */
export function AvAttention({
  items,
  empty,
  className,
}: {
  items: AvAttentionItem[]
  /** Shown when there is nothing to do. */
  empty: React.ReactNode
  className?: string
}) {
  if (items.length === 0) {
    return (
      <div className={cn("flex items-center gap-3 py-2.5", className)}>
        <Icon name="check" size={15} className="shrink-0 text-ok" />
        <span className="font-body text-[13px] leading-[1.4] text-txt-muted">{empty}</span>
      </div>
    )
  }
  return (
    <ul className={cn("m-0 list-none p-0", className)}>
      {items.map((it) => {
        const tone = ATTENTION_TONE[it.tone]
        return (
          <li key={it.id} className="flex items-center gap-3 border-b border-dashed border-line py-2.5 last:border-b-0">
            <Icon name={tone.icon} size={15} className={cn("shrink-0", tone.cls)} />
            <span className="min-w-0 flex-1 font-body text-[13px] leading-[1.4] text-txt">{it.text}</span>
            {it.action && (
              <button
                type="button"
                onClick={it.action.onClick}
                className="shrink-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-70"
              >
                {it.action.label}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* ---- progress bar ---------------------------------------------------------- */

export function AvProgressBar({
  value,
  max = 100,
  tone = "default",
  label,
  className,
}: {
  value: number
  max?: number
  tone?: "accent" | "green" | "amber" | "rose" | "default"
  label?: React.ReactNode
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  const toneClass = {
    accent: "bg-accent",
    green: "bg-ok",
    amber: "bg-warn",
    rose: "bg-bad",
    default: "bg-accent",
  }[tone]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 overflow-hidden border border-solid border-line bg-panel-2">
        <div className={cn("h-full transition-[width] duration-300", toneClass)} style={{ width: `${pct}%` }} />
      </div>
      {label && <span className="flex-none text-right text-[11px] text-txt-dim tabular-nums font-mono">{label}</span>}
    </div>
  )
}

/* ---- sticky action bar ----------------------------------------------------- */

export function AvStickyBar({
  open,
  children,
  className,
}: {
  open: boolean
  children: React.ReactNode
  className?: string
}) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    setTarget(document.body)
  }, [])

  if (!open || !target) return null

  return createPortal(
    <div className={cn("fixed inset-x-0 bottom-0 z-[9999] border-t border-solid border-line-2 bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] backdrop-blur", className)}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">{children}</div>
    </div>,
    target,
  )
}

/* ---- job status ------------------------------------------------------------ */

export type AvJobStatus = "idle" | "queued" | "running" | "done" | "error" | "cancelled"

const JOB_STATUS_TONES: Record<AvJobStatus, keyof typeof PILL_TONES> = {
  idle: "default",
  queued: "amber",
  running: "accent",
  done: "green",
  error: "rose",
  cancelled: "muted",
}

export function AvJobStatusPill({ status, label }: { status: AvJobStatus; label?: React.ReactNode }) {
  const t = useTranslations("admin.job")
  const displayLabel = label ?? t(`status.${status}`)
  return <AvPill tone={JOB_STATUS_TONES[status]}>{displayLabel}</AvPill>
}

export function AvJobPanel({
  title,
  desc,
  status,
  progress,
  actions,
  meta,
  children,
  className,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  status: AvJobStatus
  progress?: { value: number; max?: number; label?: React.ReactNode }
  actions?: React.ReactNode
  meta?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <AvPanel
      title={title}
      aside={<AvJobStatusPill status={status} />}
      className={className}
      bodyClassName="flex flex-col gap-4"
    >
      {desc && <p className="text-[13px] text-txt-muted">{desc}</p>}

      {progress && (
        <AvProgressBar
          value={progress.value}
          max={progress.max}
          tone={status === "done" ? "green" : status === "error" ? "rose" : "accent"}
          label={progress.label}
        />
      )}

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}

      {meta && <AvMetrics>{meta}</AvMetrics>}

      {children}
    </AvPanel>
  )
}

/* ---- date formatter -------------------------------------------------------- */

export function formatAdminDate(value: string | number | Date | null | undefined, opts?: { time?: boolean }): string {
  if (!value) return "—"

  try {
    const date = typeof value === "string" ? new Date(value) : typeof value === "number" ? new Date(value) : value
    if (isNaN(date.getTime())) return "—"

    if (opts?.time) {
      return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    }

    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  } catch {
    return "—"
  }
}

/* ---- polling hook ---------------------------------------------------------- */

export { usePolling } from "../hooks/usePolling"
