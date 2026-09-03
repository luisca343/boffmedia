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
          <div key={k} className="flex items-center gap-[0.5625rem]">
            <span className="w-[2.125rem] flex-none font-pc-mono text-[0.6875rem] text-pc-fg-subtle">
              {STAT_SHORT[k]}
            </span>
            <span className="w-[2.125rem] flex-none text-right text-[0.78125rem] font-bold text-pc-fg">{v}</span>
            <Bar pct={Math.min(100, (v / 200) * 100)} tone={statTone(v)} className="flex-1" />
            {!compact && (
              <span className="w-[4.875rem] flex-none text-right font-pc-mono text-[0.625rem] text-pc-fg-subtle">
                IV {statAt(pokemon.ivs, k)} · EV {statAt(pokemon.evs, k)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
