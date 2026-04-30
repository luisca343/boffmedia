import { Injectable, NotFoundException } from '@nestjs/common';
import { FetchSmogonDto } from './dto/fetch-smogon.dto';
import { SmogonService } from './services/smogon.service';
import { VgcPastesService } from './services/vgcpastes.service';
import { PokepasteService } from './services/pokepaste.service';
import { LimitlessService } from './services/limitless.service';
import { TeamsService } from './services/teams.service';
import { StatCalcService } from './services/stat-calc.service';
import { QuerySmogonDto } from './dto/query-smogon.dto';
import { QueryChampionsDto } from './dto/query-champions.dto';
import { AddLimitlessTournamentDto } from './dto/add-limitless-tournament.dto';
import { UpsertRegulationDto } from './dto/upsert-regulation.dto';
import { SMOGON_DEFAULT_CUTOFF } from './config/smogon.config';
import { VgcRegulationsRepository } from './repositories/regulations.repository';
import { IngestionJobsService } from './services/ingestion-jobs.service';
import { PersonalMetaAnalyticsService } from './services/personal-meta-analytics.service';
import { DivergenceService } from './services/divergence.service';
import { QueryPersonalMetaDto } from './dto/query-personal-meta.dto';
import { QueryDivergenceDto } from './dto/query-divergence.dto';

@Injectable()
export class VgcMetaFacadeService {
  constructor(
    private readonly smogonService: SmogonService,
    private readonly vgcPastesService: VgcPastesService,
    private readonly pokepasteService: PokepasteService,
    private readonly limitlessService: LimitlessService,
    private readonly teamsService: TeamsService,
    readonly statCalcService: StatCalcService,
    private readonly regulationsRepository: VgcRegulationsRepository,
    private readonly ingestionJobsService: IngestionJobsService,
    private readonly personalMetaAnalyticsService: PersonalMetaAnalyticsService,
    private readonly divergenceService: DivergenceService,
  ) {}

  // â”€â”€â”€ Ladder (Smogon) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getAvailableSmogonSnapshots() {
    return this.smogonService.getAvailableSnapshots();
  }

  async fetchSmogonSnapshot(dto: FetchSmogonDto) {
    const regulation = await this.regulationsRepository.findByFormatId(dto.format);
    if (!regulation) {
      throw new NotFoundException(
        `Format \"${dto.format}\" is not registered in vgc_regulations. Create it from admin first.`,
      );
    }
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    return this.smogonService.fetchAndStore(dto.format, dto.month, cutoff);
  }

  async deleteSmogonSnapshot(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month  = dto.month  ?? await this.resolveMostRecentMonth(dto.format, cutoff);
    return this.smogonService.deleteSnapshot(dto.format, month, cutoff);
  }

  async getSmogonUsage(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    // Month must be provided, or fall back to the most recent available snapshot
    const month = dto.month ?? await this.resolveMostRecentMonth(dto.format, cutoff);
    return this.smogonService.getUsageList(dto.format, month, cutoff);
  }

  async getSmogonUsageList(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month = dto.month ?? await this.resolveMostRecentMonth(dto.format, cutoff);
    return this.smogonService.getUsageEntries(dto.format, month, cutoff);
  }

  async getSmogonDetail(dto: QuerySmogonDto & { speciesId: string }) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month = dto.month ?? await this.resolveMostRecentMonth(dto.format, cutoff);
    return this.smogonService.getPokemonDetail(dto.format, month, cutoff, dto.speciesId);
  }

  private async resolveMostRecentMonth(formatId: string, cutoff: number): Promise<string> {
    const snapshots = await this.smogonService.getAvailableSnapshots();
    const match = snapshots.find((s) => s.formatId === formatId && s.cutoff === cutoff);
    if (match) return match.month;
    throw new NotFoundException(`No snapshot available for ${formatId}-${cutoff}. Fetch it from the admin panel.`);
  }

  // â”€â”€â”€ Champions (VGCPastes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getAvailableChampionsRegulations() {
    return this.vgcPastesService.getAvailableRegulations();
  }

  async getChampionsUsage(dto: QueryChampionsDto) {
    const regulation = await this.regulationsRepository.findById(dto.regulationId);
    if (!regulation) throw new NotFoundException(`Regulation "${dto.regulationId}" not found`);
    if (!regulation.vgcPastesGid) throw new NotFoundException(`No VGCPastes GID configured for "${dto.regulationId}"`);
    return this.vgcPastesService.getUsageList(dto.regulationId);
  }

  async getChampionsUsageList(dto: QueryChampionsDto) {
    const regulation = await this.regulationsRepository.findById(dto.regulationId);
    if (!regulation) throw new NotFoundException(`Regulation "${dto.regulationId}" not found`);
    if (!regulation.vgcPastesGid) throw new NotFoundException(`No VGCPastes GID configured for "${dto.regulationId}"`);
    return this.vgcPastesService.getUsageEntries(dto.regulationId);
  }

  async refreshChampionsData(regulationId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation) throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (!regulation.vgcPastesGid) throw new NotFoundException(`No VGCPastes GID configured for "${regulationId}"`);
    return this.vgcPastesService.refreshRegulation(regulationId, regulation.vgcPastesGid);
  }

  async getChampionsPasteDetail(regulationId: string, speciesId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation) throw new NotFoundException(`Regulation "${regulationId}" not found`);
    return this.vgcPastesService.getPasteDetail(regulationId, speciesId);
  }

  async batchFetchChampionsPastes(regulationId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation) throw new NotFoundException(`Regulation "${regulationId}" not found`);
    return this.vgcPastesService.batchFetchRegulation(regulationId);
  }

  // â”€â”€â”€ Limitless â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async importLimitlessTournament(dto: AddLimitlessTournamentDto) {
    return this.limitlessService.importTournament(dto.url, dto.regulationId, dto.maxPlayers);
  }

  async getLimitlessUsage(tournamentId: number) {
    return this.limitlessService.getUsageList(tournamentId);
  }

  async getLimitlessUsageList(tournamentId: number) {
    return this.limitlessService.getUsageEntries(tournamentId);
  }

  async getLimitlessCombinedUsage(regulationId: string) {
    return this.limitlessService.getCombinedUsage(regulationId);
  }

  async getLimitlessCombinedUsageList(regulationId: string) {
    return this.limitlessService.getCombinedUsageEntries(regulationId);
  }

  async getLimitlessTournamentStatus(id: number) {
    return this.limitlessService.getJobStatus(id);
  }

  async getLimitlessTournamentsByRegulation(regulationId: string) {
    return this.limitlessService.listTournamentsByRegulation(regulationId);
  }

  async getLimitlessPlayers(tournamentId: number) {
    return this.limitlessService.getPlayerList(tournamentId);
  }

  async getLimitlessPlayerTeam(tournamentId: number, slug: string) {
    return this.limitlessService.getPlayerTeam(tournamentId, slug);
  }

  async listLimitlessTournaments() {
    return this.limitlessService.listTournaments();
  }

  // ─── Regulations ────────────────────────────────────────────────────────────

  async getRegulations() {
    return this.regulationsRepository.findActive();
  }

  async upsertRegulation(dto: UpsertRegulationDto) {
    await this.regulationsRepository.upsert({
      id:           dto.id,
      formatId:     dto.formatId,
      name:         dto.name,
      gameType:     dto.gameType,
      vgcPastesGid: dto.vgcPastesGid,
    });
    return this.regulationsRepository.findById(dto.id);
  }

  // ─── Species Teams ──────────────────────────────────────────────────────────

  async getSpeciesTeams(speciesId: string, regulationId: string) {
    return this.teamsService.getTeamsForSpecies(speciesId, regulationId);
  }

  // ─── Unified jobs + analytics ─────────────────────────────────────────────

  async getIngestionJobs(regulationId?: string) {
    return this.ingestionJobsService.listJobs(regulationId);
  }

  async comparePersonalVsMeta(userId: number, dto: QueryPersonalMetaDto) {
    return this.personalMetaAnalyticsService.comparePersonalVsMeta(userId, {
      regulationId: dto.regulationId,
      source: dto.source ?? 'auto',
      month: dto.month,
      cutoff: dto.cutoff ?? SMOGON_DEFAULT_CUTOFF,
    });
  }

  // ─── Divergence (ladder vs tournament) ───────────────────────────────────────

  async getDivergence(dto: QueryDivergenceDto) {
    return this.divergenceService.compareLadderVsTournament({
      regulationId: dto.regulationId,
      tournamentId: dto.tournamentId,
      month:        dto.month,
      cutoff:       dto.cutoff ?? SMOGON_DEFAULT_CUTOFF,
    });
  }
}
