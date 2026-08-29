import * as React from "react"
import { cn } from "../cn"
import { getLink } from "../i18n"
import { Icon, type IconName } from "./icon"
import { Spinner } from "./spinner"

export type ButtonVariant = "default" | "pri" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  loading?: boolean
  href?: string
  /** Anchor-only attributes; only meaningful together with `href`. */
  target?: React.HTMLAttributeAnchorTarget
  rel?: string
}

/** Colours travel as --cut-line / --cut-fill rather than a CSS border or
 *  background: the shape is a `.cut-frame`, so the stroke is painted geometry.
 *
 *  Every variant moves BOTH stroke and fill on hover, which is the grammar the
 *  rest of the kit already uses (Panel, IconButton and Chip all hover
 *  border-color + background). `ghost` gains its box on hover instead of only
 *  recolouring text — it is the most-used variant and had no hover surface.
 *
 *  Focus: a `clip-path` clips an `outline` away with the rest of the box, so the
 *  ring is drawn with the shape's own stroke (--cut-w 1px → 3px, see BASE). Each
 *  variant names the colour that ring reads against — `pri` goes inward in the
 *  ink colour because its stroke is already the accent. */
export const BTN_VARIANTS: Record<ButtonVariant, string> = {
  default: cn(
    "[--cut-line:var(--line-2)] [--cut-fill:var(--bg)] text-txt",
    "hover:[--cut-line:var(--accent-line)] hover:[--cut-fill:var(--panel-2)] hover:text-accent-bright",
    "focus-visible:[--cut-line:var(--accent-bright)]",
  ),
  pri: cn(
    "[--cut-line:var(--accent)] [--cut-fill:var(--accent)] text-accent-ink",
    "hover:[--cut-line:var(--accent-bright)] hover:[--cut-fill:var(--accent-bright)]",
    // --naranja-ink, not an `--accent-ink`: the token is spelled brand-side and
    // only Tailwind's `accent.ink` alias renames it. It is declared once at
    // :root, so it holds in both themes.
    "focus-visible:[--cut-line:var(--naranja-ink)]",
  ),
  ghost: cn(
    "[--cut-line:transparent] [--cut-fill:transparent] text-txt-muted",
    "hover:[--cut-line:var(--line-2)] hover:[--cut-fill:var(--panel-2)] hover:text-accent-bright",
    "focus-visible:[--cut-line:var(--accent-bright)]",
  ),
  danger: cn(
    "[--cut-line:var(--bad)] [--cut-fill:var(--bg)] text-bad",
    "hover:[--cut-fill:var(--bad)] hover:text-white",
    "focus-visible:[--cut-line:var(--bad)]",
  ),
}

/** The chassis every action control shares — Button and IconButton both build on
 *  it, so an icon-only action sits flush beside a labelled one.
 *
 *  Geometry is the kit's dominant corner: a bottom-right chamfer, the same one
 *  Input, Chip, Menu, Popover and Toast already use. (It used to be `.cut`'s
 *  slanted parallelogram, which made the button the only leaning box on the
 *  page.) The stroke is 1px to match every other bordered primitive. */
export const BTN_BASE = cn(
  "cut-frame cut-frame-tag [--cut-w:1px]",
  "relative inline-flex items-center justify-center whitespace-nowrap select-none no-underline",
  "transition-[color,transform] duration-[140ms] active:translate-y-px motion-reduce:active:translate-y-0",
  "before:transition-[background] before:duration-[140ms] after:transition-[background] after:duration-[140ms]",
  "outline-none focus-visible:[--cut-w:3px]",
)

/** One control scale — 32 / 40 / 48 — held by an explicit height rather than
 *  padding, so a Button, an IconButton and an Input line up in a toolbar
 *  whatever type each of them carries. */
export const BTN_BOX: Record<ButtonSize, string> = {
  sm: "h-8 px-[14px] [--cut-tag:8px]",
  md: "h-10 px-5 [--cut-tag:10px]",
  lg: "h-12 px-7 [--cut-tag:12px]",
}

// One step below the old 15px: `font-display` is this kit's heading voice (Panel
// titles are 16px), so at 15px a button competed with the title above it.
const TYPE: Record<ButtonSize, string> = {
  // line-height is pinned to 1 via the `/none` token: a bare `leading-none` is
  // stripped by tailwind-merge when it sits next to an arbitrary `text-[..px]`.
  sm: "text-[12px]/none",
  md: "text-[13px]/none",
  lg: "text-[15px]/none",
}

const GAP: Record<ButtonSize, string> = { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" }

export function Button({
  className,
  variant = "default",
  size = "md",
  icon,
  iconRight,
  loading,
  href,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const iconSize = size === "lg" ? 17 : size === "sm" ? 13 : 15
  const cls = cn(
    BTN_BASE,
    "font-display font-bold not-italic uppercase tracking-[0.1em]",
    BTN_VARIANTS[variant] || BTN_VARIANTS.default,
    BTN_BOX[size] || BTN_BOX.md,
    TYPE[size] || TYPE.md,
    (disabled || loading) && "opacity-45 pointer-events-none",
    loading && "cursor-default",
    className,
  )

  const inner = (
    <>
      {loading && <Spinner aria-hidden="true" className="absolute top-1/2 left-1/2 -mt-2 -ml-2" />}
      <span className={cn("inline-flex items-center justify-center", GAP[size] || GAP.md, loading && "invisible")}>
        {icon && <Icon name={icon} size={iconSize} />}
        {children}
        {iconRight && <Icon name={iconRight} size={iconSize} />}
      </span>
    </>
  )

  if (href !== undefined && !loading) {
    const aProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>
    if (href.startsWith("/")) {
      const HostLink = getLink()
      return (
        <HostLink data-btn className={cls} href={href} {...aProps}>
          {inner}
        </HostLink>
      )
    }
    return (
      <a data-btn className={cls} href={href} {...aProps}>
        {inner}
      </a>
    )
  }

  return (
    <button data-btn className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {inner}
    </button>
  )
}
