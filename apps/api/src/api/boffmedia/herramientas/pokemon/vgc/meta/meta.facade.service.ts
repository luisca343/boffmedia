import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Dex } from '@pkmn/sim';
import { initChampionsMod, listChampionsFormatIds } from '@boffmedia/battle-core';
import { FetchSmogonDto } from './dto/fetch-smogon.dto';
import { SmogonService } from './services/smogon.service';
import { VgcPastesService } from './services/vgcpastes.service';
import { PokepasteService } from './services/pokepaste.service';
import { LimitlessService } from './services/limitless.service';
import {
  PokemonUsageDetail,
  PokemonUsageEntry,
} from './entities/pokemon-usage.entity';
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
  private readonly logger = new Logger(VgcMetaFacadeService.name);

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
    const regulation = await this.regulationsRepository.findByFormatId(
      dto.format,
    );
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
    const month =
      dto.month ?? (await this.resolveMostRecentMonth(dto.format, cutoff));
    return this.smogonService.deleteSnapshot(dto.format, month, cutoff);
  }

  async getSmogonUsage(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    // Month must be provided, or fall back to the most recent available snapshot
    const month =
      dto.month ?? (await this.resolveMostRecentMonth(dto.format, cutoff));
    return this.smogonService.getUsageList(dto.format, month, cutoff);
  }

  async getSmogonUsageList(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month =
      dto.month ?? (await this.resolveMostRecentMonth(dto.format, cutoff));
    return this.smogonService.getUsageEntries(dto.format, month, cutoff);
  }

  async getSmogonDetail(dto: QuerySmogonDto & { speciesId: string }) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month =
      dto.month ?? (await this.resolveMostRecentMonth(dto.format, cutoff));
    return this.smogonService.getPokemonDetail(
      dto.format,
      month,
      cutoff,
      dto.speciesId,
    );
  }

  private async resolveMostRecentMonth(
    formatId: string,
    cutoff: number,
  ): Promise<string> {
    const snapshots = await this.smogonService.getAvailableSnapshots();
    const match = snapshots.find(
      (s) => s.formatId === formatId && s.cutoff === cutoff,
    );
    if (match) return match.month;
    throw new NotFoundException(
      `No snapshot available for ${formatId}-${cutoff}. Fetch it from the admin panel.`,
    );
  }

  // â”€â”€â”€ Champions (VGCPastes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getChampionsUsage(dto: QueryChampionsDto) {
    const regulation = await this.regulationsRepository.findById(
      dto.regulationId,
    );
    if (!regulation)
      throw new NotFoundException(`Regulation "${dto.regulationId}" not found`);
    if (!regulation.vgcPastesGid)
      throw new NotFoundException(
        `No VGCPastes GID configured for "${dto.regulationId}"`,
      );
    return this.vgcPastesService.getUsageList(dto.regulationId);
  }

  async getChampionsUsageList(dto: QueryChampionsDto) {
    const regulation = await this.regulationsRepository.findById(
      dto.regulationId,
    );
    if (!regulation)
      throw new NotFoundException(`Regulation "${dto.regulationId}" not found`);
    if (!regulation.vgcPastesGid)
      throw new NotFoundException(
        `No VGCPastes GID configured for "${dto.regulationId}"`,
      );
    return this.vgcPastesService.getUsageEntries(dto.regulationId);
  }

  async refreshChampionsData(regulationId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (!regulation.vgcPastesGid)
      throw new NotFoundException(
        `No VGCPastes GID configured for "${regulationId}"`,
      );
    return this.vgcPastesService.refreshRegulation(
      regulationId,
      regulation.vgcPastesGid,
    );
  }

  async getChampionsPasteDetail(regulationId: string, speciesId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    return this.vgcPastesService.getPasteDetail(regulationId, speciesId);
  }

  async batchFetchChampionsPastes(regulationId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    return this.vgcPastesService.batchFetchRegulation(regulationId);
  }

  // â”€â”€â”€ Limitless â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async importLimitlessTournament(dto: AddLimitlessTournamentDto) {
    return this.limitlessService.importTournament(
      dto.url,
      dto.regulationId,
      dto.maxPlayers,
    );
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

  // ─── Unified detail (source-agnostic) ───────────────────────────────────────

  async getUnifiedUsageDetailList(
    regulationId: string,
  ): Promise<PokemonUsageDetail[]> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (regulation.vgcPastesGid)
      return this.vgcPastesService.getUsageList(regulationId);
    if (regulation.formatId) {
      const month = await this.resolveMostRecentMonth(
        regulation.formatId,
        SMOGON_DEFAULT_CUTOFF,
      );
      return this.smogonService.getUsageList(
        regulation.formatId,
        month,
        SMOGON_DEFAULT_CUTOFF,
      );
    }
    return this.limitlessService.getCombinedUsage(regulationId);
  }

  async getChampionsDetail(
    regulationId: string,
    speciesId: string,
  ): Promise<PokemonUsageDetail> {
    const list = await this.vgcPastesService.getUsageList(regulationId);
    const entry = list.find((e) => e.speciesId === speciesId);
    if (!entry)
      throw new NotFoundException(
        `${speciesId} not found in Champions data for ${regulationId}`,
      );

    // Usage list has teammates but empty moves/items/abilities/spreads.
    // Paste detail has the opposite. Merge both when paste data is available.
    try {
      const paste = await this.vgcPastesService.getPasteDetail(
        regulationId,
        speciesId,
      );
      return {
        ...entry,
        abilities: paste.abilities.length ? paste.abilities : entry.abilities,
        items: paste.items.length ? paste.items : entry.items,
        moves: paste.moves.length ? paste.moves : entry.moves,
        teraTypes: paste.teraTypes.length ? paste.teraTypes : entry.teraTypes,
        spreads: paste.spreads.length ? paste.spreads : entry.spreads,
      };
    } catch {
      return entry;
    }
  }

  async getLimitlessDetail(
    regulationId: string,
    speciesId: string,
  ): Promise<PokemonUsageDetail> {
    const list = await this.limitlessService.getCombinedUsage(regulationId);
    const entry = list.find((e) => e.speciesId === speciesId);
    if (!entry)
      throw new NotFoundException(
        `${speciesId} not found in Limitless data for ${regulationId}`,
      );
    return entry;
  }

  async getUnifiedUsageList(
    regulationId: string,
  ): Promise<PokemonUsageEntry[]> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (regulation.vgcPastesGid)
      return this.vgcPastesService.getUsageEntries(regulationId);
    if (regulation.formatId)
      return this.getSmogonUsageList({ format: regulation.formatId });
    return this.limitlessService.getCombinedUsageEntries(regulationId);
  }

  async getUnifiedDetail(
    regulationId: string,
    speciesId: string,
  ): Promise<PokemonUsageDetail> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    if (!regulation)
      throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (regulation.vgcPastesGid)
      return this.getChampionsDetail(regulationId, speciesId);
    if (regulation.formatId)
      return this.getSmogonDetail({ format: regulation.formatId, speciesId });
    return this.getLimitlessDetail(regulationId, speciesId);
  }

  // ─── Regulations ────────────────────────────────────────────────────────────

  async getRegulations() {
    return this.regulationsRepository.findActive();
  }

  /** Admin-only: includes soft-disabled regulations. */
  async getAllRegulations() {
    return this.regulationsRepository.findAll();
  }

  async upsertRegulation(dto: UpsertRegulationDto) {
    // formatId defaults to id: the two are the same string whenever the sim's
    // format id is short enough to double as our shorthand PK.
    const formatId = dto.formatId?.trim() || dto.id.trim();

    // Reject unknown formats here rather than letting the row save and then
    // 404 later from /champions/:id/{pokemon,speed-tiers,game-data}, which all
    // go through Dex.forFormat(regulation.formatId).
    initChampionsMod();
    const format = Dex.formats.get(formatId);
    const existing = await this.regulationsRepository.findById(dto.id.trim());
    // Only block on CREATE. A row that predates this check may point at an
    // unregistered format (its rules-based endpoints 404); refusing the save
    // would also lock an admin out of editing its name, GID or active flag.
    if (!format.exists && !existing) {
      throw new BadRequestException({
        message:
          `Format "${formatId}" is not registered in @pkmn/sim. ` +
          `Champions formats must be declared in champions.mod.ts. ` +
          `Known Champions formats: ${listChampionsFormatIds().join(', ')}.`,
        userMessage:
          `El formato "${formatId}" no existe en el simulador. ` +
          `Formatos Champions disponibles: ${listChampionsFormatIds().join(', ')}.`,
      });
    }

    await this.regulationsRepository.upsert({
      id: dto.id.trim(),
      formatId,
      name: dto.name,
      // The sim is the authority on game type; the DTO value is only a hint.
      gameType: format.exists
        ? (format.gameType ?? dto.gameType)
        : dto.gameType,
      vgcPastesGid: dto.vgcPastesGid,
      active: dto.active,
    });
    const saved = await this.regulationsRepository.findById(dto.id.trim());
    if (!format.exists) {
      this.logger.warn(
        `Regulation "${dto.id}" points at unregistered format "${formatId}". ` +
          `Its legality, speed-tier and game-data endpoints will 404 until the ` +
          `format is declared in champions.mod.ts.`,
      );
    }
    return saved;
  }

  // ─── Species Teams ──────────────────────────────────────────────────────────

  async getSpeciesTeams(speciesId: string, regulationId: string) {
    const regulation = await this.regulationsRepository.findById(regulationId);
    return this.teamsService.getTeamsForSpecies(
      speciesId,
      regulationId,
      regulation?.formatId ?? undefined,
    );
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
      month: dto.month,
      cutoff: dto.cutoff ?? SMOGON_DEFAULT_CUTOFF,
    });
  }
}
