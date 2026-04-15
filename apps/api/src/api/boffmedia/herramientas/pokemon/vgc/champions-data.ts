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
  notes?: string;
}

export const CHAMPIONS_REGULATIONS: Record<string, ChampionsRegulation> = {
  vgc2026regma: {
    id: 'vgc2026regma',
    formatId: 'gen9championsvgc2026regma',
    name: '[Gen 9 Champions] VGC 2026 Reg M-A',
    gameType: 'doubles',
  },
  'vgc2026regmabo3': {
    id: 'vgc2026regmabo3',
    formatId: 'gen9championsvgc2026regmabo3',
    name: '[Gen 9 Champions] VGC 2026 Reg M-A (Bo3)',
    gameType: 'doubles',
  },
  bssregma: {
    id: 'bssregma',
    formatId: 'gen9championsbssregma',
    name: '[Gen 9 Champions] BSS Reg M-A',
    gameType: 'singles',
  },
  ou: {
    id: 'ou',
    formatId: 'gen9championsou',
    name: '[Gen 9 Champions] OU',
    gameType: 'singles',
    notes: 'Bans: AG, Uber, Moody, Baton Pass, Last Respects, Shed Tail',
  },
};
