import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BattleFacadeService } from './battle.facade.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import {
  CreateReplayDto,
  UpdateReplayDto,
  ShareReplayDto,
} from './_dto/replay.dto';
import {
  CreateBattleConfigDto,
  UpdateBattleConfigDto,
} from './_dto/battle-config.dto';
import { BattleReplay, BattleConfig } from './entities/battle.entity';
import {
  BattleOperationResponse,
  GetAllConfigsResponse,
} from './entities/battle-response.entity';

@ApiTags('🗑 | SmartRotom | Battle')
@Controller('smartrotom/battle')
@UseInterceptors(ResponseInterceptor)
export class BattleController {
  constructor(private readonly battleFacadeService: BattleFacadeService) {}

  // ==================== REPLAY ENDPOINTS ====================

  @Get('replays/:uuid')
  @ApiOperation({ summary: 'Get all replays for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replays retrieved successfully.',
    type: [BattleReplay],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve replays.',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
  })
  async getUserReplays(@Param('uuid') uuid: string): Promise<BattleReplay[]> {
    return await this.battleFacadeService.getUserReplays(uuid);
  }

  @Get('replay/:replayId')
  @ApiOperation({ summary: 'Get a specific replay by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replay retrieved successfully.',
    type: BattleReplay,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Replay not found.',
  })
  @ApiParam({ name: 'replayId', description: 'Replay ID', example: 123 })
  @ApiQuery({
    name: 'uuid',
    description: 'Player UUID for access validation',
    required: false,
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
  })
  async getReplayById(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Query('uuid') uuid?: string,
  ): Promise<BattleReplay> {
    return await this.battleFacadeService.getReplayById(replayId, uuid);
  }

  @Post('replay')
  @ApiOperation({ summary: 'Create a new replay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Replay created successfully.',
    type: BattleReplay,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid replay data.',
  })
  @ApiBody({ type: CreateReplayDto })
  async createReplay(
    @Body() createReplayDto: CreateReplayDto,
  ): Promise<BattleReplay> {
    return await this.battleFacadeService.createReplay(createReplayDto);
  }

  @Put('replay/:replayId')
  @ApiOperation({ summary: 'Update an existing replay' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replay updated successfully.',
    type: BattleReplay,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Replay not found.',
  })
  @ApiParam({ name: 'replayId', description: 'Replay ID', example: 123 })
  @ApiQuery({
    name: 'uuid',
    description: 'Player UUID for access validation',
    required: false,
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
  })
  @ApiBody({ type: UpdateReplayDto })
  async updateReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Body() updateReplayDto: UpdateReplayDto,
    @Query('uuid') uuid?: string,
  ): Promise<BattleReplay> {
    return await this.battleFacadeService.updateReplay(
      replayId,
      updateReplayDto,
      uuid,
    );
  }

  @Delete('replay/:replayId')
  @ApiOperation({ summary: 'Delete a replay' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replay deleted successfully.',
    type: BattleOperationResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Replay not found.',
  })
  @ApiParam({ name: 'replayId', description: 'Replay ID', example: 123 })
  @ApiQuery({
    name: 'uuid',
    description: 'Player UUID for access validation',
    required: false,
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
  })
  async deleteReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Query('uuid') uuid?: string,
  ): Promise<BattleOperationResponse> {
    return await this.battleFacadeService.deleteReplay(replayId, uuid);
  }

  @Post('replay/:replayId/share')
  @ApiOperation({ summary: 'Share a replay with another user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Replay shared successfully.',
    type: BattleOperationResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Replay not found.',
  })
  @ApiParam({ name: 'replayId', description: 'Replay ID', example: 123 })
  @ApiBody({ type: ShareReplayDto })
  async shareReplay(
    @Param('replayId', ParseIntPipe) replayId: number,
    @Body() { targetUuid, sourceUuid }: ShareReplayDto,
  ): Promise<BattleOperationResponse> {
    return await this.battleFacadeService.shareReplayWithUser(
      replayId,
      targetUuid,
      sourceUuid,
    );
  }

  // ==================== CONFIG ENDPOINTS ====================

  @Get('config/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration for an NPC' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle configuration retrieved successfully.',
    type: BattleConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuration not found.',
  })
  @ApiParam({
    name: 'npcConfigName',
    description: 'NPC configuration name',
    example: 'gym-leader-brock',
  })
  async getBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
  ): Promise<BattleConfig> {
    return await this.battleFacadeService.getBattleConfig(npcConfigName);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get all available battle configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle configurations retrieved successfully.',
    type: GetAllConfigsResponse,
  })
  async getAllBattleConfigs(): Promise<string[]> {
    return await this.battleFacadeService.getAllBattleConfigs();
  }

  @Post('config/:npcConfigName')
  @ApiOperation({ summary: 'Create a new battle configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Battle configuration created successfully.',
    type: BattleOperationResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration data.',
  })
  @ApiParam({
    name: 'npcConfigName',
    description: 'NPC configuration name',
    example: 'gym-leader-brock',
  })
  @ApiBody({ type: CreateBattleConfigDto })
  async createBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
    @Body() config: CreateBattleConfigDto,
  ): Promise<BattleOperationResponse> {
    return await this.battleFacadeService.createBattleConfig(
      npcConfigName,
      config,
    );
  }

  @Put('config/:npcConfigName')
  @ApiOperation({ summary: 'Update an existing battle configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle configuration updated successfully.',
    type: BattleConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuration not found.',
  })
  @ApiParam({
    name: 'npcConfigName',
    description: 'NPC configuration name',
    example: 'gym-leader-brock',
  })
  @ApiBody({ type: UpdateBattleConfigDto })
  async updateBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
    @Body() config: UpdateBattleConfigDto,
  ): Promise<BattleConfig> {
    return await this.battleFacadeService.updateBattleConfig(
      npcConfigName,
      config,
    );
  }

  @Delete('config/:npcConfigName')
  @ApiOperation({ summary: 'Delete a battle configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle configuration deleted successfully.',
    type: BattleOperationResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuration not found.',
  })
  @ApiParam({
    name: 'npcConfigName',
    description: 'NPC configuration name',
    example: 'gym-leader-brock',
  })
  async deleteBattleConfig(
    @Param('npcConfigName') npcConfigName: string,
  ): Promise<BattleOperationResponse> {
    return await this.battleFacadeService.deleteBattleConfig(npcConfigName);
  }
}
