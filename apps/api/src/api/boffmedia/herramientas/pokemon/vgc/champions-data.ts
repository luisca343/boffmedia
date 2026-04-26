/**
 * Champions regulation definitions.
 * Maps a regulation ID to the additional bans applied on top of the Champions legal pool.
 */
export interface ChampionsRegulation {
  /** Shorthand ID used in the API (e.g. "vgc2026regma") */
  id: string;
  /** Full @pkmn/sim format ID (e.g. "gen9championsvgc2026regma") */
  formatId: string;
  name: string;
  gameType: 'singles' | 'doubles';
  /** Google Sheets GID for the VGCPastes Champions sheet for this regulation. */
  vgcPastesGid?: string;
  notes?: string;
}

export const CHAMPIONS_REGULATIONS: Record<string, ChampionsRegulation> = {
  vgc2026regma: {
    id: 'vgc2026regma',
    formatId: 'gen9championsvgc2026regma',
    name: '[Gen 9 Champions] VGC 2026 Reg M-A',
    gameType: 'doubles',
    vgcPastesGid: '791705272',
  }
};
