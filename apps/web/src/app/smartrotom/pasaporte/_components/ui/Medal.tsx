// PAPER. The logro coin, lying on the page.

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { LogroTier, StandingTier } from "../../_types"
import { TIER_LABEL } from "../../_utils/tiers"
import { Icon } from "./Icon"

type Metal = LogroTier | StandingTier

/**
 * `.ps-coin` reads `--ps-metal`, and this points it at the tier's own token rather than at
 * a second copy of the hex — one metal ramp, declared once in `tailwind.config.ts`, so a
 * gold logro and a gold ladder rung can never drift apart. A literal map, never
 * `--ps-metal: var(--ps-tier-${tier})` built from a template (§4).
 */
const TIER_VAR: Record<Metal, string> = {
  bronce: "var(--ps-tier-bronce)",
  plata: "var(--ps-tier-plata)",
  oro: "var(--ps-tier-oro)",
  platino: "var(--ps-tier-platino)",
  diamante: "var(--ps-tier-diamante)",
  maestro: "var(--ps-tier-maestro)",
}

export function Medal({
  tier,
  locked = false,
  size = 44,
  className,
}: {
  tier: Metal
  locked?: boolean
  size?: number
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={locked ? `${TIER_LABEL[tier]} (bloqueado)` : TIER_LABEL[tier]}
      style={{ width: size, height: size, "--ps-metal": TIER_VAR[tier] } as CSSProperties}
      className={cn(
        "grid flex-none place-items-center rounded-full",
        locked ? "ps-coin-blank" : "ps-coin",
        className,
      )}
    >
      {locked ? (
        <Icon name="lock" className="h-[42%] w-[42%] text-ps-ink/50" />
      ) : (
        <Icon name="star" className="h-[56%] w-[56%] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]" />
      )}
    </div>
  )
}
