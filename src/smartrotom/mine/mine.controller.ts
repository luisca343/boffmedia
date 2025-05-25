import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { MinaService } from './mine.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/mine')
@Controller('smartrotom/mine')
@UseInterceptors(ResponseInterceptor)
export class MinaController {
  constructor(
    private readonly minaService: MinaService,
  ) {}

  @Post('claim')
  @ApiOperation({ summary: 'Claim rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards claimed successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim rewards.' })
  async claim(@Body() body: { uuid: string }) {
    return await this.minaService.claim(body.uuid);
  }

  @Post('endgame')
  @ApiOperation({ summary: 'End the game and submit rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game ended and rewards submitted successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to end the game and submit rewards.' })
  async endGame(@Body() body: { uuid: string, rewards: { value: number, id: number }[] }) {
    return await this.minaService.endGame(body.uuid, body.rewards);
  }

  @Get('energy/:uuid')
  @ApiOperation({ summary: 'Get energy for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Energy retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve energy.' })
  async getEnergy(@Param('uuid') uuid: string) {
    return await this.minaService.getEnergy(uuid);
  }

  @Get('history/:uuid')
  @ApiOperation({ summary: 'Get game history for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve game history.' })
  async getHistory(@Param('uuid') uuid: string) {
    return await this.minaService.getHistory(uuid);
  }

  @Post('play')
  @ApiOperation({ summary: 'Start playing the game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game started successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to start the game.' })
  async play(@Body() body: { uuid: string }) {
    return await this.minaService.play(body.uuid);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get game ranking' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ranking retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve ranking.' })
  async getRanking() {
    return await this.minaService.getRanking();
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get all rewards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve rewards.' })
  async getRewards() {
    return await this.minaService.getRewards();
  }

  @Get('rewardsbytype')
  @ApiOperation({ summary: 'Get rewards by type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards by type retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve rewards by type.' })
  async getRewardsByType() {
    return await this.minaService.getRewardsByType();
  }

  @Get('unclaimed/:uuid')
  @ApiOperation({ summary: 'Get unclaimed rewards for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unclaimed rewards retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve unclaimed rewards.' })
  async getUnclaimed(@Param('uuid') uuid: string) {
    return await this.minaService.getUnclaimed(uuid);
  }
}