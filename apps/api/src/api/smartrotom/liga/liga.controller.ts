import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { LigaFacadeService } from './liga.facade.service';
import {
  CreateTournamentDto,
  TournamentRegistrationDto,
} from './dto/tournament.dto';

@ApiTags('SmartRotom | Liga')
@Controller('smartrotom/liga')
@UseInterceptors(ResponseInterceptor)
export class LigaController {
  constructor(private readonly ligaFacadeService: LigaFacadeService) {}

  // ==================== REPLAY ENDPOINTS ====================

  @Get('replay/:id')
  @ApiOperation({ summary: 'Get replay by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replay retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Replay not found.',
  })
  @ApiParam({ name: 'id', description: 'Replay ID' })
  async getReplay(@Param('id') id: string) {
    const replayId = parseInt(id, 10);
    if (isNaN(replayId)) {
      throw new Error('Invalid replay ID');
    }
    return await this.ligaFacadeService.getReplayById(replayId);
  }

  @Get('replays/recent')
  @ApiOperation({ summary: 'Get recent replays' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent replays retrieved successfully.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of replays to retrieve',
    required: false,
  })
  async getRecentReplays(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (isNaN(limitNum) || limitNum <= 0) {
      throw new Error('Invalid limit parameter');
    }
    return await this.ligaFacadeService.getRecentReplays(limitNum);
  }

  @Get('replays/player/:uuid')
  @ApiOperation({ summary: 'Get replays for a specific player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player replays retrieved successfully.',
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerReplays(@Param('uuid') uuid: string) {
    return await this.ligaFacadeService.getPlayerReplays(uuid);
  }

  @Get('replays/history/:player1/:player2')
  @ApiOperation({ summary: 'Get match history between two players' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Match history retrieved successfully.',
  })
  @ApiParam({ name: 'player1', description: 'First player UUID' })
  @ApiParam({ name: 'player2', description: 'Second player UUID' })
  async getMatchHistory(
    @Param('player1') player1: string,
    @Param('player2') player2: string,
  ) {
    return await this.ligaFacadeService.getMatchHistory(player1, player2);
  }

  // ==================== STATISTICS ENDPOINTS ====================

  @Get('stats/player/:uuid')
  @ApiOperation({ summary: 'Get statistics for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player statistics retrieved successfully.',
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerStatistics(@Param('uuid') uuid: string) {
    return await this.ligaFacadeService.getPlayerStatistics(uuid);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get league leaderboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leaderboard retrieved successfully.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of players to retrieve',
    required: false,
  })
  async getLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (isNaN(limitNum) || limitNum <= 0) {
      throw new Error('Invalid limit parameter');
    }
    return await this.ligaFacadeService.getLeaderboard(limitNum);
  }

  @Get('ranking/:uuid')
  @ApiOperation({ summary: 'Get ranking for a specific player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player ranking retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Player not found in rankings.',
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerRanking(@Param('uuid') uuid: string) {
    const ranking = await this.ligaFacadeService.getPlayerRanking(uuid);
    if (!ranking) {
      throw new Error('Player not found in rankings');
    }
    return ranking;
  }

  @Get('compare/:player1/:player2')
  @ApiOperation({ summary: 'Compare statistics between two players' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player comparison retrieved successfully.',
  })
  @ApiParam({ name: 'player1', description: 'First player UUID' })
  @ApiParam({ name: 'player2', description: 'Second player UUID' })
  async comparePlayerStatistics(
    @Param('player1') player1: string,
    @Param('player2') player2: string,
  ) {
    return await this.ligaFacadeService.comparePlayerStatistics(
      player1,
      player2,
    );
  }

  // ==================== TOURNAMENT ENDPOINTS ====================

  @Get('tournaments')
  @ApiOperation({ summary: 'Get active tournaments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active tournaments retrieved successfully.',
  })
  async getActiveTournaments() {
    return await this.ligaFacadeService.getActiveTournaments();
  }

  @Get('tournament/:id')
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tournament retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tournament not found.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID' })
  async getTournament(@Param('id') id: string) {
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }
    return await this.ligaFacadeService.getTournamentById(tournamentId);
  }

  @Get('tournament/:id/matches')
  @ApiOperation({ summary: 'Get matches for a tournament' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tournament matches retrieved successfully.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID' })
  async getTournamentMatches(@Param('id') id: string) {
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }
    return await this.ligaFacadeService.getTournamentMatches(tournamentId);
  }

  @Post('tournament')
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tournament created successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid tournament data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        maxParticipants: { type: 'number' },
        startDate: { type: 'string', format: 'date-time' },
        description: { type: 'string' },
      },
    },
  })
  async createTournament(@Body() tournamentRequest: CreateTournamentDto) {
    return await this.ligaFacadeService.createTournament(tournamentRequest);
  }

  @Post('tournament/register')
  @ApiOperation({ summary: 'Register for a tournament' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully registered for tournament.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tournamentId: { type: 'number' },
        playerUuid: { type: 'string' },
      },
    },
  })
  async registerForTournament(@Body() registration: TournamentRegistrationDto) {
    return await this.ligaFacadeService.registerForTournament(registration);
  }

  // ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

  @Get('replay/:id')
  @ApiOperation({ summary: 'Get replay by ID (legacy endpoint)' })
  async getLegacyReplay(@Param('id') id: number) {
    // Maintains backward compatibility with the original endpoint
    return await this.ligaFacadeService.getReplayById(id);
  }
}
