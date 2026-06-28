import { ReactNode, HTMLAttributes } from "react"

// ─── Accent border map ────────────────────────────────────────────────────────

const BORDER = {
  orange: "rgba(249,115,22,0.18)",
  yellow: "rgba(250,204,21,0.18)",
  cyan:   "rgba(34,211,238,0.18)",
  purple: "rgba(168,85,247,0.18)",
  slate:  "rgba(71,85,105,0.3)",
} as const

// ─── MHWildsPanel ─────────────────────────────────────────────────────────────
// Replaces `<Card className="bg-layer-2 border-edge">` across all
// build-planner components.

interface MHWildsPanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: keyof typeof BORDER
}

export function MHWildsPanel({
  accent = "orange",
  className = "",
  style,
  children,
  ...props
}: MHWildsPanelProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))",
        border: `1px solid ${BORDER[accent]}`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── MHWildsPanelHeader ───────────────────────────────────────────────────────
// Replaces `<CardHeader>` — flex row with bottom divider.

export function MHWildsPanelHeader({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between ${className}`}
      style={{ borderBottom: "1px solid rgba(71,85,105,0.2)" }}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── MHWildsPanelTitle ────────────────────────────────────────────────────────
// Replaces `<CardTitle>`.

export function MHWildsPanelTitle({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`text-sm font-black uppercase tracking-widest ${className}`}
      style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── StatChip ─────────────────────────────────────────────────────────────────
// Inline stat token — replaces `bg-layer-3/40 rounded px-2 py-1.5`.
// Must forward refs to work with Radix TooltipTrigger asChild.

import { forwardRef } from "react"

export const StatChip = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function StatChip({ children, className = "", style, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${className}`}
        style={{
          background: "rgba(15,23,42,0.6)",
          border: "1px solid rgba(71,85,105,0.3)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
