import * as React from "react"
import { cn } from "../cn"
import { Toggle } from "./toggle"

export interface FeatureToggleProps {
  /** Leading glyph — wrapped in a seal box. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** The switch's accessible name. Needed separately from `title` because
   *  `title` is a ReactNode — it may be markup — and `aria-label` takes a
   *  string. Falls back to nothing, which is why the row button below carries
   *  the name too. */
  ariaLabel?: string
  description?: React.ReactNode
  on?: boolean
  onChange?: (on: boolean) => void
  /** Revealed inline only while `on` — the feature's fields (DropZones, Selects…). */
  children?: React.ReactNode
  className?: string
}

// A labelled optional-feature switch that expands its body inline when enabled.
// The head is the click target (button); the reused Toggle mirrors + drives the
// same state. Sharp box with an accent left-bar when on. Replaces the dead `.cut`
// "toggle sections" in emulator-editor (romhack, starting-save).
export function FeatureToggle({
  icon,
  title,
  ariaLabel,
  description,
  on,
  onChange,
  children,
  className,
}: FeatureToggleProps) {
  const toggle = () => onChange?.(!on)

  return (
    <div
      className={cn(
        "border border-solid border-line border-l-[3px] border-l-transparent bg-panel transition-[border-color] duration-[140ms]",
        on && "border-l-accent",
        className,
      )}
    >
      <div className="flex items-start gap-3.5 p-[0.9375rem]">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!!on}
          className="flex min-w-0 flex-1 items-start gap-3.5 text-left focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]"
        >
          {icon != null && (
            <span className="grid size-[2.375rem] shrink-0 place-items-center border border-solid border-line-2 bg-panel text-txt">
              {icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[0.875rem] font-bold not-italic uppercase leading-tight tracking-[0.05em] text-txt">
              {title}
            </span>
            {description != null && (
              <span className="mt-1 block text-[0.78125rem] leading-[1.45] text-txt-dim">{description}</span>
            )}
          </span>
        </button>
        {/* KNOWN LIMITATION, recorded in the a11y findings rather than fixed
            here: this row exposes TWO controls for ONE piece of state — the
            wrapping button above (aria-pressed, named by `title`) and this
            switch. A screen reader announces the same setting twice. Collapsing
            them is a redesign of this primitive and of every call site's hit
            target, so it is not something to do inside a naming sweep. Naming
            the switch is the part that is safe and unambiguously an improvement:
            an unnamed switch tells someone the state of something without ever
            saying what. */}
        <Toggle
          on={on}
          onChange={onChange}
          ariaLabel={ariaLabel}
          className="mt-0.5 shrink-0"
        />
      </div>

      {on && children != null && (
        <div className="grid gap-3.5 border-t border-solid border-line bg-panel-2 p-[0.9375rem]">{children}</div>
      )}
    </div>
  )
}
