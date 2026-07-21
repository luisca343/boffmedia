import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Panel } from "../../_components/ui"
import { MAX_GUESSES } from "../_utils/compare"

export interface AttemptsPanelProps {
  used: number
  remaining: number
}

const PIP: Record<"spent" | "current" | "free", string> = {
  spent: "bg-ar-magenta",
  current: "bg-ar-cyan shadow-[0_0_10px_rgb(var(--ar-cyan))]",
  free: "bg-white/[.08]",
}

/** The magazine: one pip per guess the machine will accept. */
export function AttemptsPanel({ used, remaining }: AttemptsPanelProps) {
  const t = useTranslations("arcade")
  return (
    <Panel tone="cyan" tight>
      <div className="mb-2.5 font-ar-display text-[9px] uppercase text-ar-cyan">{t("arcade.squirdle.attemptsPanel.title")}</div>
      <div className="flex gap-1.5">
        {Array.from({ length: MAX_GUESSES }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-[3px]",
              PIP[i < used ? "spent" : i === used ? "current" : "free"],
            )}
          />
        ))}
      </div>
      <p className="m-0 mt-2.5 font-ar-mono text-[11px] text-ar-ink-dim">
        {t("arcade.squirdle.attemptsPanel.remaining", { remaining, total: MAX_GUESSES })}
      </p>
    </Panel>
  )
}
