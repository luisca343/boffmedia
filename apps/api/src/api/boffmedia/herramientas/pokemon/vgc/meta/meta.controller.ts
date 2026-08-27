import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { VgcMetaFacadeService } from './meta.facade.service';
import { QuerySmogonDto } from './dto/query-smogon.dto';
import { FetchSmogonDto } from './dto/fetch-smogon.dto';
import { QueryChampionsDto } from './dto/query-champions.dto';
import { AddLimitlessTournamentDto } from './dto/add-limitless-tournament.dto';
import { QueryLimitlessDto } from './dto/query-limitless.dto';
import {
  BatchFetchResultDto,
  ChampionsPasteDetailDto,
} from './dto/champions-paste-detail.dto';
import { UpsertRegulationDto } from './dto/upsert-regulation.dto';
import {
  ChampionsRegulationDto,
  CountResultDto,
  DivergenceResultDto,
  LimitlessPlayerTeamDto,
  PersonalMetaComparisonDto,
  PokemonUsageDetailDto,
  PokemonUsageEntryDto,
  SmogonSnapshotDto,
  SpeciesTeamEntryDto,
  TournamentImportStartDto,
  VgcIngestionJobDto,
} from './dto/meta-response.dto';
import { QueryPersonalMetaDto } from './dto/query-personal-meta.dto';
import { QueryDivergenceDto } from './dto/query-divergence.dto';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import {
  ImportJobStatusDto,
  LimitlessPlayerDto,
  LimitlessTournamentDto,
} from './dto/limitless-tournament.dto';

@ApiTags('BoffMedia 🛠 | VGC Meta')
@Controller('tools/vgc/meta')
export class VgcMetaController {
  private readonly logger = new Logger(VgcMetaController.name);

  constructor(private readonly facade: VgcMetaFacadeService) {}

  private logAdminAction(
    action: string,
    req: any,
    details: Record<string, unknown> = {},
  ) {
    this.logger.log(
      `[${action}] userId=${req?.user?.userId ?? 'unknown'} roles=${JSON.stringify(req?.user?.roles ?? [])} details=${JSON.stringify(details)}`,
    );
  }

  // --- Ladder (Smogon) -------------------------------------------------------

  @Public()
  @Get('smogon/available')
  @ApiOperation({ summary: 'List all cached Smogon snapshots' })
  @ApiResponse({
    status: 200,
    description: 'Snapshot list returned.',
    type: SmogonSnapshotDto,
    isArray: true,
  })
  getAvailableSmogonSnapshots() {
    return this.facade.getAvailableSmogonSnapshots();
  }

  @Post('smogon/fetch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary:
      '[Admin] Fetch stats.txt + moveset.txt from Smogon and store normalised rows',
  })
  @ApiResponse({
    status: 201,
    description: 'Snapshot fetched and stored.',
    type: CountResultDto,
  })
  fetchSmogonSnapshot(@Body() dto: FetchSmogonDto, @Req() req: any) {
    this.logAdminAction('smogon/fetch', req, {
      format: dto.format,
      month: dto.month,
      cutoff: dto.cutoff,
    });
    return this.facade.fetchSmogonSnapshot(dto);
  }

  @Delete('smogon/snapshot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary: '[Admin] Delete a Smogon snapshot and its Pokémon rows',
  })
  @ApiResponse({ status: 200, description: 'Snapshot deleted.' })
  deleteSmogonSnapshot(@Query() dto: QuerySmogonDto, @Req() req: any) {
    this.logAdminAction('smogon/snapshot-delete', req, {
      format: dto.format,
      month: dto.month,
      cutoff: dto.cutoff,
    });
    return this.facade.deleteSmogonSnapshot(dto);
  }

  @Public()
  @Get('smogon')
  @ApiOperation({
    summary: 'Get full Smogon usage + detail for all Pokémon in a snapshot',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage list with full detail returned.',
    type: PokemonUsageDetailDto,
    isArray: true,
  })
  getSmogonUsage(@Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonUsage(dto);
  }

  @Public()
  @Get('smogon/list')
  @ApiOperation({
    summary: 'Get lean Smogon usage list (without expanded detail arrays)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lean usage list returned.',
    type: PokemonUsageEntryDto,
    isArray: true,
  })
  getSmogonUsageList(@Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonUsageList(dto);
  }

  @Public()
  @Get('smogon/:speciesId')
  @ApiOperation({ summary: 'Get Smogon detail for a single Pokémon' })
  @ApiParam({ name: 'speciesId', example: 'incineroar' })
  @ApiResponse({
    status: 200,
    description: 'Detail returned.',
    type: PokemonUsageDetailDto,
  })
  getSmogonDetail(
    @Param('speciesId') speciesId: string,
    @Query() dto: QuerySmogonDto,
  ) {
    return this.facade.getSmogonDetail({ ...dto, speciesId });
  }

  // --- Champions (VGCPastes) -------------------------------------------------

  @Public()
  @Get('champions')
  @ApiOperation({ summary: 'Get Champions usage data from VGCPastes' })
  @ApiResponse({
    status: 200,
    description: 'Usage list returned.',
    type: PokemonUsageDetailDto,
    isArray: true,
  })
  getChampionsUsage(@Query() dto: QueryChampionsDto) {
    return this.facade.getChampionsUsage(dto);
  }

  @Public()
  @Get('champions/list')
  @ApiOperation({
    summary: 'Get lean Champions usage list (without expanded detail arrays)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lean usage list returned.',
    type: PokemonUsageEntryDto,
    isArray: true,
  })
  getChampionsUsageList(@Query() dto: QueryChampionsDto) {
    return this.facade.getChampionsUsageList(dto);
  }

  @Public()
  @Get('champions/:speciesId/detail')
  @ApiOperation({ summary: 'Get Champions paste detail for a single Pokémon' })
  @ApiParam({ name: 'speciesId', example: 'glimmoramega' })
  @ApiResponse({
    status: 200,
    description: 'Paste-derived breakdown returned.',
    type: ChampionsPasteDetailDto,
  })
  getChampionsPasteDetail(
    @Param('speciesId') speciesId: string,
    @Query() dto: QueryChampionsDto,
  ) {
    return this.facade.getChampionsPasteDetail(dto.regulationId, speciesId);
  }

  @Post('champions/fetch-pastes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary: '[Admin] Batch-fetch pastes for all teams in a regulation',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch fetch result returned.',
    type: BatchFetchResultDto,
  })
  batchFetchChampionsPastes(
    @Query('regulationId') regulationId: string,
    @Req() req: any,
  ) {
    this.logAdminAction('champions/fetch-pastes', req, { regulationId });
    return this.facade.batchFetchChampionsPastes(regulationId);
  }

  @Post('champions/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary: 'Re-fetch VGCPastes CSV and refresh Champions data',
  })
  @ApiResponse({
    status: 201,
    description: 'Data refreshed.',
    type: CountResultDto,
  })
  refreshChampions(
    @Query('regulationId') regulationId: string,
    @Req() req: any,
  ) {
    this.logAdminAction('champions/refresh', req, { regulationId });
    return this.facade.refreshChampionsData(regulationId);
  }

  // --- Limitless -------------------------------------------------------------

  @Public()
  @Get('limitless/tournaments')
  @ApiOperation({ summary: 'List Limitless tournaments for a regulation' })
  @ApiResponse({
    status: 200,
    description: 'Tournament list returned.',
    type: LimitlessTournamentDto,
    isArray: true,
  })
  listTournamentsByRegulation(@Query('regulationId') regulationId: string) {
    return this.facade.getLimitlessTournamentsByRegulation(regulationId);
  }

  @Public()
  @Get('limitless')
  @ApiOperation({ summary: 'List all cached Limitless tournaments' })
  @ApiResponse({
    status: 200,
    description: 'Tournament list returned.',
    type: LimitlessTournamentDto,
    isArray: true,
  })
  listTournaments() {
    return this.facade.listLimitlessTournaments();
  }

  @Public()
  @Get('limitless/usage/combined')
  @ApiOperation({
    summary:
      'Get combined usage data across all completed tournaments in a regulation',
  })
  @ApiResponse({
    status: 200,
    description: 'Combined usage list returned.',
    type: PokemonUsageDetailDto,
    isArray: true,
  })
  getLimitlessCombinedUsage(@Query('regulationId') regulationId: string) {
    return this.facade.getLimitlessCombinedUsage(regulationId);
  }

  @Public()
  @Get('limitless/usage/combined/list')
  @ApiOperation({
    summary: 'Get lean combined Limitless usage list for a regulation',
  })
  @ApiResponse({
    status: 200,
    description: 'Lean combined usage list returned.',
    type: PokemonUsageEntryDto,
    isArray: true,
  })
  getLimitlessCombinedUsageList(@Query('regulationId') regulationId: string) {
    return this.facade.getLimitlessCombinedUsageList(regulationId);
  }

  @Public()
  @Get('limitless/usage')
  @ApiOperation({ summary: 'Get usage data for a Limitless tournament' })
  @ApiResponse({
    status: 200,
    description: 'Usage list returned.',
    type: PokemonUsageDetailDto,
    isArray: true,
  })
  getLimitlessUsage(@Query() dto: QueryLimitlessDto) {
    return this.facade.getLimitlessUsage(dto.tournamentId);
  }

  @Public()
  @Get('limitless/usage/list')
  @ApiOperation({ summary: 'Get lean Limitless usage list for a tournament' })
  @ApiResponse({
    status: 200,
    description: 'Lean usage list returned.',
    type: PokemonUsageEntryDto,
    isArray: true,
  })
  getLimitlessUsageList(@Query() dto: QueryLimitlessDto) {
    return this.facade.getLimitlessUsageList(dto.tournamentId);
  }

  @Public()
  @Get('limitless/tournament/:id/status')
  @ApiOperation({ summary: 'Get import job status for a tournament' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Job status returned.',
    type: ImportJobStatusDto,
  })
  getLimitlessTournamentStatus(@Param('id') id: string) {
    return this.facade.getLimitlessTournamentStatus(+id);
  }

  @Post('limitless/tournament')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({ summary: '[Admin] Import a Limitless tournament by URL' })
  @ApiResponse({
    status: 201,
    description: 'Tournament import started.',
    type: TournamentImportStartDto,
  })
  importTournament(@Body() dto: AddLimitlessTournamentDto, @Req() req: any) {
    this.logAdminAction('limitless/tournament-import', req, {
      regulationId: dto.regulationId,
      maxPlayers: dto.maxPlayers ?? null,
      url: dto.url,
    });
    return this.facade.importLimitlessTournament(dto);
  }

  @Public()
  @Get('limitless/:tournamentId/players')
  @ApiOperation({ summary: 'Get player list for a Limitless tournament' })
  @ApiParam({ name: 'tournamentId', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Player list returned.',
    type: LimitlessPlayerDto,
    isArray: true,
  })
  getLimitlessPlayers(@Param('tournamentId') tournamentId: string) {
    return this.facade.getLimitlessPlayers(+tournamentId);
  }

  @Public()
  @Get('limitless/:tournamentId/player/:slug')
  @ApiOperation({ summary: "Get a player's team for a Limitless tournament" })
  @ApiParam({ name: 'tournamentId', example: '1' })
  @ApiParam({ name: 'slug', example: 'johndoe' })
  @ApiResponse({
    status: 200,
    description: 'Player team returned.',
    type: LimitlessPlayerTeamDto,
  })
  getLimitlessPlayerTeam(
    @Param('tournamentId') tournamentId: string,
    @Param('slug') slug: string,
  ) {
    return this.facade.getLimitlessPlayerTeam(+tournamentId, slug);
  }

  // --- Regulations -----------------------------------------------------------

  @Public()
  @Get('regulations')
  @ApiOperation({ summary: 'List all active Champions regulations' })
  @ApiResponse({
    status: 200,
    description: 'Regulation list returned.',
    type: ChampionsRegulationDto,
    isArray: true,
  })
  getRegulations() {
    return this.facade.getRegulations();
  }

  @Get('regulations/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary:
      '[Admin] List every regulation, including soft-disabled ones. ' +
      'The public list filters to active, so this is the only way to find ' +
      'and re-enable a regulation that was switched off.',
  })
  @ApiResponse({
    status: 200,
    description: 'Full regulation list returned.',
    type: ChampionsRegulationDto,
    isArray: true,
  })
  getAllRegulations() {
    return this.facade.getAllRegulations();
  }

  @Post('regulations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({ summary: '[Admin] Create or update a Champions regulation' })
  @ApiResponse({
    status: 201,
    description: 'Regulation upserted.',
    type: ChampionsRegulationDto,
  })
  upsertRegulation(@Body() dto: UpsertRegulationDto, @Req() req: any) {
    this.logAdminAction('regulations/upsert', req, {
      id: dto.id,
      formatId: dto.formatId,
      name: dto.name,
      gameType: dto.gameType ?? null,
      hasVgcPastesGid: Boolean(dto.vgcPastesGid),
      active: dto.active ?? true,
    });
    return this.facade.upsertRegulation(dto);
  }

  // --- Species Teams ---------------------------------------------------------

  @Public()
  @Get('teams')
  @ApiOperation({
    summary:
      'Get teams featuring a Pokémon in a regulation (max 30, rank ascending)',
  })
  @ApiResponse({
    status: 200,
    description: 'Team list returned.',
    type: SpeciesTeamEntryDto,
    isArray: true,
  })
  getSpeciesTeams(
    @Query('speciesId') speciesId: string,
    @Query('regulationId') regulationId: string,
  ) {
    return this.facade.getSpeciesTeams(speciesId, regulationId);
  }

  // --- Unified Jobs + Personal Analytics -----------------------------------

  @Public()
  @Get('jobs')
  @ApiOperation({
    summary:
      'List unified ingestion jobs across Smogon, Champions, and Limitless',
  })
  @ApiResponse({
    status: 200,
    description: 'Unified ingestion jobs returned.',
    type: VgcIngestionJobDto,
    isArray: true,
  })
  getIngestionJobs(@Query('regulationId') regulationId?: string) {
    return this.facade.getIngestionJobs(regulationId);
  }

  @Get('compare/personal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Compare personal tracker opponent usage vs selected meta source',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal-vs-meta comparison returned.',
    type: PersonalMetaComparisonDto,
  })
  getPersonalVsMeta(@Req() req: any, @Query() dto: QueryPersonalMetaDto) {
    return this.facade.comparePersonalVsMeta(req.user.userId, dto);
  }

  // --- Divergence (Ladder vs Tournament) -----------------------------------

  @Public()
  @Get('divergence')
  @ApiOperation({
    summary:
      'Compare Smogon ladder usage vs Limitless tournament usage for a regulation',
  })
  @ApiResponse({
    status: 200,
    description: 'Divergence rows returned, sorted by |delta| descending.',
    type: DivergenceResultDto,
  })
  getDivergence(@Query() dto: QueryDivergenceDto) {
    return this.facade.getDivergence(dto);
  }
}
