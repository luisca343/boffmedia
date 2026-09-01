/**
 * VGC meta / Champions / Limitless data, through `@boffmedia/tool-kit`'s `api`
 * capability.
 *
 * This is the READ surface only. The web's `vgcService.ts` also carries the
 * admin writes (snapshot fetches, paste ingestion, regulation upserts), and
 * those stay there: they take an explicit bearer, they are reachable only from
 * `/admin`, and no VGC tool screen calls one. Porting them would put an admin
 * API into a package shipped to every desktop user for no gain.
 *
 * Query strings are still built with `URLSearchParams` rather than handed to
 * the capability's `query` option, so the paths below read identically to the
 * web originals they were lifted from.
 */

import type {
  ChampionsPasteDetailDto,
  ChampionsRegulationDto,
  DivergenceResultDto,
  DivergenceRowDto,
  Gen9DataDto,
  ImportJobStatusDto,
  LimitlessPlayerDto,
  LimitlessPlayerTeamDto,
  LimitlessTournamentDto,
  PokemonUsageDetailDto,
  PokemonUsageEntryDto,
  SmogonSnapshotDto,
  SpeciesTeamEntryDto,
  SpeedTierEntryDto,
  VgcMetaSlotDto,
  VgcPokemonDto,
} from "@boffmedia/shared";

import { request, type ApiResponse } from "../api";

export type { ApiResponse };

// ─── VGC Meta Analysis ───────────────────────────────────────────────────────

export type SmogonSnapshot = SmogonSnapshotDto;
export type PokemonUsageEntry = PokemonUsageEntryDto;
export type PokemonUsageDetail = PokemonUsageDetailDto;

/** Paste-derived breakdown for a Champions species. */
export type ChampionsPasteDetail = ChampionsPasteDetailDto;

export class VgcMetaService {
  static getAvailableSnapshots() {
    return request<SmogonSnapshot[]>("/tools/vgc/meta/smogon/available");
  }

  /** Returns full PokemonUsageDetail[] — all Pokémon in one request, frontend builds a Map */
  static getSmogonUsage(format: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set("month", month);
    if (cutoff !== undefined) params.set("cutoff", String(cutoff));
    return request<PokemonUsageDetail[]>(`/tools/vgc/meta/smogon?${params}`);
  }

  static getSmogonUsageList(format: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set("month", month);
    if (cutoff !== undefined) params.set("cutoff", String(cutoff));
    return request<PokemonUsageEntry[]>(`/tools/vgc/meta/smogon/list?${params}`);
  }

  static getSmogonDetail(format: string, speciesId: string, month?: string, cutoff?: number) {
    const params = new URLSearchParams({ format });
    if (month)                params.set("month", month);
    if (cutoff !== undefined) params.set("cutoff", String(cutoff));
    return request<PokemonUsageDetail>(`/tools/vgc/meta/smogon/${speciesId}?${params}`);
  }

  /** Every active regulation. Sole source for regulation pickers. */
  static getRegulations() {
    return request<ChampionsRegulation[]>("/tools/vgc/meta/regulations");
  }

  static getChampionsUsage(regulationId: string) {
    return request<PokemonUsageDetail[]>(`/tools/vgc/meta/champions?regulationId=${regulationId}`);
  }

  static getChampionsUsageList(regulationId: string) {
    return request<PokemonUsageEntry[]>(`/tools/vgc/meta/champions/list?regulationId=${regulationId}`);
  }

  static getChampionsPasteDetail(regulationId: string, speciesId: string) {
    return request<ChampionsPasteDetail>(
      `/tools/vgc/meta/champions/${speciesId}/detail?regulationId=${regulationId}`,
    );
  }

  // ─── Limitless ─────────────────────────────────────────────────────────────

  static getLimitlessTournamentStatus(tournamentId: number) {
    return request<LimitlessImportJobStatus>(
      `/tools/vgc/meta/limitless/tournament/${tournamentId}/status`,
    );
  }

  static getLimitlessTournaments(regulationId?: string) {
    if (regulationId) {
      return request<LimitlessTournament[]>(
        `/tools/vgc/meta/limitless/tournaments?regulationId=${regulationId}`,
      );
    }
    return request<LimitlessTournament[]>("/tools/vgc/meta/limitless");
  }

  static getLimitlessUsage(tournamentId: number) {
    return request<PokemonUsageDetail[]>(
      `/tools/vgc/meta/limitless/usage?tournamentId=${tournamentId}`,
    );
  }

  static getLimitlessUsageList(tournamentId: number) {
    return request<PokemonUsageEntry[]>(
      `/tools/vgc/meta/limitless/usage/list?tournamentId=${tournamentId}`,
    );
  }

  static getLimitlessCombinedUsage(regulationId: string) {
    return request<PokemonUsageDetail[]>(
      `/tools/vgc/meta/limitless/usage/combined?regulationId=${regulationId}`,
    );
  }

  static getLimitlessCombinedUsageList(regulationId: string) {
    return request<PokemonUsageEntry[]>(
      `/tools/vgc/meta/limitless/usage/combined/list?regulationId=${regulationId}`,
    );
  }

  static getLimitlessPlayers(tournamentId: number) {
    return request<LimitlessPlayerEntry[]>(`/tools/vgc/meta/limitless/${tournamentId}/players`);
  }

  static getLimitlessPlayerTeam(tournamentId: number, slug: string) {
    return request<LimitlessPlayerTeam>(
      `/tools/vgc/meta/limitless/${tournamentId}/player/${encodeURIComponent(slug)}`,
    );
  }

  // ─── Species Teams ─────────────────────────────────────────────────────────

  static getSpeciesTeams(speciesId: string, regulationId: string) {
    const params = new URLSearchParams({ speciesId, regulationId });
    return request<SpeciesTeamEntry[]>(`/tools/vgc/meta/teams?${params}`);
  }

  static getDivergence(params: {
    regulationId: string;
    tournamentId?: number;
    month?: string;
    cutoff?: number;
  }) {
    const search = new URLSearchParams({ regulationId: params.regulationId });
    if (params.tournamentId !== undefined) search.set("tournamentId", String(params.tournamentId));
    if (params.month) search.set("month", params.month);
    if (params.cutoff !== undefined) search.set("cutoff", String(params.cutoff));
    return request<DivergenceResultDto>(`/tools/vgc/meta/divergence?${search}`);
  }
}

export type ChampionsRegulation = ChampionsRegulationDto;

// ─── Limitless types ─────────────────────────────────────────────────────────

export type LimitlessTournament = LimitlessTournamentDto;
export type LimitlessPlayerEntry = LimitlessPlayerDto;
export type LimitlessMetaSlot = VgcMetaSlotDto;
export type LimitlessPlayerTeam = LimitlessPlayerTeamDto;
export type LimitlessImportJobStatus = ImportJobStatusDto;
export type SpeedTierEntry = SpeedTierEntryDto;
export type VgcPokemon = VgcPokemonDto;

export class VgcService {
  /** @see VgcMetaService.getRegulations — same endpoint, kept for VGC-tool callers. */
  static getChampionsRegulations() {
    return VgcMetaService.getRegulations();
  }

  static getChampionsSpeedTiers(regulationId: string) {
    return request<SpeedTierEntry[]>(`/tools/vgc/champions/${regulationId}/speed-tiers`);
  }

  static getChampionsLegalPokemon(regulationId: string) {
    return request<VgcPokemon[]>(`/tools/vgc/champions/${regulationId}/pokemon`);
  }

  static getChampionsGameData(regulationId: string) {
    return request<Gen9DataDto>(`/tools/vgc/champions/${regulationId}/game-data`);
  }

  static getLimitlessTournaments(regulationId?: string) {
    return VgcMetaService.getLimitlessTournaments(regulationId);
  }

  static getLimitlessCombinedUsage(regulationId: string) {
    return VgcMetaService.getLimitlessCombinedUsage(regulationId);
  }
}

// ─── Species Teams ────────────────────────────────────────────────────────────

export type SpeciesTeamSlot = VgcMetaSlotDto;
export type SpeciesTeamEntry = SpeciesTeamEntryDto;

// ─── Divergence types ────────────────────────────────────────────────────────

export type DivergenceBadge = DivergenceRowDto["badge"];
export type DivergenceRow = DivergenceRowDto;
export type DivergenceResult = DivergenceResultDto;
