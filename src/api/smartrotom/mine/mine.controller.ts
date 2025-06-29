import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MineFacadeService } from './mine.facade.service';
import { PlayGameDto } from './dto/play-game.dto';
import { ClaimRewardsDto } from './dto/claim-rewards.dto';
import { MineReward } from './entities/mine-reward.entity';
import { EndGameDto } from './dto/game-reward.dto';
import { EnergyStatus } from './entities/energy-status.entity';
import { GameStartResponse } from './entities/game-start-response.entity';
import { GameEndResponse } from './entities/game-end-response.entity';
import { RewardsByType } from './entities/rewards-by-type.entity';
import { DropRates } from './entities/drop-rates.entity';
import { PlayerHistory } from './entities/history-entry.entity';
import { RankingEntry } from './entities/ranking-entry.entity';
import { UnclaimedItem } from './entities/unclaimed-item.entity';
import { ClaimResponse } from './entities/claim-response.entity';
import { PlayerStatistics } from './entities/player-statistics.entity';


@ApiTags('SmartRotom | Mine')
@Controller('smartrotom/mine')
@UseInterceptors(ResponseInterceptor)
export class MineController {
  constructor(
    private readonly mineFacadeService: MineFacadeService,
  ) {}

  // ==================== ENERGY ENDPOINTS ====================

  @Get('energy/:uuid')
  @ApiOperation({ summary: 'Get energy status for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Energy status retrieved successfully.',
    type: EnergyStatus
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getEnergy(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerEnergy(uuid);
  }

  // ==================== GAME ENDPOINTS ====================

  @Post('play')
  @ApiOperation({ summary: 'Start a new mining game' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game started successfully.',
    type: GameStartResponse
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Insufficient energy or invalid request.' })
  @ApiBody({ type: PlayGameDto })
  async play(@Body() body: PlayGameDto) {
    return await this.mineFacadeService.playGame(body);
  }

  @Post('endgame')
  @ApiOperation({ summary: 'End a mining game and submit rewards' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game ended and rewards processed successfully.',
    type: GameEndResponse
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid game data or rewards.' })
  @ApiBody({ type: EndGameDto })
  async endGame(@Body() body: EndGameDto) {
    return await this.mineFacadeService.endGame(body);
  }

  // ==================== REWARD ENDPOINTS ====================

  @Get('rewards')
  @ApiOperation({ summary: 'Get all available rewards' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rewards retrieved successfully.',
    type: [MineReward]
  })
  async getRewards() {
    return await this.mineFacadeService.getAllRewards();
  }

  @Get('rewardsbytype')
  @ApiOperation({ summary: 'Get rewards grouped by type' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rewards by type retrieved successfully.',
    type: RewardsByType
  })
  async getRewardsByType() {
    return await this.mineFacadeService.getRewardsByType();
  }

  @Get('rewards/droprates')
  @ApiOperation({ summary: 'Get reward drop rates' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Drop rates retrieved successfully.',
    type: DropRates
  })
  async getRewardDropRates() {
    return await this.mineFacadeService.getRewardDropRates();
  }

  // ==================== PLAYER ENDPOINTS ====================

  @Get('history/:uuid')
  @ApiOperation({ summary: 'Get game history for a player' })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Player history retrieved successfully.',
    schema: {
      type: 'object',
      example: {
        "1": [
          {
            id: 1,
            itemId: "teras:gema_verde",
            itemName: "Gema Verde",
            value: 10000,
            claimed: 0,
            date: "2025-06-29T09:40:58.000Z"
          }
        ],
        "2": [
          {
            id: 2,
            itemId: "teras:gema_blanca",
            itemName: "Gema Blanca",
            value: 7500,
            claimed: 0,
            date: "2025-06-29T09:41:36.000Z"
          },
          {
            id: 2,
            itemId: "teras:gema_prisma",
            itemName: "Gema Prisma",
            value: 7500,
            claimed: 0,
            date: "2025-06-29T09:41:36.000Z"
          }
        ]
      },
      additionalProperties: {
        type: 'array',
        items: { $ref: getSchemaPath(PlayerHistory) }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getHistory(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerHistory(uuid);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get player rankings' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rankings retrieved successfully.',
    type: [RankingEntry]
  })
  async getRanking() {
    return await this.mineFacadeService.getPlayerRanking();
  }

  @Get('rank/:uuid')
  @ApiOperation({ summary: 'Get specific player rank' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player rank retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        rank: { type: 'number', example: 1 },
        totalValue: { type: 'number', example: 25100 }
      }
    }
  })
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
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Unclaimed rewards retrieved successfully.',
    type: [UnclaimedItem]
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getUnclaimed(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getUnclaimedRewards(uuid);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim all unclaimed rewards for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rewards claimed successfully.',
    type: ClaimResponse
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiBody({ type: ClaimRewardsDto })
  async claim(@Body() body: ClaimRewardsDto) {
    return await this.mineFacadeService.claimRewards(body);
  }

  @Get('stats/:uuid')
  @ApiOperation({ summary: 'Get player statistics' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player statistics retrieved successfully.',
    type: PlayerStatistics
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getPlayerStatistics(@Param('uuid') uuid: string) {
    return await this.mineFacadeService.getPlayerStatistics(uuid);
  }

  // ==================== VALIDATION ENDPOINTS ====================

  @Get('validate/player/:uuid')
  @ApiOperation({ summary: 'Validate if player exists' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player validation result.',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true }
      }
    }
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async validatePlayer(@Param('uuid') uuid: string) {
    return { 
      exists: await this.mineFacadeService.validatePlayerExists(uuid) 
    };
  }
}