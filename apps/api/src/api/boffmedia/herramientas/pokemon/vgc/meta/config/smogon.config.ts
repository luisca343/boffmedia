export const SMOGON_DEFAULT_CUTOFF = 1760;
export const SMOGON_VALID_CUTOFFS = [0, 1500, 1630, 1760] as const;
export type SmogonCutoff = (typeof SMOGON_VALID_CUTOFFS)[number];

const SMOGON_BASE = 'https://www.smogon.com/stats';

export function smogonUsageUrl(
  format: string,
  month: string,
  cutoff: number,
): string {
  return `${SMOGON_BASE}/${month}/${format}-${cutoff}.txt`;
}

export function smogonMovesetUrl(
  format: string,
  month: string,
  cutoff: number,
): string {
  return `${SMOGON_BASE}/${month}/moveset/${format}-${cutoff}.txt`;
}

/** VGCPastes base sheet URL. GID is per-regulation and stored in CHAMPIONS_REGULATIONS. */
export const VGCPASTES_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/export?format=csv&gid=';

export const POKEPASTE_BASE = 'https://pokepast.es';

export const LIMITLESS_BASE = 'https://play.limitlesstcg.com/tournament';
export const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';

/** Rate limit for Limitless JSON API: 50 requests per 5 minutes */
export const LIMITLESS_RATE_LIMIT = {
  requests: 50,
  windowMs: 5 * 60 * 1000,
} as const;

/** Max parallel requests when batch-fetching pastes */
export const POKEPASTE_CONCURRENCY = 10;
