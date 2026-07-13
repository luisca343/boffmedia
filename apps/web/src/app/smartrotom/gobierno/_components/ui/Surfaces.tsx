import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./Icon"
import { TONES, type Tone } from "../../_utils/tones"

// The four paper surfaces. Everything in the app is one of these, or sits on one.

export function Card({
  children,
  className = "",
  dep,
  edgeGold = false,
  style,
}: {
  children: ReactNode
  className?: string
  /** Paints the department spine down the left edge. */
  dep?: Tone
  /** Paints the engraved gold rule across the top — reserved for official records. */
  edgeGold?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      className={`rounded-gt border border-gt-line bg-gt-paper-0 shadow-gt ${dep ? "gt-spine" : ""} ${edgeGold ? "gt-edge-gold" : ""} ${className}`}
      // Data-driven colour: the spine's hue is the department's, so it arrives as a value.
      style={dep ? { ["--gt-dep" as string]: TONES[dep].css, ...style } : style}
    >
      {children}
    </div>
  )
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-gt border border-gt-line bg-gt-paper-1 ${className}`}>{children}</div>
}

export function Sunken({
  children,
  className = "",
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={`rounded-gt-sm border border-gt-line bg-gt-paper-2 ${className}`}>
      {children}
    </div>
  )
}

// The header bar that titles a card's contents.
export function Bar({
  children,
  icon,
  right,
  dep,
}: {
  children: ReactNode
  icon?: IconName
  right?: ReactNode
  dep?: Tone
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 border-b border-gt-line px-4 py-[11px]">
      <div className="flex min-w-0 items-center gap-[9px]">
        {icon && <Icon name={icon} size={16} className={`flex-none ${dep ? TONES[dep].text : "text-gt-accent"}`} />}
        <span className="truncate font-gt-display text-base font-bold text-gt-ink-900">{children}</span>
      </div>
      {right}
    </div>
  )
}

// The stat tile: a mono label, an engraved serif figure, an optional trend.
export function Stat({
  label,
  value,
  sub,
  tone = "civic",
  icon,
  trend,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  icon?: IconName
  trend?: number
}) {
  const t = TONES[tone]
  return (
    <Card dep={tone} className="min-w-0 px-4 py-3.5">
      <div className="flex items-start justify-between">
        <div className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">{label}</div>
        {icon && <Icon name={icon} size={15} className={t.text} />}
      </div>
      <div className="mt-1.5 font-gt-display text-[30px] leading-[1.05] tabular-nums text-gt-ink-900">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="mt-[5px] flex items-center gap-1.5 text-[11.5px] text-gt-ink-500">
          {trend !== undefined && trend !== 0 && (
            <Icon
              name={trend > 0 ? "trendUp" : "trendDown"}
              size={13}
              className={trend > 0 ? "text-gt-ok" : "text-gt-danger"}
            />
          )}
          {sub}
        </div>
      )}
    </Card>
  )
}

export function Empty({
  icon = "scroll",
  title,
  sub,
}: {
  icon?: IconName
  title: string
  sub?: string
}) {
  return (
    <div className="flex animate-gt-pop flex-col items-center justify-center gap-[9px] px-6 py-[46px] text-center motion-reduce:animate-none">
      <Sunken className="grid h-[58px] w-[58px] place-items-center">
        <Icon name={icon} size={24} className="text-gt-ink-300" />
      </Sunken>
      <div className="font-gt-display text-[19px] text-gt-ink-700">{title}</div>
      {sub && <div className="max-w-[340px] text-[12.5px] leading-relaxed text-gt-ink-400">{sub}</div>}
    </div>
  )
}

// The page title block: department kicker, engraved title, optional lede and actions.
export function PageHead({
  kicker,
  title,
  sub,
  dep = "civic",
  right,
}: {
  kicker: string
  title: string
  sub?: string
  dep?: Tone
  right?: ReactNode
}) {
  return (
    <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className={`mb-[5px] font-gt-mono text-[10.5px] font-bold uppercase tracking-[.22em] ${TONES[dep].text}`}>
          {kicker}
        </div>
        <h1 className="font-gt-display text-[30px] leading-[1.05] text-gt-ink-900">{title}</h1>
        {sub && <p className="mt-1.5 max-w-[560px] text-[13.5px] leading-normal text-gt-ink-500">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

// The stamped verdict on a closed record — ANULADA, ARCHIVADO, PAGADA.
export function Stamp({ children, tone = "danger" }: { children: ReactNode; tone?: Tone }) {
  const t = TONES[tone]
  return (
    <span
      className={`inline-block animate-gt-stamp rounded-md border-[2.5px] px-3 py-1 font-gt-display text-sm font-bold uppercase tracking-[.14em] opacity-80 motion-reduce:animate-none ${t.border} ${t.text}`}
    >
      {children}
    </span>
  )
}
