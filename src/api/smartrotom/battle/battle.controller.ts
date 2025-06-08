import { Controller, Get, Param, HttpStatus, UseInterceptors } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { BattleService } from "./battle.service";
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags("smartrotom/battle")
@Controller("smartrotom/battle")
@UseInterceptors(ResponseInterceptor)
export class BattleController {
  constructor(
    private battleService: BattleService,
  ) {}

  @Get('repetitions/:uuid')
  @ApiOperation({ summary: 'Get repetitions for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Repetitions retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve repetitions.' })
  async getRepetitions(@Param('uuid') uuid: string) {
    return await this.battleService.getRepeticiones(uuid);
  }

  @Get('config/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Battle configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve battle configuration.' })
  async getBattleConfig(@Param('npcConfigName') npcConfigName: string) {
    return await this.battleService.getBattleConfig(npcConfigName);
  }
}