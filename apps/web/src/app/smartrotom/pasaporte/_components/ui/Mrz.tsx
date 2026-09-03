// PAPER. The machine-readable strip at the foot of an identity page.

import { cn } from "@/lib/utils"

/**
 * OCR-B in spirit: wide tracking, tabular figures, one line per row and no wrapping — an
 * MRZ that reflows is not an MRZ. Under the scanner it goes teal-on-teal, which is the
 * page saying "this is the part being read".
 */
export function Mrz({
  lines,
  inspecting = false,
  className,
}: {
  lines: string[]
  inspecting?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "ps-num mt-auto overflow-hidden whitespace-nowrap border-t-2 border-ps-ink/22 px-1 pb-0.5 pt-2",
        "font-ps-mono text-[clamp(0.625rem,1.5vh,0.8125rem)] leading-[1.5] tracking-[.18em] transition-colors duration-300",
        inspecting ? "bg-ps-teal/[.08] text-ps-teal-deep" : "bg-ps-ink/[.06] text-ps-ink-soft",
        className,
      )}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
}
