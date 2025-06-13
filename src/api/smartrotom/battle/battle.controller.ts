import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpStatus, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BattleFacadeService } from './battle.facade.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import {
  BattleReplayResponse,
  CreateReplayDto,
  UpdateReplayDto,
  ShareReplayDto,
  BattleConfigResponse,
  CreateBattleConfigResponse,
  UpdateBattleConfigResponse,
  DeleteReplayResponse,
  ShareReplayResponse,
  DeleteBattleConfigResponse,
  GetAllBattleConfigsResponse,
  ValidateBattleConfigResponse,
  BattleConfig
} from './types/battle.types';

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
  async getUserReplays(@Param('uuid') uuid: string): Promise<BattleReplayResponse[]> {
    return await this.battleFacadeService.getUserReplays(uuid);
  }

  @Get('replay/:replayId')
  @ApiOperation({ summary: 'Get a specific replay by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  async getReplayById(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Query('uuid') uuid?: string
  ): Promise<BattleReplayResponse> {
    return await this.battleFacadeService.getReplayById(replayId, uuid);
  }

  @Post('replay')
  @ApiOperation({ summary: 'Create a new replay' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Replay created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid replay data.' })
  @ApiBody({ type: Object })
  async createReplay(@Body() createReplayDto: CreateReplayDto): Promise<BattleReplayResponse> {
    return await this.battleFacadeService.createReplay(createReplayDto);
  }

  @Put('replay/:replayId')
  @ApiOperation({ summary: 'Update an existing replay' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  @ApiBody({ type: Object })
  async updateReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Body() updateReplayDto: UpdateReplayDto,
    @Query('uuid') uuid?: string
  ): Promise<BattleReplayResponse> {
    return await this.battleFacadeService.updateReplay(replayId, updateReplayDto, uuid);
  }

  @Delete('replay/:replayId')
  @ApiOperation({ summary: 'Delete a replay' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiQuery({ name: 'uuid', description: 'Player UUID for access validation', required: false })
  async deleteReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Query('uuid') uuid?: string
  ): Promise<DeleteReplayResponse> {
    return await this.battleFacadeService.deleteReplay(replayId, uuid);
  }

  @Post('replay/:replayId/share')
  @ApiOperation({ summary: 'Share a replay with another user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay shared successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Replay not found.' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  @ApiBody({ type: Object })
  async shareReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Body() shareReplayDto: ShareReplayDto
  ): Promise<ShareReplayResponse> {
    return await this.battleFacadeService.shareReplayWithUser(
      replayId, 
      shareReplayDto.targetUuid, 
      shareReplayDto.sourceUuid
    );
  }

  // ==================== CONFIG ENDPOINTS ====================

  @Get('config/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration for an NPC' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Configuration not found.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  async getBattleConfig(@Param('npcConfigName') npcConfigName: string): Promise<BattleConfigResponse> {
    return await this.battleFacadeService.getBattleConfig(npcConfigName);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get all available battle configurations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configurations retrieved successfully.' })
  async getAllBattleConfigs(): Promise<GetAllBattleConfigsResponse> {
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
  ): Promise<CreateBattleConfigResponse> {
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
  ): Promise<UpdateBattleConfigResponse> {
    return await this.battleFacadeService.updateBattleConfig(npcConfigName, config);
  }

  @Delete('config/:npcConfigName')
  @ApiOperation({ summary: 'Delete a battle configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Configuration not found.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  async deleteBattleConfig(@Param('npcConfigName') npcConfigName: string): Promise<DeleteBattleConfigResponse> {
    return await this.battleFacadeService.deleteBattleConfig(npcConfigName);
  }

  @Get('config/:npcConfigName/validate')
  @ApiOperation({ summary: 'Validate if a battle configuration exists' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuration validation completed.' })
  @ApiParam({ name: 'npcConfigName', description: 'NPC configuration name' })
  async validateBattleConfig(@Param('npcConfigName') npcConfigName: string): Promise<ValidateBattleConfigResponse> {
    return await this.battleFacadeService.validateBattleConfig(npcConfigName);
  }

  // ==================== LEGACY ENDPOINTS ====================

  @Get('repetitions/:uuid')
  @ApiOperation({ summary: 'Get repetitions for a player (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Repetitions retrieved successfully.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getRepetitions(@Param('uuid') uuid: string): Promise<BattleReplayResponse[]> {
    // This is just an alias for getUserReplays to maintain backward compatibility
    return await this.battleFacadeService.getUserReplays(uuid);
  }
}