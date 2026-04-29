import { apiGET, apiDELETE, apiAuthedGET, apiAuthedPOST, apiAuthedDELETE } from '@/services/boffAPI';
import type { BatchFetchResultDto, ChampionsPasteDetailDto } from '@boffmedia/shared';

// ─── VGC Meta Analysis ────────────────────────────────────────────────────────

export interface SmogonSnapshot {
  id:           number;
  formatId:     string;
  month:        string;
  cutoff:       number;
  pokemonCount: number;
  fetchedAt:    string;
}

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

export interface PokemonUsageDetail extends PokemonUsageEntry {
  baseStats:  { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities:  Array<{ name: string; percent: number }>;
  items:      Array<{ name: string; percent: number }>;
  moves:      Array<{ name: string; percent: number }>;
  teraTypes:  Array<{ name: string; percent: number }>;
  teammates:  Array<{ name: string; percent: number }>;
  spreads:    Array<{ nature: string; spread: string; percent: number }>;
}

/** Paste-derived breakdown for a Champions species (Phase 3) */
export type ChampionsPasteDetail = ChampionsPasteDetailDto;

/** Result of a batch paste-fetch operation */
export type BatchFetchResult = BatchFetchResultDto;

export class VgcMetaService {
  static getAvailableSnapshots() {
    return apiGET<SmogonSnapshot[]>('/tools/vgc/meta/smogon/available');
  }

  /** Returns full PokemonUsageDetail[] — all Pokémon in one request, frontend builds a Map */
  static getSmogonUsage(format: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set('month', month);
    if (cutoff !== undefined) params.set('cutoff', String(cutoff));
    return apiGET<PokemonUsageDetail[]>(`/tools/vgc/meta/smogon?${params}`);
  }

  static getSmogonUsageList(format: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set('month', month);
    if (cutoff !== undefined) params.set('cutoff', String(cutoff));
    return apiGET<PokemonUsageEntry[]>(`/tools/vgc/meta/smogon/list?${params}`);
  }

  static getSmogonDetail(format: string, speciesId: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set('month', month);
    if (cutoff !== undefined) params.set('cutoff', String(cutoff));
    return apiGET<PokemonUsageDetail>(`/tools/vgc/meta/smogon/${speciesId}?${params}`);
  }

  static fetchSmogonSnapshot(format: string, month: string, cutoff: number, token: string) {
    return apiAuthedPOST<{ count: number }>('/tools/vgc/meta/smogon/fetch', { format, month, cutoff }, token);
  }

  static deleteSmogonSnapshot(format: string, month: string, cutoff: number, token: string) {
    const params = new URLSearchParams({ format, month, cutoff: String(cutoff) });
    return apiAuthedDELETE<void>(`/tools/vgc/meta/smogon/snapshot?${params}`, token);
  }

  static getAvailableChampionsRegulations() {
    return apiGET<ChampionsRegulation[]>('/tools/vgc/meta/regulations');
  }

  static getChampionsUsage(regulationId: string) {
    return apiGET<PokemonUsageDetail[]>(`/tools/vgc/meta/champions?regulationId=${regulationId}`);
  }

  static getChampionsUsageList(regulationId: string) {
    return apiGET<PokemonUsageEntry[]>(`/tools/vgc/meta/champions/list?regulationId=${regulationId}`);
  }

  static refreshChampions(regulationId: string, token: string) {
    return apiAuthedPOST<{ count: number }>(
      `/tools/vgc/meta/champions/refresh?regulationId=${regulationId}`,
      {},
      token,
    );
  }

  static getChampionsPasteDetail(regulationId: string, speciesId: string) {
    return apiGET<ChampionsPasteDetail>(
      `/tools/vgc/meta/champions/${speciesId}/detail?regulationId=${regulationId}`,
    );
  }

  static fetchChampionsPastes(regulationId: string, token: string) {
    return apiAuthedPOST<BatchFetchResult>(
      `/tools/vgc/meta/champions/fetch-pastes?regulationId=${regulationId}`,
      {},
      token,
    );
  }

  // ─── Limitless ─────────────────────────────────────────────────────────────

  static importLimitlessTournament(url: string, regulationId: string, token: string, maxPlayers?: number) {
    return apiAuthedPOST<{ tournamentId: number }>('/tools/vgc/meta/limitless/tournament', {
      url,
      regulationId,
      ...(maxPlayers !== undefined ? { maxPlayers } : {}),
    }, token);
  }

  static getLimitlessTournamentStatus(tournamentId: number) {
    return apiGET<LimitlessImportJobStatus>(
      `/tools/vgc/meta/limitless/tournament/${tournamentId}/status`,
    );
  }

  static getLimitlessTournaments(regulationId?: string) {
    if (regulationId) {
      return apiGET<LimitlessTournament[]>(
        `/tools/vgc/meta/limitless/tournaments?regulationId=${regulationId}`,
      );
    }
    return apiGET<LimitlessTournament[]>('/tools/vgc/meta/limitless');
  }

  static getLimitlessUsage(tournamentId: number) {
    return apiGET<PokemonUsageDetail[]>(
      `/tools/vgc/meta/limitless/usage?tournamentId=${tournamentId}`,
    );
  }

  static getLimitlessUsageList(tournamentId: number) {
    return apiGET<PokemonUsageEntry[]>(
      `/tools/vgc/meta/limitless/usage/list?tournamentId=${tournamentId}`,
    );
  }

  static getLimitlessCombinedUsage(regulationId: string) {
    return apiGET<PokemonUsageDetail[]>(
      `/tools/vgc/meta/limitless/usage/combined?regulationId=${regulationId}`,
    );
  }

  static getLimitlessCombinedUsageList(regulationId: string) {
    return apiGET<PokemonUsageEntry[]>(
      `/tools/vgc/meta/limitless/usage/combined/list?regulationId=${regulationId}`,
    );
  }

  static getLimitlessPlayers(tournamentId: number) {
    return apiGET<LimitlessPlayerEntry[]>(
      `/tools/vgc/meta/limitless/${tournamentId}/players`,
    );
  }

  static getLimitlessPlayerTeam(tournamentId: number, slug: string) {
    return apiGET<LimitlessPlayerTeam>(
      `/tools/vgc/meta/limitless/${tournamentId}/player/${encodeURIComponent(slug)}`,
    );
  }

  // ─── Species Teams ─────────────────────────────────────────────────────────

  static getSpeciesTeams(speciesId: string, regulationId: string) {
    const params = new URLSearchParams({ speciesId, regulationId });
    return apiGET<SpeciesTeamEntry[]>(`/tools/vgc/meta/teams?${params}`);
  }

  static getIngestionJobs(regulationId?: string) {
    const params = new URLSearchParams();
    if (regulationId) params.set('regulationId', regulationId);
    const query = params.toString();
    return apiGET<VgcIngestionJob[]>(`/tools/vgc/meta/jobs${query ? `?${query}` : ''}`);
  }

  static getPersonalMetaComparison(
    token: string,
    params: {
      regulationId: string;
      source?: 'auto' | 'smogon' | 'champions' | 'limitless';
      month?: string;
      cutoff?: number;
    },
  ) {
    const search = new URLSearchParams({ regulationId: params.regulationId });
    if (params.source) search.set('source', params.source);
    if (params.month) search.set('month', params.month);
    if (params.cutoff !== undefined) search.set('cutoff', String(params.cutoff));
    return apiAuthedGET<PersonalMetaComparison>(`/tools/vgc/meta/compare/personal?${search}`, token);
  }
}

export interface VgcIngestionJob {
  id: string;
  type: 'smogon_snapshot' | 'champions_regulation' | 'limitless_tournament';
  status: 'idle' | 'queued' | 'running' | 'done' | 'error';
  revisionKey: string;
  progress?: number;
  total?: number;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  metadata: Record<string, unknown>;
}

export interface PersonalMetaComparisonRow {
  speciesId: string;
  speciesName: string;
  personalUsagePercent: number;
  metaUsagePercent: number;
  deltaPercent: number;
  absDeltaPercent: number;
  personalRawCount: number;
  metaRawCount: number;
}

export interface PersonalMetaComparison {
  regulationId: string;
  source: 'smogon' | 'champions' | 'limitless';
  personalSampleSize: number;
  rowCount: number;
  rows: PersonalMetaComparisonRow[];
}

export interface ChampionsRegulation {
  id:           string;
  formatId:     string;
  name:         string;
  gameType:     string;
  vgcPastesGid: string | null;
  importStatus?: 'idle' | 'running_csv' | 'running_pastes' | 'done' | 'error';
  importError?: string | null;
  importTeamCount?: number;
  importFetchedCount?: number;
  importStartedAt?: string | null;
  importCompletedAt?: string | null;
  active:       number;
  createdAt:    string;
}

export interface UpsertRegulationPayload {
  id: string;
  formatId: string;
  name: string;
  gameType?: 'singles' | 'doubles';
  vgcPastesGid?: string | null;
}

export class VgcRegulationsAdminService {
  static upsertRegulation(payload: UpsertRegulationPayload, token: string) {
    return apiAuthedPOST<ChampionsRegulation>('/tools/vgc/meta/regulations', payload, token);
  }
}

// ─── Limitless types ─────────────────────────────────────────────────────────

export interface LimitlessTournament {
  id:           number;
  limitlessId:  string;
  name:         string | null;
  date:         string | null;
  format:       string | null;
  regulationId: string;
  playerCount:  number | null;
  status:       'pending' | 'running' | 'done' | 'error';
  progress:     number;
  total:        number;
  errorMessage: string | null;
  fetchedAt:    string;
}

export interface LimitlessPlayerEntry {
  playerSlug: string;
  playerName: string;
  placing:    number;
  record:     string;
  drop:       number | null;
  hasTeam:    boolean;
}

export interface LimitlessMetaSlot {
  slotIndex:   number;
  speciesId:   string;
  speciesName: string;
  item?:       string;
  ability?:    string;
  moves:       string[];
  tera?:       string;
}

export interface LimitlessPlayerTeam {
  playerSlug: string;
  playerName: string;
  placing:    number;
  record:     string;
  rawText:    string;
  slots:      LimitlessMetaSlot[];
}

export interface LimitlessImportJobStatus {
  tournamentId: number;
  status:       string;
  progress:     number;
  total:        number;
  errorMessage?: string;
}

export interface SpeedTierEntry {
  name: string;
  num: number;
  types: string[];
  baseSpeed: number;
  abilities: { [slot: string]: string };
  isRestricted: boolean;
  isMythical: boolean;
  requiredItem: string | null;
  speedTiers: {
    min: number;
    minPlus: number;
    max: number;
    maxPlus: number;
    scarf: number | null;
    scarfPlus: number | null;
  };
}

export interface VgcPokemon {
  name: string;
  num: number;
  types: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities: { [slot: string]: string };
  weightkg: number;
  isRestricted: boolean;
  isMythical: boolean;
  requiredItem: string | null;
}

export class VgcService {
  static getChampionsRegulations() {
    return apiGET<ChampionsRegulation[]>('/tools/vgc/meta/regulations');
  }

  static getChampionsSpeedTiers(regulationId: string) {
    return apiGET<SpeedTierEntry[]>(`/tools/vgc/champions/${regulationId}/speed-tiers`);
  }

  static getChampionsLegalPokemon(regulationId: string) {
    return apiGET<VgcPokemon[]>(`/tools/vgc/champions/${regulationId}/pokemon`);
  }

  static getLimitlessTournaments(regulationId?: string) {
    if (regulationId) {
      return apiGET<LimitlessTournament[]>(
        `/tools/vgc/meta/limitless/tournaments?regulationId=${regulationId}`,
      );
    }
    return apiGET<LimitlessTournament[]>('/tools/vgc/meta/limitless');
  }

  static getLimitlessCombinedUsage(regulationId: string) {
    return apiGET<PokemonUsageDetail[]>(
      `/tools/vgc/meta/limitless/usage/combined?regulationId=${regulationId}`,
    );
  }
}

// ─── Species Teams ────────────────────────────────────────────────────────────

export interface SpeciesTeamSlot {
  slotIndex:   number;
  speciesId:   string;
  speciesName: string;
  item?:       string;
  ability?:    string;
  moves:       string[];
  tera?:       string;
}

export interface SpeciesTeamEntry {
  source:     'vgcpastes' | 'limitless';
  playerId:   string;
  playerName: string | null;
  record:     string | null;
  rank:       string | null;
  slots:      SpeciesTeamSlot[];
  rawText:    string;
}
