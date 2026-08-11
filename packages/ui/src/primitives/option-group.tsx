import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"
import { useRoving } from "./roving"

export interface OptionItem {
  value: string
  icon?: IconName
  label: React.ReactNode
  /** Secondary line under the label. Spelled `desc` to match `RadioOption`. */
  desc?: React.ReactNode
  /** @deprecated Renamed to `desc`, which is what the sibling RadioGroup calls
   *  the same slot. Still honoured so existing call sites keep working. */
  sub?: React.ReactNode
  disabled?: boolean
}

export interface OptionCardProps {
  icon?: IconName
  label: React.ReactNode
  desc?: React.ReactNode
  /** @deprecated Renamed to `desc`. */
  sub?: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaRole?: "radio" | "checkbox"
}

/** One choice in an `OptionGroup`.
 *
 *  The glyph sits BESIDE the label, not above it. Stacked, it took a row of its
 *  own — 30px of tile plus a 6px gap in a card 150-250px wide with nothing next
 *  to it — which was 37% of a 97px card. Inline, with a bare glyph instead of a
 *  second tinted surface inside an already-bordered card, the same content fits
 *  in ~56px. */
export const OptionCard = React.forwardRef<HTMLButtonElement, OptionCardProps & { tabIndex?: number; onKeyDown?: (e: React.KeyboardEvent) => void }>(
  function OptionCard({ icon, label, desc, sub, active, disabled, onClick, ariaRole = "radio", tabIndex, onKeyDown }, ref) {
    const secondary = desc ?? sub
    return (
      <button
        ref={ref}
        type="button"
        role={ariaRole}
        aria-checked={active}
        disabled={disabled}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        title={typeof secondary === "string" ? secondary : typeof label === "string" ? label : undefined}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-[10px] py-[10px] px-[11px] text-left cursor-pointer min-w-0",
          "cut-frame [--cut-w:1px] [--cut:6px]",
          "transition-[color] duration-[140ms]",
          "before:transition-[background] before:duration-[140ms] after:transition-[background] after:duration-[140ms]",
          // A clip-path clips an `outline` away with the rest of the box, so the
          // focus ring is the shape's own stroke — same fix as Button.
          "outline-none focus-visible:[--cut-w:3px] focus-visible:[--cut-line:var(--accent-bright)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          active
            ? "[--cut-line:var(--accent)] [--cut-fill:color-mix(in_srgb,var(--accent)_13%,var(--panel))] text-txt"
            : "[--cut-line:var(--line)] [--cut-fill:var(--panel)] text-txt-muted hover:enabled:[--cut-line:var(--line-2)] hover:enabled:text-txt",
        )}
      >
        {icon && (
          <span
            className={cn(
              "flex-none grid place-items-center transition-[color] duration-[140ms]",
              active ? "text-accent" : "text-txt-dim group-[&:enabled:hover]:text-txt-muted",
            )}
          >
            <Icon name={icon} size={17} />
          </span>
        )}
        <span className="grid gap-[2px] min-w-0">
          {/* The label wraps rather than truncating — a grid row stretches to its
              tallest card anyway, and a clipped label is worse than a tall row. */}
          <span className="font-display text-[13px] font-bold leading-[1.15] tracking-[0.02em] uppercase text-txt">
            {label}
          </span>
          {secondary && <span className="font-mono text-[10.5px] leading-[1.3] text-txt-dim truncate">{secondary}</span>}
        </span>
      </button>
    )
  },
)

export interface OptionGroupProps {
  options: OptionItem[]
  value: string | string[]
  onChange?: (value: string | string[]) => void
  multi?: boolean
  /** Column count at the widest breakpoint. The grid steps down on its own below
   *  it, so a `columns={4}` group is not four squeezed cards on a phone. */
  columns?: number
  ariaLabel?: string
  className?: string
}

export function OptionGroup({ options, value, onChange, multi = false, columns, ariaLabel, className }: OptionGroupProps) {
  const vals = multi ? (Array.isArray(value) ? value : []) : value
  const isOn = (v: string) => (multi ? (vals as string[]).indexOf(v) >= 0 : vals === v)
  const toggle = (v: string) => {
    if (!onChange) return
    if (multi) onChange(isOn(v) ? (vals as string[]).filter((x) => x !== v) : (vals as string[]).concat([v]))
    else onChange(v)
  }

  // Arrow keys and a single tab stop belong to the radio pattern only: a
  // multi-select group is a set of checkboxes, which stay individually tabbable.
  const roving = useRoving(
    options.length,
    (i) => !!options[i] && isOn(options[i].value),
    (i) => !!options[i]?.disabled,
  )
  const pick = (i: number) => {
    const o = options[i]
    if (o && !o.disabled) toggle(o.value)
  }

  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      style={columns ? ({ ["--optcols" as string]: columns } as React.CSSProperties) : undefined}
      className={cn(
        // Two columns from the start, the caller's count only once there is room
        // for it — `--optcols` used to apply at every width, so a 4-column group
        // rendered as four ~80px cards on a phone.
        "grid grid-cols-2 gap-2 sm:grid-cols-[repeat(var(--optcols,3),minmax(0,1fr))]",
        className,
      )}
    >
      {options.map((o, i) => (
        <OptionCard
          key={o.value}
          ref={multi ? undefined : roving.setRef(i)}
          icon={o.icon}
          label={o.label}
          desc={o.desc ?? o.sub}
          active={isOn(o.value)}
          disabled={o.disabled}
          ariaRole={multi ? "checkbox" : "radio"}
          tabIndex={multi ? undefined : roving.tabIndex(i)}
          onKeyDown={multi ? undefined : (e) => roving.onKeyDown(e, i, pick)}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  )
}
