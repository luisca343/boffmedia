/** Usage entry for a single Pokemon -- returned by the Ladder and Champions tabs */
export interface PokemonUsageEntry {
  speciesId:    string;
  speciesName:  string;
  rank:         number;
  types:        string[];
  usagePercent: number;
  rawCount:     number;
  topItem?:     string;
  topMove?:     string;
  topTeraType?: string;
}

/** Full detail for a single Pokemon (expanded panel) */
export interface PokemonUsageDetail extends PokemonUsageEntry {
  baseStats:  { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities:  Array<{ name: string; percent: number }>;
  items:      Array<{ name: string; percent: number }>;
  moves:      Array<{ name: string; percent: number }>;
  teraTypes:  Array<{ name: string; percent: number }>;
  teammates:  Array<{ name: string; percent: number }>;
  spreads:    Array<{ nature: string; spread: string; percent: number }>;
}

/**
 * Paste-derived breakdown for a Champions species.
 * Returned by GET /champions/:speciesId/detail — separate from the usage list entry.
 */
export interface ChampionsPasteDetail {
  speciesId:  string;
  speciesName: string;
  pasteCount: number;
  abilities:  Array<{ name: string; percent: number }>;
  items:      Array<{ name: string; percent: number }>;
  moves:      Array<{ name: string; percent: number }>;
  teraTypes:  Array<{ name: string; percent: number }>;
  spreads:    Array<{ nature: string; spread: string; percent: number }>;
}

/** Result of a batch paste-fetch operation */
export interface BatchFetchResult {
  total:   number;
  fetched: number;
  cached:  number;
  failed:  number;
}

/** Divergence entry comparing ladder vs Champions usage */
export interface DivergenceEntry {
  speciesId:        string;
  speciesName:      string;
  ladderPercent:    number;
  championsPercent: number;
  divergence:       number;
  badge?: 'ladder-trap' | 'tournament-staple';
}

/** One player entry from a Limitless tournament (for the players list) */
export interface LimitlessPlayer {
  playerSlug:  string;
  playerName:  string;
  placing:     number;
  record:      string;
  drop:        number | null;
  hasTeam:     boolean;
}
