import { Body, Controller, Get, Param, Post, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { MinaService } from './mine.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

@ApiTags('smartrotom/mine')
@Controller('smartrotom/mine')
export class MinaController {
  private readonly logger = new Logger(MinaController.name);

  constructor(
    private readonly minaService: MinaService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('energy/:uuid')
  @ApiOperation({ summary: 'Get energy for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Energy retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve energy.' })
  async getEnergy(@Param('uuid') uuid: string) {
    const action = 'get energy';
    try {
      this.responseService.logRequest(action, { uuid });
      const energy = await this.minaService.getEnergy(uuid);
      this.responseService.logSuccess(action, energy);
      return this.responseService.createSuccessResponse('Energy retrieved successfully', energy);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('play')
  @ApiOperation({ summary: 'Start playing the game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game started successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to start the game.' })
  async play(@Body() body: { uuid: string }) {
    const action = 'start playing the game';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.minaService.play(body.uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game started successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Post('endgame')
  @ApiOperation({ summary: 'End the game and submit rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game ended and rewards submitted successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to end the game and submit rewards.' })
  async endGame(@Body() body: { uuid: string, rewards: { value: number, id: number }[] }) {
    const action = 'end game and submit rewards';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.minaService.endGame(body.uuid, body.rewards);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game ended and rewards submitted successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get all rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve rewards.' })
  async getRewards() {
    const action = 'get all rewards';
    try {
      this.responseService.logRequest(action, null);
      const rewards = await this.minaService.getRewards();
      this.responseService.logSuccess(action, rewards);
      return this.responseService.createSuccessResponse('Rewards retrieved successfully', rewards);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('rewardsbytype')
  @ApiOperation({ summary: 'Get rewards by type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards by type retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve rewards by type.' })
  async getRewardsByType() {
    const action = 'get rewards by type';
    try {
      this.responseService.logRequest(action, null);
      const rewardsByType = await this.minaService.getRewardsByType();
      this.responseService.logSuccess(action, rewardsByType);
      return this.responseService.createSuccessResponse('Rewards by type retrieved successfully', rewardsByType);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('history/:uuid')
  @ApiOperation({ summary: 'Get game history for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve game history.' })
  async getHistory(@Param('uuid') uuid: string) {
    const action = 'get game history';
    try {
      this.responseService.logRequest(action, { uuid });
      const history = await this.minaService.getHistory(uuid);
      this.responseService.logSuccess(action, history);
      return this.responseService.createSuccessResponse('Game history retrieved successfully', history);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get game ranking' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ranking retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve ranking.' })
  async getRanking() {
    const action = 'get game ranking';
    try {
      this.responseService.logRequest(action, null);
      const ranking = await this.minaService.getRanking();
      this.responseService.logSuccess(action, ranking);
      return this.responseService.createSuccessResponse('Ranking retrieved successfully', ranking);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('unclaimed/:uuid')
  @ApiOperation({ summary: 'Get unclaimed rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unclaimed rewards retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve unclaimed rewards.' })
  async getUnclaimed(@Param('uuid') uuid: string) {
    const action = 'get unclaimed rewards';
    try {
      this.responseService.logRequest(action, { uuid });
      const unclaimed = await this.minaService.getUnclaimed(uuid);
      this.responseService.logSuccess(action, unclaimed);
      return this.responseService.createSuccessResponse('Unclaimed rewards retrieved successfully', unclaimed);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards claimed successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim rewards.' })
  async claim(@Body() body: { uuid: string }) {
    const action = 'claim rewards';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.minaService.claim(body.uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Rewards claimed successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }
}