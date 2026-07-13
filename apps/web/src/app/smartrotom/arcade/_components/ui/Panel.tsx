import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ArPanelTone = "void" | "deep" | "cyan" | "magenta"

export interface ArPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  tone?: ArPanelTone
  /** Reward/hero panels sit on a violet bloom instead of a flat drop shadow. */
  glow?: boolean
  tight?: boolean
  /**
   * Clip children to the panel's rounded box. On by default. Turn it OFF when
   * something inside has to escape the panel — an autocomplete dropdown, a
   * popover. The CRT overlay inherits the radius, so an unclipped panel still
   * has clean corners.
   */
  clip?: boolean
  /** Extra classes for the inner (padded) layer — the CRT overlay sits above it. */
  innerClassName?: string
}

// A panel is a pane of dark glass in a neon frame. The tone picks which neon.
const TONE: Record<ArPanelTone, string> = {
  void: "bg-[linear-gradient(180deg,rgb(20_10_52/.92),rgb(10_5_30/.92))] border-[rgb(120_90_200/.25)]",
  deep: "bg-[linear-gradient(180deg,rgb(8_4_30/.96),rgb(4_2_14/.96))] border-[rgb(80_60_160/.25)]",
  cyan: "bg-[linear-gradient(180deg,rgb(8_30_46/.95),rgb(4_8_22/.95))] border-ar-cyan/35",
  magenta: "bg-[linear-gradient(180deg,rgb(48_8_40/.95),rgb(20_4_18/.95))] border-ar-magenta/35",
}

export function Panel({
  children,
  tone = "void",
  glow = false,
  tight,
  clip = true,
  className,
  innerClassName,
  ...rest
}: ArPanelProps) {
  return (
    <div
      className={cn(
        "ar-scanlines rounded-2xl border",
        clip ? "overflow-hidden" : "overflow-visible",
        TONE[tone],
        glow
          ? "shadow-[0_10px_40px_-8px_rgb(var(--ar-violet)/.35),inset_0_0_0_1px_rgb(255_255_255/.04)]"
          : "shadow-[0_8px_28px_-10px_rgb(0_0_0/.6),inset_0_0_0_1px_rgb(255_255_255/.03)]",
        className,
      )}
      {...rest}
    >
      <div className={cn("relative z-[1]", tight ? "p-3" : "p-5", innerClassName)}>{children}</div>
    </div>
  )
}
