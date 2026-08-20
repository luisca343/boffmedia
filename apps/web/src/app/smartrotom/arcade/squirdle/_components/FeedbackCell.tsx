import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "../../_components/ui"
import type { Feedback, FeedState } from "../_utils/compare"

export interface FeedbackCellProps {
  fb: Feedback
  children: ReactNode
  /** Shown inside the cell on mobile, where the column heads are gone. */
  label: string
}

export const FEED_SKIN: Record<FeedState, string> = {
  hit: "border-ar-lime/60 text-ar-lime bg-[radial-gradient(90%_90%_at_50%_25%,rgb(var(--ar-lime)/.3),rgb(var(--ar-void)/.9))] shadow-[inset_0_0_16px_rgb(var(--ar-lime)/.28),0_2px_0_rgb(0_0_0/.4)]",
  near: "border-ar-amber/60 text-ar-amber bg-[radial-gradient(90%_90%_at_50%_25%,rgb(var(--ar-amber)/.28),rgb(var(--ar-void)/.9))] shadow-[inset_0_0_16px_rgb(var(--ar-amber)/.22),0_2px_0_rgb(0_0_0/.4)]",
  miss: "border-white/[.08] text-ar-ink-dim bg-[linear-gradient(180deg,#160a34,#0a0420)] shadow-[0_2px_0_rgb(0_0_0/.4)]",
}

// Colour never carries the verdict alone: the state is spelled out
// for screen readers, and the ordered attributes also show a direction arrow.
const SPOKEN_KEY: Record<FeedState, string> = {
  hit: "squirdle.feedback.hit",
  near: "squirdle.feedback.near",
  miss: "squirdle.feedback.miss",
}

const SPOKEN_DIR_KEY = {
  up: "squirdle.feedback.dirUp",
  down: "squirdle.feedback.dirDown",
} as const

/** One attribute of one guess, judged against the hidden creature. */
export function FeedbackCell({ fb, children, label }: FeedbackCellProps) {
  const t = useTranslations("arcade")
  return (
    <div
      className={cn(
        "ar-scanlines flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1 text-center",
        FEED_SKIN[fb.state],
      )}
    >
      <span className="font-ar-display text-[7px] uppercase tracking-[0.1em] text-ar-ink-muted md:hidden">
        {label}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="font-ar-mono text-[11px] font-bold uppercase leading-tight tabular-nums">
          {children}
        </span>
        {fb.dir && <Icon.Chevron s={12} dir={fb.dir} />}
      </span>
      <span className="sr-only">
        {label}: {t(SPOKEN_KEY[fb.state])}
        {fb.dir ? `, ${t(SPOKEN_DIR_KEY[fb.dir])}` : ""}
      </span>
    </div>
  )
}
