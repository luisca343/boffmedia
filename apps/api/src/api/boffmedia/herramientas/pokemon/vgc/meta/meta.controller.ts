import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { VgcMetaFacadeService } from './meta.facade.service';
import { QuerySmogonDto } from './dto/query-smogon.dto';
import { FetchSmogonDto } from './dto/fetch-smogon.dto';
import { QueryChampionsDto } from './dto/query-champions.dto';
import { AddLimitlessTournamentDto } from './dto/add-limitless-tournament.dto';
import { QueryLimitlessDto } from './dto/query-limitless.dto';
import { BatchFetchResultDto, ChampionsPasteDetailDto } from './dto/champions-paste-detail.dto';
import { UpsertRegulationDto } from './dto/upsert-regulation.dto';

@ApiTags('BoffMedia 🛠 | VGC Meta')
@Controller('tools/vgc/meta')
@UseInterceptors(ResponseInterceptor)
export class VgcMetaController {
  constructor(private readonly facade: VgcMetaFacadeService) {}

  // --- Ladder (Smogon) -------------------------------------------------------

  @Get('smogon/available')
  @ApiOperation({ summary: 'List all cached Smogon snapshots' })
  @ApiResponse({ status: 200, description: 'Snapshot list returned.' })
  getAvailableSmogonSnapshots() {
    return this.facade.getAvailableSmogonSnapshots();
  }

  @Post('smogon/fetch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BOFF_ADMIN')
  @ApiOperation({ summary: '[Admin] Fetch stats.txt + moveset.txt from Smogon and store normalised rows' })
  @ApiResponse({ status: 201, description: 'Snapshot fetched and stored.' })
  fetchSmogonSnapshot(@Body() dto: FetchSmogonDto) {
    return this.facade.fetchSmogonSnapshot(dto);
  }

  @Delete('smogon/snapshot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BOFF_ADMIN')
  @ApiOperation({ summary: '[Admin] Delete a Smogon snapshot and its Pokémon rows' })
  @ApiResponse({ status: 200, description: 'Snapshot deleted.' })
  deleteSmogonSnapshot(@Query() dto: QuerySmogonDto) {
    return this.facade.deleteSmogonSnapshot(dto);
  }

  @Get('smogon')
  @ApiOperation({ summary: 'Get full Smogon usage + detail for all Pokémon in a snapshot' })
  @ApiResponse({ status: 200, description: 'Usage list with full detail returned.' })
  getSmogonUsage(@Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonUsage(dto);
  }

  @Get('smogon/:speciesId')
  @ApiOperation({ summary: 'Get Smogon detail for a single Pokémon' })
  @ApiParam({ name: 'speciesId', example: 'incineroar' })
  @ApiResponse({ status: 200, description: 'Detail returned.' })
  getSmogonDetail(@Param('speciesId') speciesId: string, @Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonDetail({ ...dto, speciesId });
  }

  // --- Champions (VGCPastes) -------------------------------------------------

  @Get('champions/available')
  @ApiOperation({ summary: 'List Champions regulations that have imported data' })
  @ApiResponse({ status: 200, description: 'Available regulation list returned.' })
  getAvailableChampionsRegulations() {
    return this.facade.getAvailableChampionsRegulations();
  }

  @Get('champions')
  @ApiOperation({ summary: 'Get Champions usage data from VGCPastes' })
  @ApiResponse({ status: 200, description: 'Usage list returned.' })
  getChampionsUsage(@Query() dto: QueryChampionsDto) {
    return this.facade.getChampionsUsage(dto);
  }

  @Get('champions/:speciesId/detail')
  @ApiOperation({ summary: 'Get Champions paste detail for a single Pokémon' })
  @ApiParam({ name: 'speciesId', example: 'glimmoramega' })
  @ApiResponse({ status: 200, description: 'Paste-derived breakdown returned.', type: ChampionsPasteDetailDto })
  getChampionsPasteDetail(
    @Param('speciesId') speciesId: string,
    @Query() dto: QueryChampionsDto,
  ) {
    return this.facade.getChampionsPasteDetail(dto.regulationId, speciesId);
  }

  @Post('champions/fetch-pastes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BOFF_ADMIN')
  @ApiOperation({ summary: '[Admin] Batch-fetch pastes for all teams in a regulation' })
  @ApiResponse({ status: 201, description: 'Batch fetch result returned.', type: BatchFetchResultDto })
  batchFetchChampionsPastes(@Query('regulationId') regulationId: string) {
    return this.facade.batchFetchChampionsPastes(regulationId);
  }

  @Post('champions/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BOFF_ADMIN')
  @ApiOperation({ summary: 'Re-fetch VGCPastes CSV and refresh Champions data' })
  @ApiResponse({ status: 201, description: 'Data refreshed.' })
  refreshChampions(@Query('regulationId') regulationId: string) {
    return this.facade.refreshChampionsData(regulationId);
  }

  // --- Limitless -------------------------------------------------------------

  @Get('limitless/tournaments')
  @ApiOperation({ summary: 'List Limitless tournaments for a regulation' })
  @ApiResponse({ status: 200, description: 'Tournament list returned.' })
  listTournamentsByRegulation(@Query('regulationId') regulationId: string) {
    return this.facade.getLimitlessTournamentsByRegulation(regulationId);
  }

  @Get('limitless')
  @ApiOperation({ summary: 'List all cached Limitless tournaments' })
  @ApiResponse({ status: 200, description: 'Tournament list returned.' })
  listTournaments() {
    return this.facade.listLimitlessTournaments();
  }

  @Get('limitless/usage/combined')
  @ApiOperation({ summary: 'Get combined usage data across all completed tournaments in a regulation' })
  @ApiResponse({ status: 200, description: 'Combined usage list returned.' })
  getLimitlessCombinedUsage(@Query('regulationId') regulationId: string) {
    return this.facade.getLimitlessCombinedUsage(regulationId);
  }

  @Get('limitless/usage')
  @ApiOperation({ summary: 'Get usage data for a Limitless tournament' })
  @ApiResponse({ status: 200, description: 'Usage list returned.' })
  getLimitlessUsage(@Query() dto: QueryLimitlessDto) {
    return this.facade.getLimitlessUsage(dto.tournamentId);
  }

  @Get('limitless/tournament/:id/status')
  @ApiOperation({ summary: 'Get import job status for a tournament' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiResponse({ status: 200, description: 'Job status returned.' })
  getLimitlessTournamentStatus(@Param('id') id: string) {
    return this.facade.getLimitlessTournamentStatus(+id);
  }

  @Post('limitless/tournament')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BOFF_ADMIN')
  @ApiOperation({ summary: '[Admin] Import a Limitless tournament by URL' })
  @ApiResponse({ status: 201, description: 'Tournament import started.' })
  importTournament(@Body() dto: AddLimitlessTournamentDto) {
    return this.facade.importLimitlessTournament(dto);
  }

  @Get('limitless/:tournamentId/players')
  @ApiOperation({ summary: 'Get player list for a Limitless tournament' })
  @ApiParam({ name: 'tournamentId', example: '1' })
  @ApiResponse({ status: 200, description: 'Player list returned.' })
  getLimitlessPlayers(@Param('tournamentId') tournamentId: string) {
    return this.facade.getLimitlessPlayers(+tournamentId);
  }

  @Get('limitless/:tournamentId/player/:slug')
  @ApiOperation({ summary: 'Get a player\'s team for a Limitless tournament' })
  @ApiParam({ name: 'tournamentId', example: '1' })
  @ApiParam({ name: 'slug', example: 'johndoe' })
  @ApiResponse({ status: 200, description: 'Player team returned.' })
  getLimitlessPlayerTeam(
    @Param('tournamentId') tournamentId: string,
    @Param('slug') slug: string,
  ) {
    return this.facade.getLimitlessPlayerTeam(+tournamentId, slug);
  }

  // --- Regulations -----------------------------------------------------------

  @Get('regulations')
  @ApiOperation({ summary: 'List all active Champions regulations' })
  @ApiResponse({ status: 200, description: 'Regulation list returned.' })
  getRegulations() {
    return this.facade.getRegulations();
  }

  @Post('regulations')
  @ApiOperation({ summary: '[Admin] Create or update a Champions regulation' })
  @ApiResponse({ status: 201, description: 'Regulation upserted.' })
  upsertRegulation(@Body() dto: UpsertRegulationDto) {
    return this.facade.upsertRegulation(dto);
  }

  // --- Species Teams ---------------------------------------------------------

  @Get('teams')
  @ApiOperation({ summary: 'Get teams featuring a Pokémon in a regulation (max 30, rank ascending)' })
  @ApiResponse({ status: 200, description: 'Team list returned.' })
  getSpeciesTeams(
    @Query('speciesId')    speciesId:    string,
    @Query('regulationId') regulationId: string,
  ) {
    return this.facade.getSpeciesTeams(speciesId, regulationId);
  }
}
