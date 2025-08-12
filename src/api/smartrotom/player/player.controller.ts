import { Body, Controller, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { PlayerFacadeService } from './player.facade.service';

@ApiTags('SmartRotom | Player')
@Controller('smartrotom/player')
@UseInterceptors(ResponseInterceptor)
export class PlayerController {
  constructor(
    private readonly playerFacadeService: PlayerFacadeService,
  ) {}

  @Post('stats')
  @ApiOperation({ summary: 'Get stats for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Stats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve stats.' })
  @ApiBody({ type: UuidDto })
  async getStats(@Body() { uuid }: UuidDto) {
    return await this.playerFacadeService.getStats(uuid);
  }

  @Post('team')
  @ApiOperation({ summary: 'Get team for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve team.' })
  @ApiBody({ type: UuidDto })
  async getTeam(@Body() { uuid }: UuidDto) {
    return await this.playerFacadeService.getTeam(uuid);
  }
}