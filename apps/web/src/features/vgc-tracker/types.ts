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
  eloChange?: number;
  notes: MatchNote[];
}

export type SpeciesEntry = { id: string; name: string; num: number };

export function spriteUrl(speciesName: string): string {
  return `https://play.pokemonshowdown.com/sprites/dex/${speciesName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')}.png`;
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
