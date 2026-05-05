import LZString from 'lz-string'
import type { CalcPokemon, CalcField, CalcTab } from '../_types/calculator'

export const URL_PARAM = 's'

// Versioned envelope — bump `v` if the shape changes incompatibly.
// Old links with a lower version will fail decodeCalcUrl's guard and
// the user will simply land on the default calculator state.
export interface UrlState {
  v: 1
  reg: string
  ch: boolean
  tab: CalcTab
  m1: number | null
  m2: number | null
  p1: CalcPokemon
  p2: CalcPokemon
  f: CalcField
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function encodeCalcUrl(
  poke1: CalcPokemon,
  poke2: CalcPokemon,
  field: CalcField,
  regulation: string,
  useChampions: boolean,
  activeTab: CalcTab,
  activeMove1: number | null,
  activeMove2: number | null,
): string {
  try {
    const payload: UrlState = {
      v: 1, reg: regulation, ch: useChampions,
      tab: activeTab, m1: activeMove1, m2: activeMove2,
      p1: poke1, p2: poke2, f: field,
    }
    // lz-string compressToEncodedURIComponent produces a URL-safe string
    // directly — no additional base64 step needed.
    return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
  } catch {
    return ''
  }
}

export function decodeCalcUrl(encoded: string): UrlState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const state = JSON.parse(json) as UrlState
    if (state.v !== 1 || !state.p1?.name || !state.p2?.name) return null
    return state
  } catch {
    return null
  }
}
