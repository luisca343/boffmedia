import { cn } from "@/lib/utils"
import { Icon, Panel } from "../../_components/ui"
import type { FeedState } from "../_utils/compare"
import { FEED_SKIN } from "./FeedbackCell"

const ROWS: { state: FeedState; text: string }[] = [
  { state: "hit", text: "Correcto" },
  { state: "near", text: "El tipo está, pero en la otra posición" },
  { state: "miss", text: "Incorrecto" },
]

/** How to read the board. */
export function Legend() {
  return (
    <Panel tone="void" tight>
      <div className="mb-2.5 font-ar-display text-[9px] uppercase text-ar-cyan">Leyenda</div>
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
            El valor objetivo es mayor / menor
          </span>
        </li>
      </ul>
    </Panel>
  )
}
