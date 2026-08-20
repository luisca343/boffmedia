import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { cssVars, DK_CUT } from "./utils"

/**
 * Data-tool chassis: a sticky bar, an optional sub-bar and a body. Owns the
 * `--dk-pad` gutter.
 *
 * The page is the only scroller. A `100vh - nav` box whose body carries
 * `overflow-y-auto` nests a second scrollbar inside a document that still
 * scrolls by one Footer height — scrolling slides the tool up and leaves the
 * content in a sliver above the footer. `min-h` + a sticky bar is the same
 * pattern ToolShell and the auth screens use.
 */
export function DkApp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      // `--dk-bar-h` is the nominal DkBar height. Split views inside a DkApp use
      // it to sticky-offset their own column below the bar; override per tool if
      // a bar wraps to two rows.
      style={cssVars({ "--dk-pad": "clamp(14px,2vw,32px)", "--dk-bar-h": "45px" })}
      className={cn(
        "flex min-w-0 flex-col min-h-[calc(100dvh_-_var(--nav-h))]",
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
        // Sticks under the site Navbar, at every width. `top-0` below 720px
        // puts it underneath the Navbar rather than below it.
        "px-[var(--dk-pad)] py-[10px] sticky top-[var(--nav-h)]",
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
        "min-h-0 flex-1",
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
          className="cut-tag cut-tag-edge [--cut-line:var(--accent-line)] [--cut-tag:8px] grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-accent-line bg-accent-soft text-accent"
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
      <a href={href} aria-label={label} title={label} className={cn("cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] hover:[--cut-line:var(--accent-line)]", cls)}>
        <Icon name="back" size={17} />
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cn("cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] hover:[--cut-line:var(--accent-line)]", cls)}>
      <Icon name="back" size={17} />
    </button>
  )
}
