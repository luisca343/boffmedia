import { apiGET, apiDELETE, apiAuthedGET, apiAuthedPOST, apiAuthedDELETE } from '@/services/boffAPI';
import type {
  BatchFetchResultDto,
  ChampionsPasteDetailDto,
  ChampionsRegulationDto,
  CountResultDto,
  DivergenceResultDto,
  DivergenceRowDto,
  ImportJobStatusDto,
  LimitlessPlayerDto,
  LimitlessPlayerTeamDto,
  LimitlessTournamentDto,
  PersonalMetaComparisonDto,
  PersonalMetaComparisonRowDto,
  PokemonUsageDetailDto,
  PokemonUsageEntryDto,
  SmogonSnapshotDto,
  SpeciesTeamEntryDto,
  SpeedTierEntryDto,
  TournamentImportStartDto,
  UpsertRegulationDto,
  VgcIngestionJobDto,
  VgcMetaSlotDto,
  VgcPokemonDto,
} from '@boffmedia/shared';

// ─── VGC Meta Analysis ────────────────────────────────────────────────────────

export type SmogonSnapshot = SmogonSnapshotDto;
export type PokemonUsageEntry = PokemonUsageEntryDto;
export type PokemonUsageDetail = PokemonUsageDetailDto;

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
    return apiAuthedPOST<CountResultDto>('/tools/vgc/meta/smogon/fetch', { format, month, cutoff }, token);
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
    return apiAuthedPOST<CountResultDto>(
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
    return apiAuthedPOST<TournamentImportStartDto>('/tools/vgc/meta/limitless/tournament', {
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
    return apiGET<VgcIngestionJobDto[]>(`/tools/vgc/meta/jobs${query ? `?${query}` : ''}`);
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
    return apiAuthedGET<PersonalMetaComparisonDto>(`/tools/vgc/meta/compare/personal?${search}`, token);
  }

  static getDivergence(params: {
    regulationId: string;
    tournamentId?: number;
    month?: string;
    cutoff?: number;
  }) {
    const search = new URLSearchParams({ regulationId: params.regulationId });
    if (params.tournamentId !== undefined) search.set('tournamentId', String(params.tournamentId));
    if (params.month) search.set('month', params.month);
    if (params.cutoff !== undefined) search.set('cutoff', String(params.cutoff));
    return apiGET<DivergenceResultDto>(`/tools/vgc/meta/divergence?${search}`);
  }
}

export type VgcIngestionJob = VgcIngestionJobDto;
export type PersonalMetaComparisonRow = PersonalMetaComparisonRowDto;
export type PersonalMetaComparison = PersonalMetaComparisonDto;
export type ChampionsRegulation = ChampionsRegulationDto;
export type UpsertRegulationPayload = UpsertRegulationDto;

export class VgcRegulationsAdminService {
  static upsertRegulation(payload: UpsertRegulationPayload, token: string) {
    return apiAuthedPOST<ChampionsRegulation>('/tools/vgc/meta/regulations', payload, token);
  }
}

// ─── Limitless types ─────────────────────────────────────────────────────────

export type LimitlessTournament = LimitlessTournamentDto;
export type LimitlessPlayerEntry = LimitlessPlayerDto;
export type LimitlessMetaSlot = VgcMetaSlotDto;
export type LimitlessPlayerTeam = LimitlessPlayerTeamDto;
export type LimitlessImportJobStatus = ImportJobStatusDto;
export type SpeedTierEntry = SpeedTierEntryDto;
export type VgcPokemon = VgcPokemonDto;

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

export type SpeciesTeamSlot = VgcMetaSlotDto;
export type SpeciesTeamEntry = SpeciesTeamEntryDto;

// ─── Divergence types ────────────────────────────────────────────────────────

export type DivergenceBadge = DivergenceRowDto['badge'];
export type DivergenceRow = DivergenceRowDto;
export type DivergenceResult = DivergenceResultDto;
