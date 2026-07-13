// Domain types for Pasaporte. Local to the module on purpose — apps/api must never
// import @boffmedia/shared (it breaks `nest start`).

import type { SeasonTierKey } from '@/_db/schema/SmartRotomPasaporte';

// The achievement category whose completions ARE the gym badges: `rank` is a count
// of these, nothing else.
export const BADGE_CATEGORY = 'Gimnasios';

export const DEFAULT_REGION = 'Fukitsu';

export interface ProfileView {
  uuid: string;
  username: string;
  trainerId: string;
  region: string;
  memberSince: Date | null;
  createdAt: Date | null;
  // Derived on every read, never stored.
  rank: number;
  title: string;
  completionPct: number;
}

export interface LogroView {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  subcategory: string | null;
  target: number;
  order: number;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
  points: number;
  tier: string;
  // % of players who completed it — real, from rotom_user_achievements.
  rarity: number;
}

export interface SeasonInfo {
  id: number;
  number: number;
  name: string;
  startsAt: Date;
  endsAt: Date;
}

export interface SeasonStanding {
  battles: number;
  wins: number;
  losses: number;
  streak: number;
  lp: number;
  peakLp: number;
  tierKey: SeasonTierKey;
  tier: string;
  division: string;
  nextAt: number | null;
  regionRank: number;
}

export interface SeasonView {
  season: SeasonInfo | null;
  standing: SeasonStanding;
  ladder: readonly { key: string; name: string; minLp: number }[];
}

// One battle of the season, chronological. `win` is resolved against the player's
// USERNAME because that is what rotom_replays.winner stores (see the repository).
export interface SeasonBattle {
  replayId: number;
  win: boolean;
  createdAt: Date | null;
}
