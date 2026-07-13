export const POKEMON_PER_BOX = 30
export const ROWS_PER_BOX = 5
export const COLS_PER_ROW = 6
export const TOTAL_BOXES = 30
export const PARTY_SIZE = 6

/** The six stats, in the order the game server packs `ivs`, `evs` and `stats`. */
export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "PS",
  atk: "Ataque",
  def: "Defensa",
  spa: "At. Esp.",
  spd: "Def. Esp.",
  spe: "Velocidad",
}

export const STAT_SHORT: Record<StatKey, string> = {
  hp: "PS",
  atk: "Atq",
  def: "Def",
  spa: "AtE",
  spd: "DfE",
  spe: "Vel",
}

/** Pixelmon's "no held item" sentinels. `item` is a string, never null. */
export const NO_ITEM = ["item.minecraft.air", "none", ""]

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const

/**
 * Legendaries + mythicals by national dex number. This is a static fact about the
 * franchise, not API data — the game server does not flag them, so the "legendario"
 * filter has to be backed by a list. The legacy PC shipped one that stopped at gen 4;
 * this covers gens 1–9.
 */
export const LEGENDARY_DEX = new Set<number>([
  144, 145, 146, 150, 151,
  243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  716, 717, 718, 719, 720, 721,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796,
  797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809,
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  905, 1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010,
  1014, 1015, 1016, 1017, 1024, 1025,
])
