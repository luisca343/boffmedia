import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AchievementFacadeService } from './achievement.facade.service';

// DTOs
import {
  GetAchievementsDto,
  GetAchievementByIdDto,
  CheckAchievementDto,
  AchievementStatusResponse,
} from './dto/achievement.dto';
import {
  BattleAchievementDto,
  BattleAchievementResponse,
} from './dto/battle-achievement.dto';
import {
  CreateReplayDto,
  CreateUserReplayDto,
  GetReplayDto,
  CreateReplayResponse,
  CreateUserReplayResponse,
} from './dto/replay.dto';

// Entities
import { UserAchievement } from './entities/achievement.entity';
import { Replay } from './entities/replay.entity';

@ApiTags('SmartRotom | Achievements')
@Public()
@Controller('smartrotom/achievement')
export class AchievementController {
  constructor(
    private readonly achievementFacadeService: AchievementFacadeService,
  ) {}

  // ==================== ACHIEVEMENT ENDPOINTS ====================

  @Post('get-achievements')
  @ApiOperation({
    summary: 'Get user achievements',
    description: 'Retrieve all achievements for a specific player',
  })
  @ApiResponse({
    status: 200,
    description: 'User achievements retrieved successfully',
    type: [UserAchievement],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID provided',
  })
  async getUserAchievements(
    @Body() dto: GetAchievementsDto,
  ): Promise<UserAchievement[]> {
    return this.achievementFacadeService.getUserAchievements(dto.uuid);
  }

  @Post('get-achievement-by-id')
  @ApiOperation({
    summary: 'Get specific user achievement',
    description:
      'Retrieve a specific achievement for a player by achievement ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User achievement retrieved successfully',
    type: UserAchievement,
  })
  @ApiResponse({
    status: 404,
    description: 'Achievement not found',
  })
  async getUserAchievementById(
    @Body() dto: GetAchievementByIdDto,
  ): Promise<UserAchievement> {
    return this.achievementFacadeService.getUserAchievementById(
      dto.uuid,
      dto.achievementId,
    );
  }

  @Post('check-achievement')
  @ApiOperation({
    summary: 'Check achievement status',
    description: 'Check if a user has completed a specific achievement',
  })
  @ApiResponse({
    status: 200,
    description: 'Achievement status checked successfully',
    type: AchievementStatusResponse,
  })
  async checkUserHasAchievement(
    @Body() dto: CheckAchievementDto,
  ): Promise<AchievementStatusResponse> {
    return this.achievementFacadeService.checkUserHasAchievement(
      dto.uuid,
      dto.achievementId,
    );
  }

  // ==================== BATTLE ACHIEVEMENT ENDPOINTS ====================

  @Post('battle-achievement')
  @ApiOperation({
    summary: 'Process battle achievement',
    description: 'Process achievement unlock from battle results',
  })
  @ApiResponse({
    status: 200,
    description: 'Battle achievement processed successfully',
    type: BattleAchievementResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid battle data provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Achievement not found',
  })
  async processBattleAchievement(
    @Body() dto: BattleAchievementDto,
  ): Promise<BattleAchievementResponse> {
    try {
      const battleData = {
        uuid: dto.uuid,
        logro: dto.logro,
        name1: dto.name1,
        name2: dto.name2,
        team1: dto.team1,
        team2: dto.team2,
        replay: dto.replay,
        victoria: dto.victoria,
      };

      const result =
        await this.achievementFacadeService.processBattleAchievement(
          battleData,
        );
      return {
        success: result.success,
        replayId: result.success ? 1 : undefined, // This should be properly returned from the service
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== REPLAY ENDPOINTS ====================

  @Post('create-replay')
  @ApiOperation({
    summary: 'Create replay',
    description: 'Create a new replay record',
  })
  @ApiResponse({
    status: 201,
    description: 'Replay created successfully',
    type: CreateReplayResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid replay data provided',
  })
  async createReplay(
    @Body() dto: CreateReplayDto,
  ): Promise<CreateReplayResponse> {
    const result = await this.achievementFacadeService.createReplay({
      side1: dto.side1,
      side2: dto.side2,
      team1: dto.team1,
      team2: dto.team2,
      replay: dto.replay,
      winner: dto.winner,
    });

    return { replayId: result.insertId };
  }

  @Post('create-user-replay')
  @ApiOperation({
    summary: 'Create user replay association',
    description: 'Associate a replay with a user',
  })
  @ApiResponse({
    status: 201,
    description: 'User replay association created successfully',
    type: CreateUserReplayResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user replay data provided',
  })
  async createUserReplay(
    @Body() dto: CreateUserReplayDto,
  ): Promise<CreateUserReplayResponse> {
    const result = await this.achievementFacadeService.createUserReplay(
      dto.uuid,
      dto.replayId,
    );
    return { relationId: result.insertId };
  }

  @Post('get-replay')
  @ApiOperation({
    summary: 'Get user replay',
    description: 'Retrieve replay data for a specific user and replay ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User replay retrieved successfully',
    type: Replay,
  })
  @ApiResponse({
    status: 404,
    description: 'Replay not found',
  })
  async getUserReplay(@Body() dto: GetReplayDto): Promise<Replay | null> {
    return this.achievementFacadeService.getUserReplay(dto.uuid, dto.replayId);
  }
}
