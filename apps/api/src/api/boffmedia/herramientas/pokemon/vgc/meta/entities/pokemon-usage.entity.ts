/** Usage entry for a single PokÃ©mon â€” returned by the Ladder and Champions tabs */
export interface PokemonUsageEntry {
  speciesId: string;
  speciesName: string;
  usagePercent: number;
  rawCount: number;
  topItem?: string;
  topMove?: string;
  topTeraType?: string;
}

/** Full detail for a single PokÃ©mon (expanded panel) */
export interface PokemonUsageDetail extends PokemonUsageEntry {
  abilities:  Array<{ name: string; percent: number }>;
  items:      Array<{ name: string; percent: number }>;
  moves:      Array<{ name: string; percent: number }>;
  teraTypes:  Array<{ name: string; percent: number }>;
  teammates:  Array<{ name: string; percent: number }>;
  spreads:    Array<{ nature: string; spread: string; percent: number }>;
}

/** Divergence entry comparing ladder vs Champions usage */
export interface DivergenceEntry {
  speciesId: string;
  speciesName: string;
  ladderPercent: number;
  championsPercent: number;
  divergence: number;
  badge?: 'ladder-trap' | 'tournament-staple';
}
