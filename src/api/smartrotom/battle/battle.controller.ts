import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BattleFacadeService, CreateReplayDto, UpdateReplayDto } from './battle.facade.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { BattleConfig } from './services/config.service';

@ApiTags('SmartRotom | Battle')
@Controller('smartrotom/battle')
@UseInterceptors(ResponseInterceptor)
export class BattleController {
  constructor(
    private readonly battleFacadeService: BattleFacadeService,
  ) {}

  // ==================== REPLAY ENDPOINTS ====================

  @Get('replays/:uuid')
  @ApiOperation({ summary: 'Get all replays for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replays retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve replays.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getUserReplays(@Param('uuid') uuid: string) {
    return await this.battleFacadeService.getUserReplays(uuid);
  }

  @Get('replay/:replayId')
  @ApiOperation({ summary: 'Get a specific replay by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  async getReplayById(
    @Param('replayId') replayId: string,
    @Query('uuid') uuid?: string
  ) {
    const replayIdNum = parseInt(replayId, 10);
    if (isNaN(replayIdNum)) {
      throw new Error('Invalid replay ID');
    }
    return await this.battleFacadeService.getReplayById(replayIdNum, uuid);
  }

  @Post('replay')
  @ApiOperation({ summary: 'Create a new replay' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Replay created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid replay data.' })
  async createReplay(@Body() createReplayDto: CreateReplayDto) {
    return await this.battleFacadeService.createReplay(createReplayDto);
  }

  @Put('replay/:replayId')
  @ApiOperation({ summary: 'Update an existing replay' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  async updateReplay(
    @Param('replayId') replayId: string,
    @Body() updateReplayDto: UpdateReplayDto,
    @Query('uuid') uuid?: string
  ) {
    const replayIdNum = parseInt(replayId, 10);
    if (isNaN(replayIdNum)) {
      throw new Error('Invalid replay ID');
    }
    return await this.battleFacadeService.updateReplay(replayIdNum, updateReplayDto, uuid);
  }

  @Delete('replay/:replayId')
  @ApiOperation({ summary: 'Delete a replay' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  async deleteReplay(
    @Param('replayId') replayId: string,
    @Query('uuid') uuid?: string
  ) {
    const replayIdNum = parseInt(replayId, 10);
    if (isNaN(replayIdNum)) {
      throw new Error('Invalid replay ID');
    }
    return await this.battleFacadeService.deleteReplay(replayIdNum, uuid);
  }

  @Post('replay/:replayId/share')
  @ApiOperation({ summary: 'Share a replay with another user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay shared successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        targetUuid: { type: 'string' },
        sourceUuid: { type: 'string'}
      } 
    } 
  })
  async shareReplay(
    @Param('replayId') replayId: string,
    @Body() body: { targetUuid: string; sourceUuid?: string }
  ) {
    const replayIdNum = parseInt(replayId, 10);
    if (isNaN(replayIdNum)) {
      throw new Error('Invalid replay ID');
    }
    return await this.battleFacadeService.shareReplayWithUser(replayIdNum, body.targetUuid, body.sourceUuid);
  }

  // ==================== CONFIG ENDPOINTS ====================

  @Get('config/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration for an NPC' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Configuration not found.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  async getBattleConfig(@Param('npcConfigName') npcConfigName: string) {
    return await this.battleFacadeService.getBattleConfig(npcConfigName);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get all available battle configurations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configurations retrieved successfully.' })
  async getAllBattleConfigs() {
    return await this.battleFacadeService.getAllBattleConfigs();
  }

  @Post('config/:npcConfigName')
  @ApiOperation({ summary: 'Create a new battle configuration' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Battle configuration created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid configuration data.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  @ApiBody({ type: Object })
  async createBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
    @Body() config: BattleConfig
  ) {
    return await this.battleFacadeService.createBattleConfig(npcConfigName, config);
  }

  @Put('config/:npcConfigName')
  @ApiOperation({ summary: 'Update an existing battle configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Configuration not found.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  @ApiBody({ type: Object })
  async updateBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
    @Body() config: Partial<BattleConfig>
  ) {
    return await this.battleFacadeService.updateBattleConfig(npcConfigName, config);
  }

  @Delete('config/:npcConfigName')
  @ApiOperation({ summary: 'Delete a battle configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Configuration not found.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  async deleteBattleConfig(@Param('npcConfigName') npcConfigName: string) {
    return await this.battleFacadeService.deleteBattleConfig(npcConfigName);
  }

  // ==================== LEGACY ENDPOINTS ====================

  @Get('repetitions/:uuid')
  @ApiOperation({ summary: 'Get repetitions for a player (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Repetitions retrieved successfully.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getRepetitions(@Param('uuid') uuid: string) {
    // This is just an alias for getUserReplays to maintain backward compatibility
    return await this.battleFacadeService.getUserReplays(uuid);
  }
}