import type { ExtendedPokemonW } from "../_types/pc.types"
import { STAT_KEYS, STAT_SHORT } from "../_utils/constants"
import { statAt } from "../_utils/derive"
import { Bar, statTone } from "./ui"

export interface StatBarsProps {
  pokemon: ExtendedPokemonW
  /** Drops the `IV n · EV n` column — for the narrow columns of a comparison. */
  compact?: boolean
}

/**
 * The six stats. `stats`, `ivs` and `evs` arrive as flat six-element arrays in the
 * game server's own order, which is why every read goes through `statAt`.
 */
export function StatBars({ pokemon, compact = false }: StatBarsProps) {
  return (
    <div className="flex flex-col gap-2">
      {STAT_KEYS.map((k) => {
        const v = statAt(pokemon.stats, k)
        return (
          <div key={k} className="flex items-center gap-[9px]">
            <span className="w-[34px] flex-none font-pc-mono text-[11px] text-pc-fg-subtle">
              {STAT_SHORT[k]}
            </span>
            <span className="w-[34px] flex-none text-right text-[12.5px] font-bold text-pc-fg">{v}</span>
            <Bar pct={Math.min(100, (v / 200) * 100)} tone={statTone(v)} className="flex-1" />
            {!compact && (
              <span className="w-[78px] flex-none text-right font-pc-mono text-[10px] text-pc-fg-subtle">
                IV {statAt(pokemon.ivs, k)} · EV {statAt(pokemon.evs, k)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
