import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, ToolSeal, ToolStrip, ToolTitle, type IconName } from "@boffmedia/ui"
import { cssVars } from "./utils"

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
      // `--tool-pad` is the gutter token the shared `ToolStrip` reads; `--dk-pad`
      // stays as the name the datakit's own bodies and split views use.
      style={cssVars({ "--dk-pad": "clamp(14px,2vw,32px)", "--tool-pad": "clamp(14px,2vw,32px)", "--dk-bar-h": "45px" })}
      className={cn(
        "flex min-w-0 flex-col min-h-[calc(100dvh_-_var(--nav-h))]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The datakit's name for the shared `ToolStrip`. Kept as an alias so the eight
 *  views that already read as `<DkBar>…</DkBar>` need no churn, while the
 *  geometry (height, gutter, sticky offset, z-order) has exactly one definition
 *  in `@boffmedia/ui`.
 *
 *  Do NOT reintroduce `relative` here. The bar's old class list opened with it
 *  and ended with `sticky top-[var(--nav-h)]`; `cn()` is tailwind-merge, so the
 *  later `sticky` won and `relative` had never done anything. Passing it through
 *  as an override puts it AFTER the strip's own `sticky` — it then wins, and
 *  `top` on a relative box is an offset rather than a stick point, so the bar
 *  drops a full navbar height and leaves that band empty above it. */
export function DkBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ToolStrip className={className}>{children}</ToolStrip>
}

export function DkSub({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ToolStrip tone="sub" className={className}>
      {children}
    </ToolStrip>
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

/** The bar title cluster — `ToolSeal` + `ToolTitle` from the shared kit. */
export function DkTitle({ icon, label, sub, className }: { icon?: IconName; label: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-[10px]", className)}>
      {icon && <ToolSeal icon={icon} />}
      <ToolTitle title={label} sub={sub} />
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
