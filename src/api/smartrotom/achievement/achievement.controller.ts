import { Controller, Get, Post, Body, Param, HttpStatus, UseInterceptors, ParseIntPipe } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
import { UuidDto } from "../_dto/smartrotom-request-dto"
import { BattleAchievementDto } from "../_dto/battle-achievement-dto"
import { AchievementFacadeService } from "./achievement.facade.service"
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor'
import {
  AchievementDetailsResponse,
  ReplayDetailsResponse,
  BattleAchievementResponse
} from './types/achievement.types';

@ApiTags("SmartRotom | Achievements")
@Controller("/smartrotom/achievements")
@UseInterceptors(ResponseInterceptor)
export class AchievementController {
  constructor(
    private readonly achievementFacadeService: AchievementFacadeService,
  ) {}

  @Get(":uuid/:achievementId")
  @ApiOperation({ summary: "Get a specific achievement for a player" })
  @ApiResponse({ status: HttpStatus.OK, description: "Achievement retrieved successfully." })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: "Failed to retrieve achievement." })
  async getAchievementForPlayer(
    @Param('uuid') uuid: string, 
    @Param('achievementId') achievementId: string
  ): Promise<AchievementDetailsResponse> {
    return await this.achievementFacadeService.getUserAchievementById(uuid, achievementId);
  }

  @Post()
  @ApiOperation({ summary: 'Get battle achievements for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle achievements retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve battle achievements.' })
  @ApiBody({ type: UuidDto })
  async getAchievements(@Body() { uuid }: UuidDto): Promise<AchievementDetailsResponse[]> {
    return await this.achievementFacadeService.getUserAchievements(uuid);
  }

  @Post('battle')
  @ApiOperation({ summary: 'Save a battle and register its achievement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle saved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save battle.' })
  @ApiBody({ type: BattleAchievementDto })
  async addBattleAchievement(@Body() battleAchievement: BattleAchievementDto): Promise<BattleAchievementResponse> {
    return await this.achievementFacadeService.addBattleAchievement(battleAchievement);
  }

  @Get('replays/:uuid/:replayId')
  @ApiOperation({ summary: 'Get replay for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve replay.' })
  async getReplay(
    @Param('uuid') uuid: string, 
    @Param('replayId', ParseIntPipe) replayId: number
  ): Promise<ReplayDetailsResponse> {
    return await this.achievementFacadeService.getUserReplay(uuid, replayId);
  }
}