"use client"

import { useCountUp } from "../../_hooks/useCountUp"
import { Icon } from "./Icon"

export interface CoinCounterProps {
  value: number
  animate?: boolean
}

/**
 * [deferred] Star/coin balance readout.
 *
 * The arcade has no currency balance: `rotom_inventory` stores items, and the
 * daily rewards of type `coins`/`money` are never persisted by the API, so no
 * endpoint can answer "how many stars do I have". Rendering a number here would
 * be fabricating one (SMARTROTOM_V3.md §9), so no screen mounts this — it is
 * built, demo-only in the showcase, and waiting on a balance endpoint.
 * See docs/smartrotom/deferred/arcade.md.
 */
export function CoinCounter({ value, animate = true }: CoinCounterProps) {
  const live = useCountUp(value, 800)
  const shown = animate ? live : value
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-ar-amber/35 bg-black/45 px-2.5 py-1.5 font-ar-mono text-[13px] font-bold tabular-nums text-ar-amber">
      <Icon.Coin s={16} />
      {shown.toLocaleString("es-ES")}
    </span>
  )
}
