import { Controller, Get, Post, Body, Param, HttpStatus } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
import { ResponseService } from "@/response/response.service"
import { UuidDto } from "../_dto/smartrotom-request-dto"
import { BattleAchievementDto } from "../_dto/battle-achievement-dto"
import { AchievementService } from "./achievement.service"

@ApiTags("smartrotom/achievements")
@Controller("/smartrotom/achievements")
export class AchievementController {
  constructor(
    private achievementService: AchievementService,
    private readonly responseService: ResponseService,
  ) {}

  @Get(":uuid/:achievementId")
  @ApiOperation({ summary: "Get a specific achievement for a player" })
  @ApiResponse({ status: HttpStatus.OK, description: "Battle achievement retrieved successfully." })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: "Failed to retrieve battle achievement." })
  async getAchievementForPlayer(@Param('uuid') uuid: string, @Param('achievementId') achievementId: string) {
    const action = "get achievement for player"
    try {
      this.responseService.logRequest(action, { uuid, achievementId })
      const achievement = await this.achievementService.getAchievementForPlayer(uuid, achievementId)
      this.responseService.logSuccess(action, achievement)
      return this.responseService.createSuccessResponse("Achievement retrieved successfully", achievement)
    } catch (error) {
      this.responseService.handleError(action, error, { uuid, achievementId })
    }
  }

  @Post()
  @ApiOperation({ summary: 'Get battle achievements for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle achievements retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve battle achievements.' })
  @ApiBody({ type: UuidDto })
  async getAchievements(@Body() { uuid }: UuidDto) {
    const action = 'get battle achievements';
    try {
      this.responseService.logRequest(action, { uuid });
      const achievements = await this.achievementService.getAchievements(uuid);
      this.responseService.logSuccess(action, achievements);
      return this.responseService.createSuccessResponse('Battle achievements retrieved successfully', achievements);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('battle')
  @ApiOperation({ summary: 'Saves a Battle, and registers its achievement if any' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle saved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save battle.' })
  @ApiBody({ type: BattleAchievementDto })
  async addBattleAchievement(@Body() battleAchievement: BattleAchievementDto) {
    const action = 'add battle achievement';
    try {
      this.responseService.logRequest(action, battleAchievement);
      const result = await this.achievementService.addBattleAchievement(battleAchievement);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Battle saved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, battleAchievement);
    }
  }
}

