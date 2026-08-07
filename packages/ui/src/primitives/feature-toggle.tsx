import * as React from "react"
import { cn } from "../cn"
import { Toggle } from "./toggle"

export interface FeatureToggleProps {
  /** Leading glyph — wrapped in a seal box. */
  icon?: React.ReactNode
  title: React.ReactNode
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
      <div className="flex items-start gap-3.5 p-[15px]">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!!on}
          className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
        >
          {icon != null && (
            <span className="grid size-[38px] shrink-0 place-items-center border border-solid border-line-2 bg-panel text-txt">
              {icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14px] font-bold not-italic uppercase leading-tight tracking-[0.05em] text-txt">
              {title}
            </span>
            {description != null && (
              <span className="mt-1 block text-[12.5px] leading-[1.45] text-txt-dim">{description}</span>
            )}
          </span>
        </button>
        <Toggle on={on} onChange={onChange} className="mt-0.5 shrink-0" />
      </div>

      {on && children != null && (
        <div className="grid gap-3.5 border-t border-solid border-line bg-panel-2 p-[15px]">{children}</div>
      )}
    </div>
  )
}
