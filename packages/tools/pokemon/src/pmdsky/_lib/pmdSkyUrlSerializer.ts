import LZString from 'lz-string'

export const URL_PARAM = 'wm'

/**
 * Versioned envelope for PMD Sky Wonder Mail builder state.
 * Bump `v` if the shape changes incompatibly.
 * Old links with a lower version will fail decodePmdSkyUrl's guard and
 * the user will simply land on the default builder state.
 *
 * Uses numeric IDs to match the store's SkyFormData structure.
 */
export interface UrlState {
  v: 1
  qt: number  // questType
  sq?: number  // specialQuestType (optional, defaults to 0)
  dg: number  // dungeon
  fl: number  // floor
  cp: number  // clientPokemon
  tp: number  // targetPokemon
  rt: number  // rewardType
  ti: number  // targetItem
  ri: number  // rewardItem
  eu: boolean  // europeanVersion
}

/**
 * Encode PMD Sky Wonder Mail builder state into a URL-safe string.
 * Returns empty string on error for graceful degradation.
 */
export function encodePmdSkyUrl(state: {
  questType: number
  specialQuestType?: number
  dungeon: number
  floor: number
  clientPokemon: number
  targetPokemon: number
  rewardType: number
  targetItem: number
  rewardItem: number
  europeanVersion: boolean
}): string {
  try {
    const payload: UrlState = {
      v: 1,
      qt: state.questType,
      ...(state.specialQuestType && state.specialQuestType !== 0 && { sq: state.specialQuestType }),
      dg: state.dungeon,
      fl: state.floor,
      cp: state.clientPokemon,
      tp: state.targetPokemon,
      rt: state.rewardType,
      ti: state.targetItem,
      ri: state.rewardItem,
      eu: state.europeanVersion,
    }
    return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
  } catch {
    return ''
  }
}

/**
 * Decode PMD Sky Wonder Mail builder state from a URL-safe string.
 * Returns null on error (malformed, truncated, old version, etc.)
 * for graceful degradation to default state.
 */
export function decodePmdSkyUrl(encoded: string): UrlState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const state = JSON.parse(json) as UrlState
    // Validate required fields are present and have correct types
    if (
      state.v !== 1 ||
      typeof state.qt !== 'number' ||
      typeof state.dg !== 'number' ||
      typeof state.fl !== 'number' ||
      typeof state.cp !== 'number' ||
      typeof state.tp !== 'number' ||
      typeof state.rt !== 'number' ||
      typeof state.ti !== 'number' ||
      typeof state.ri !== 'number' ||
      typeof state.eu !== 'boolean'
    ) {
      return null
    }
    return state
  } catch {
    return null
  }
}
