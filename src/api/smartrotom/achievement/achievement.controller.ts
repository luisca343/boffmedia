import { Controller, Get, Post, Body, Param, HttpStatus, UseInterceptors, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from "@nestjs/swagger";
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { AchievementFacadeService } from "./achievement.facade.service";
import { GetAchievementsDto, GetAchievementByIdDto, AchievementStatusResponse } from './dto/achievement.dto';
import { BattleAchievementDto, BattleAchievementResponse } from './dto/battle-achievement.dto';
import { GetReplayDto } from './dto/replay.dto';
import { UserAchievement } from './entities/achievement.entity';
import { Replay } from './entities/replay.entity';

@ApiTags("SmartRotom | Achievements")
@Controller("/smartrotom/achievements")
@UseInterceptors(ResponseInterceptor)
export class AchievementController {
  constructor(
    private readonly achievementFacadeService: AchievementFacadeService,
  ) {}

  @Get(":uuid/:achievementId")
  @ApiOperation({ summary: "Get a specific achievement for a player" })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: "Achievement retrieved successfully.",
    type: UserAchievement
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: "Achievement not found." 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: "Failed to retrieve achievement." 
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiParam({ name: 'achievementId', description: 'Achievement ID' })
  async getAchievementForPlayer(
    @Param('uuid') uuid: string, 
    @Param('achievementId') achievementId: string
  ): Promise<UserAchievement> {
    return await this.achievementFacadeService.getUserAchievementById(uuid, achievementId);
  }

  @Post()
  @ApiOperation({ summary: 'Get all achievements for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Achievements retrieved successfully.',
    type: [UserAchievement]
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve achievements.' 
  })
  @ApiBody({ type: GetAchievementsDto })
  async getAchievements(@Body() { uuid }: GetAchievementsDto): Promise<UserAchievement[]> {
    return await this.achievementFacadeService.getUserAchievements(uuid);
  }

  @Post('battle')
  @ApiOperation({ summary: 'Save a battle and register its achievement' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Battle achievement saved successfully.',
    type: BattleAchievementResponse
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid battle data or achievement already completed.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to save battle achievement.' 
  })
  @ApiBody({ type: BattleAchievementDto })
  async addBattleAchievement(@Body() battleAchievement: BattleAchievementDto): Promise<BattleAchievementResponse> {
    return await this.achievementFacadeService.addBattleAchievement(battleAchievement);
  }

  @Get('replays/:uuid/:replayId')
  @ApiOperation({ summary: 'Get replay for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Replay retrieved successfully.',
    type: Replay
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Replay not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve replay.' 
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiParam({ name: 'replayId', description: 'Replay ID' })
  async getReplay(
    @Param('uuid') uuid: string, 
    @Param('replayId', ParseIntPipe) replayId: number
  ): Promise<Replay> {
    return await this.achievementFacadeService.getUserReplay(uuid, replayId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if player has completed a specific achievement' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Achievement status checked successfully.',
    type: AchievementStatusResponse
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to check achievement status.' 
  })
  @ApiBody({ type: GetAchievementByIdDto })
  async checkAchievementStatus(@Body() { uuid, achievementId }: GetAchievementByIdDto): Promise<AchievementStatusResponse> {
    return await this.achievementFacadeService.checkUserHasAchievement(uuid, achievementId);
  }
}