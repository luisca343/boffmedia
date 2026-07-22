import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Panel } from "../../_components/ui"
import type { FeedState } from "../_utils/compare"
import { FEED_SKIN } from "./FeedbackCell"

/** How to read the board. */
export function Legend() {
  const t = useTranslations("arcade")
  const ROWS: { state: FeedState; text: string }[] = [
    { state: "hit", text: t("squirdle.legend.correct") },
    { state: "near", text: t("squirdle.legend.near") },
    { state: "miss", text: t("squirdle.legend.incorrect") },
  ]

  return (
    <Panel tone="void" tight>
      <div className="mb-2.5 font-ar-display text-[9px] uppercase text-ar-cyan">{t("squirdle.legend.title")}</div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {ROWS.map((row) => (
          <li key={row.state} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn("h-[22px] w-[22px] shrink-0 rounded-md border", FEED_SKIN[row.state])}
            />
            <span className="font-ar-mono text-[11px] leading-tight text-ar-ink-dim">{row.text}</span>
          </li>
        ))}
        <li className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border",
              FEED_SKIN.miss,
            )}
          >
            <Icon.Chevron s={12} dir="up" />
          </span>
          <span className="font-ar-mono text-[11px] leading-tight text-ar-ink-dim">
            {t("squirdle.legend.arrowHint")}
          </span>
        </li>
      </ul>
    </Panel>
  )
}
