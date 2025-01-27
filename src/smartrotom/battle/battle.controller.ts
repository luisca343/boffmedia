import { Controller, Get, Param, HttpStatus } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { ResponseService } from "@/response/response.service"
import { BattleService } from "./battle.service";

@ApiTags("smartrotom/battle")
@Controller("smartrotom/battle")
export class BattleController {
  constructor(
    private battleService: BattleService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('repetitions/:uuid')
  @ApiOperation({ summary: 'Get repetitions for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Repetitions retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve repetitions.' })
  async getRepetitions(@Param('uuid') uuid: string) {
    const action = 'get repetitions';
    try {
      this.responseService.logRequest(action, { uuid });
      const repetitions = await this.battleService.getRepeticiones(uuid);
      this.responseService.logSuccess(action, repetitions);
      return this.responseService.createSuccessResponse('Repetitions retrieved successfully', repetitions);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('config/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve battle configuration.' })
  async getBattleConfig(@Param('npcConfigName') npcConfigName: string) {
    const action = 'get battle configuration';
    try {
      this.responseService.logRequest(action, { npcConfigName });
      const config = await this.battleService.getBattleConfig(npcConfigName);
      this.responseService.logSuccess(action, config);
      return this.responseService.createSuccessResponse('Battle configuration retrieved successfully', config);
    } catch (error) {
      this.responseService.handleError(action, error, { npcConfigName });
    }
  }
}

