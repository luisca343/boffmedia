import type { ReactNode } from "react"

export interface AccountCardProps {
  kicker: string
  children: ReactNode
}

/** One of the three inset slates inside the CUENTA panel. */
export function AccountCard({ kicker, children }: AccountCardProps) {
  return (
    <div className="rounded-[10px] border border-white/[.06] bg-black/40 p-3.5">
      <div className="mb-1.5 font-ar-mono text-[0.625rem] uppercase tracking-[0.08em] text-ar-ink-muted">
        {kicker}
      </div>
      {children}
    </div>
  )
}
