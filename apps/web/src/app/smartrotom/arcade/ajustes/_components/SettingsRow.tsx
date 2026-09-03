import type { ReactNode } from "react"

export interface SettingsRowProps {
  label: string
  hint?: ReactNode
  /** The control. Its accessible name must repeat `label` — the row is not a `<label>`. */
  children: ReactNode
}

export function SettingsRow({ label, hint, children }: SettingsRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3.5 border-b border-dashed border-white/[.06] py-3.5">
      <div>
        <div className="font-ar text-[0.875rem] font-semibold text-ar-ink">{label}</div>
        {hint && (
          <div className="mt-1 max-w-[32.5rem] font-ar-mono text-[0.6875rem] leading-relaxed text-ar-ink-muted">
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
