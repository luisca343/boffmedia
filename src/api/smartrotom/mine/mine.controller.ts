import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MineFacadeService, PlayGameRequest, EndGameRequest, ClaimRequest } from './mine.facade.service';

@ApiTags('smartrotom/mine')
@Controller('smartrotom/mine')
@UseInterceptors(ResponseInterceptor)
export class MinaController {
  constructor(
    private readonly mineFacadeService: MineFacadeService,
  ) {}

  // ==================== ENERGY ENDPOINTS ====================

  @Get('energy/:uuid')
  @ApiOperation({ summary: 'Get energy status for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Energy status retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getEnergy(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerEnergy(uuid);
  }

  // ==================== GAME ENDPOINTS ====================

  @Post('play')
  @ApiOperation({ summary: 'Start a new mining game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game started successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Insufficient energy or invalid request.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string', description: 'Player UUID' }
      } 
    } 
  })
  async play(@Body() body: PlayGameRequest) {
    return await this.mineFacadeService.playGame(body);
  }

  @Post('endgame')
  @ApiOperation({ summary: 'End a mining game and submit rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game ended and rewards processed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid game data or rewards.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string', description: 'Player UUID' },
        rewards: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              id: { type: 'number' }
            }
          }
        }
      } 
    } 
  })
  async endGame(@Body() body: EndGameRequest) {
    return await this.mineFacadeService.endGame(body);
  }

  // ==================== REWARD ENDPOINTS ====================

  @Get('rewards')
  @ApiOperation({ summary: 'Get all available rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards retrieved successfully.' })
  async getRewards() {
    return await this.mineFacadeService.getAllRewards();
  }

  @Get('rewardsbytype')
  @ApiOperation({ summary: 'Get rewards grouped by type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards by type retrieved successfully.' })
  async getRewardsByType() {
    return await this.mineFacadeService.getRewardsByType();
  }

  @Get('rewards/droprates')
  @ApiOperation({ summary: 'Get reward drop rates' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Drop rates retrieved successfully.' })
  async getRewardDropRates() {
    return await this.mineFacadeService.getRewardDropRates();
  }

  // ==================== PLAYER ENDPOINTS ====================

  @Get('history/:uuid')
  @ApiOperation({ summary: 'Get game history for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getHistory(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerHistory(uuid);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get player rankings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rankings retrieved successfully.' })
  async getRanking() {
    return await this.mineFacadeService.getPlayerRanking();
  }

  @Get('rank/:uuid')
  @ApiOperation({ summary: 'Get specific player rank' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player rank retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found in rankings.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerRank(@Param('uuid') uuid: string) {
    const rank = await this.mineFacadeService.getPlayerRank(uuid);
    if (!rank) {
      throw new Error('Player not found in rankings');
    }
    return rank;
  }

  @Get('unclaimed/:uuid')
  @ApiOperation({ summary: 'Get unclaimed rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unclaimed rewards retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getUnclaimed(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getUnclaimedRewards(uuid);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim all unclaimed rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards claimed successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string', description: 'Player UUID' }
      } 
    } 
  })
  async claim(@Body() body: ClaimRequest) {
    return await this.mineFacadeService.claimRewards(body);
  }

  @Get('stats/:uuid')
  @ApiOperation({ summary: 'Get player statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player statistics retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerStatistics(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerStatistics(uuid);
  }

  // ==================== VALIDATION ENDPOINTS ====================

  @Get('validate/player/:uuid')
  @ApiOperation({ summary: 'Validate if player exists' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player validation result.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async validatePlayer(@Param('uuid') uuid: string) {
    return { 
      exists: await this.mineFacadeService.validatePlayerExists(uuid) 
    };
  }
}