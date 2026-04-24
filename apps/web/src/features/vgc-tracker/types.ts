export type MatchFormat = 'BO1' | 'BO3';
export type MatchResult = 'win' | 'loss' | 'draw';
export type NotePhase = 'live' | 'post';
export type SlotRole = 'lead' | 'back' | 'unknown';

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

export interface TeamPreset {
  id: string;
  name: string;
  regulationId: string;
  exportString: string;
  slots: PresetSlot[];
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  label: string;
  format: MatchFormat;
  regulationId: string;
  activePresetId: string;
  startElo?: number;
  startedAt: number;
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
  result?: MatchResult;
  eloAfter?: number;
  opponentElo?: number;
  notes: MatchNote[];
}

export type SpeciesEntry = { id: string; name: string; num: number };

const SPRITE_BASE = 'https://play.pokemonshowdown.com/sprites/dex/';
const SUBSTITUTE_URL = `${SPRITE_BASE}substitute.png`;

/** Primary sprite URL: spaces → hyphens, other hyphens preserved.
 *  Correct for forme Pokémon (Rotom-Wash → rotom-wash.png). */
export function spriteUrl(speciesName: string): string {
  return `${SPRITE_BASE}${speciesName
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, '')
    .replace(/\s+/g, '-')}.png`;
}

/**
 * onError handler for Pokémon sprite <img> tags.
 * Attempt 1 – try toID (strips ALL non-alphanumeric, fixes Kommo-o → kommoo.png).
 * Attempt 2 – show substitute sprite.
 */
export function handleSpriteError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.src === SUBSTITUTE_URL) return;

  if (!img.dataset.triedAlt) {
    img.dataset.triedAlt = '1';
    // Extract the filename from the current URL and strip hyphens/special chars.
    const match = img.src.match(/\/sprites\/dex\/([^.]+)\.png/);
    if (match) {
      const toIdUrl = `${SPRITE_BASE}${match[1].replace(/[^a-z0-9]/g, '')}.png`;
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
  if (current === 'unknown') return 'lead';
  if (current === 'lead') return 'back';
  return 'unknown';
}
