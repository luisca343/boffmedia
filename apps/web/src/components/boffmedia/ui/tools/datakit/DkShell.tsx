import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { cssVars, DK_CUT } from "./utils"

/**
 * Full-height data-tool chassis: a sticky bar, an optional sub-bar and a body
 * with its own scroll. Owns the `--dk-pad` gutter. On narrow screens the body
 * stops clipping so the page scrolls and the bar sticks.
 */
export function DkApp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={cssVars({ "--dk-pad": "clamp(14px,2vw,32px)" })}
      className={cn(
        "flex min-w-0 flex-col h-[calc(100vh_-_var(--nav-h,66px))]",
        "max-[720px]:h-auto max-[720px]:min-h-[calc(100vh_-_var(--nav-h,66px))]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DkBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative z-30 flex flex-none flex-wrap items-center gap-3 border-b border-solid border-line bg-base",
        "px-[var(--dk-pad)] py-[10px] max-[720px]:sticky max-[720px]:top-0",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DkSub({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative z-[25] flex flex-none flex-wrap items-center gap-3 border-b border-solid border-line bg-base-2",
        "px-[var(--dk-pad)] py-2",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Right-aligned mono note used inside the sub-bar. */
export function DkSubNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("ml-auto inline-flex items-center gap-[6px] font-mono text-[11px] font-medium leading-[1.4] text-txt-dim", className)}>
      {children}
    </span>
  )
}

export function DkBody({ children, pad = true, className }: { children: React.ReactNode; pad?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto max-[720px]:overflow-visible",
        pad && "px-[var(--dk-pad)] pb-[60px] pt-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Vertical hairline separator for the bar. */
export function DkDivider({ className }: { className?: string }) {
  return <span className={cn("my-[2px] w-px flex-none self-stretch bg-line", className)} />
}

/** Flex spacer that pushes trailing controls to the right. */
export function DkSpacer() {
  return <span className="flex-1" />
}

export function DkTitle({ icon, label, sub, className }: { icon?: IconName; label: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-[10px]", className)}>
      {icon && (
        <span
          style={{ clipPath: DK_CUT }}
          className="grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-accent-line bg-accent-soft text-accent"
        >
          <Icon name={icon} size={17} />
        </span>
      )}
      <span className="grid min-w-0">
        <b className="truncate font-display text-[17px] font-bold uppercase leading-[1.05] tracking-[0.04em]">{label}</b>
        {sub != null && (
          <i className="truncate font-mono text-[10px] font-medium not-italic uppercase leading-[1.3] tracking-[0.1em] text-txt-dim">{sub}</i>
        )}
      </span>
    </div>
  )
}

export function DkBack({ onClick, href, label }: { onClick?: () => void; href?: string; label: string }) {
  const cls =
    "grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-line-2 bg-panel text-txt-muted transition-[color,border-color] hover:border-accent-line hover:text-accent-bright focus-visible:outline-2 focus-visible:outline-accent-line"
  if (href) {
    return (
      <a href={href} aria-label={label} title={label} style={{ clipPath: DK_CUT }} className={cls}>
        <Icon name="back" size={17} />
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} style={{ clipPath: DK_CUT }} className={cls}>
      <Icon name="back" size={17} />
    </button>
  )
}
