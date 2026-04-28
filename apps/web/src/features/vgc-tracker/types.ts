export type MatchFormat = 'BO1' | 'BO3';
export type MatchResult = 'win' | 'loss' | 'draw';
export type NotePhase = 'live' | 'post' | 'series';
export type SlotRole = 'lead1' | 'lead2' | 'back1' | 'back2' | 'unknown';
export type SessionType = 'ladder' | 'tournament';
export type OutcomeTag = 'skill' | 'misplay' | 'luck' | 'disconnect';

export interface PresetSlot {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  speciesId: string;
  speciesName: string;
  nickname?: string;
  item?: string;
  ability?: string;
  moves: string[];
  nature?: string;
}

export interface PresetVersion {
  version: number;
  name: string;
  exportString: string;
  slots: PresetSlot[];
  savedAt: number;
}

export interface TeamPreset {
  id: string;
  name: string;
  regulationId: string;
  exportString: string;
  slots: PresetSlot[];
  createdAt: number;
  updatedAt: number;
  currentVersion: number;
  versions: PresetVersion[];
}

export interface Session {
  id: string;
  type: SessionType;
  label: string;
  format: MatchFormat;
  regulationId: string;
  activePresetId: string;
  startElo?: number;
  startedAt: number;
  tournamentName?: string;
  limitlessTournamentId?: number;
  archivedAt?: number;
  sessionNotes?: string;
}

export interface SeriesGame {
  id: string;
  gameNumber: 1 | 2 | 3;
  mySlots: MatchSlot[];
  opponentSlots: MatchSlot[];
  result?: MatchResult;
  notes: MatchNote[];
  completedAt?: number;
  outcomeTag?: OutcomeTag;
  turnCount?: number;
}

export interface Series {
  id: string;
  sessionId: string;
  createdAt: number;
  completedAt?: number;
  roundNumber?: number;
  opponentName?: string;
  opponentArchetype?: string;
  myTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  games: SeriesGame[];
  seriesResult?: MatchResult;
  notes: MatchNote[];
}

export interface MatchSlot {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  speciesId: string | null;
  speciesName: string | null;
  role: SlotRole;
}

export interface TeamSnapshot {
  presetId?: string;
  slots: MatchSlot[];
}

export interface MatchNote {
  id: string;
  text: string;
  createdAt: number;
  phase: NotePhase;
}

export interface Match {
  id: string;
  sessionId: string;
  format: MatchFormat;
  createdAt: number;
  completedAt?: number;
  myTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  opponentName?: string;
  result?: MatchResult;
  eloAfter?: number;
  opponentElo?: number;
  notes: MatchNote[];
  outcomeTag?: OutcomeTag;
  turnCount?: number;
  opponentArchetype?: string;
}

export type SpeciesEntry = { id: string; name: string; num: number };

const SPRITE_BASE      = 'https://play.pokemonshowdown.com/sprites/home-centered/';
const SPRITE_BASE_GEN5 = 'https://play.pokemonshowdown.com/sprites/gen5/';
const SPRITE_BASE_DEX  = 'https://play.pokemonshowdown.com/sprites/dex/';
const SUBSTITUTE_URL   = 'https://play.pokemonshowdown.com/sprites/dex/substitute.png';

/** Explicit Showdown slug overrides for forms that don't follow any generic rule. */
const SPRITE_SLUG_OVERRIDES: Record<string, string> = {
  'urshifu-single-strike': 'urshifu',      // single-strike is the base form — no suffix
  'floette-eternal-mega':  'floette-mega', // mega variant uses gen5/floette-mega.png slug
};

/**
 * Slugs that only exist in the dex sprite sheet — no home-centered or gen5 asset.
 * These bypass base URL selection entirely.
 */
const SPRITE_DEX_SLUGS = new Set([
  'floette-eternal', // AZ's Floette — only available in dex sprites
]);

/**
 * Collapses double-hyphenated form names to the Showdown sprite convention:
 * "necrozma-dusk-mane" → "necrozma-duskmane"
 * "calyrex-ice-rider"  → "calyrex-icerider"
 * Single-hyphen names (rotom-wash, kyurem-black) are returned unchanged.
 */
function normalizeFormSlug(slug: string): string {
  const firstHyphen = slug.indexOf('-');
  if (firstHyphen === -1) return slug;
  const formPart = slug.slice(firstHyphen + 1);
  if (!formPart.includes('-')) return slug;
  return slug.slice(0, firstHyphen) + '-' + formPart.replace(/-/g, '');
}

/** Returns true for Mega / Mega-X / Mega-Y forms. */
function isMegaSlug(slug: string): boolean {
  return /-mega(-[xy])?$/.test(slug);
}

/** Primary sprite URL: spaces → hyphens, then form slug normalised for Showdown.
 *  Mega forms use gen5 sprites (home-centered has no mega assets). */
export function spriteUrl(speciesName: string): string {
  const slug = speciesName
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, '')
    .replace(/\s+/g, '-');
  if (SPRITE_DEX_SLUGS.has(slug)) return `${SPRITE_BASE_DEX}${slug}.png`;
  const base = isMegaSlug(slug) ? SPRITE_BASE_GEN5 : SPRITE_BASE;
  if (SPRITE_SLUG_OVERRIDES[slug]) return `${base}${SPRITE_SLUG_OVERRIDES[slug]}.png`;
  return `${base}${normalizeFormSlug(slug)}.png`;
}

/**
 * onError handler for Pokémon sprite <img> tags.
 * Attempt 1 – try toID (strips ALL non-alphanumeric, fixes Kommo-o → kommoo.png).
 * Attempt 2 – show substitute sprite (dex fallback, always exists).
 */
export function handleSpriteError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.src === SUBSTITUTE_URL) return;

  if (!img.dataset.triedAlt) {
    img.dataset.triedAlt = '1';
    const matchHome = img.src.match(/\/sprites\/home-centered\/([^.]+)\.png/);
    const matchGen5 = img.src.match(/\/sprites\/gen5\/([^.]+)\.png/);
    const match = matchHome ?? matchGen5;
    const base  = matchGen5 ? SPRITE_BASE_GEN5 : SPRITE_BASE;
    if (match) {
      const toIdUrl = `${base}${match[1].replace(/[^a-z0-9]/g, '')}.png`;
      if (toIdUrl !== img.src) {
        img.src = toIdUrl;
        return;
      }
    }
  }

  img.src = SUBSTITUTE_URL;
}

export function emptySlots(): MatchSlot[] {
  return [0, 1, 2, 3, 4, 5].map((i) => ({
    slotIndex: i as MatchSlot['slotIndex'],
    speciesId: null,
    speciesName: null,
    role: 'unknown',
  }));
}

export function slotsFromPreset(preset: TeamPreset): MatchSlot[] {
  return preset.slots.map((s) => ({
    slotIndex: s.slotIndex,
    speciesId: s.speciesId,
    speciesName: s.speciesName,
    role: 'unknown' as SlotRole,
  }));
}

export function cycleRole(current: SlotRole): SlotRole {
  if (current === 'unknown') return 'lead1';
  if (current === 'lead1') return 'lead2';
  if (current === 'lead2') return 'back1';
  if (current === 'back1') return 'back2';
  return 'unknown';
}

/** True if this role is a lead position */
export function isLead(role: SlotRole): boolean {
  return role === 'lead1' || role === 'lead2';
}

/** True if this role is a back position */
export function isBack(role: SlotRole): boolean {
  return role === 'back1' || role === 'back2';
}

/** Copy series-level slots with all roles reset to 'unknown' for a fresh game. */
export function slotsForGame(seriesSlots: MatchSlot[]): MatchSlot[] {
  return seriesSlots.map((s) => ({ ...s, role: 'unknown' as SlotRole }));
}

export function seriesScore(games: SeriesGame[]): { wins: number; losses: number } {
  return {
    wins: games.filter((g) => g.result === 'win').length,
    losses: games.filter((g) => g.result === 'loss').length,
  };
}

export function computeSeriesResult(games: SeriesGame[]): MatchResult | undefined {
  const { wins, losses } = seriesScore(games);
  if (wins >= 2) return 'win';
  if (losses >= 2) return 'loss';
  return undefined;
}
