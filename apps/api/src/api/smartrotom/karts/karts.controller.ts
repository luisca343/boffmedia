import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { GameServerAuthGuard } from '@api/_utils/guards/game-server-auth.guard';
import { KartsService } from './karts.service';
import { SaveRaceDto } from './dto/save-race.dto';
import { KartRankingEntry } from './entities/kart-ranking-entry.entity';
import { KartPlayerStats } from './entities/kart-player-stats.entity';
import { SaveRaceResponse } from './entities/save-race-response.entity';

@ApiTags('SmartRotom | Karts')
@Controller('smartrotom/karts')
export class KartsController {
  constructor(private readonly kartsService: KartsService) {}

  /**
   * The mod's race report. The URL is frozen — the mod is already pointed at it. Like
   * `dungeons/run` this route stays on the `MinecraftMiddleware` list: the mod sends the
   * top-level `server`, so the tripwire still catches a cross-environment write, and
   * `GameServerAuthGuard` is the real credential.
   */
  @Post('carrera')
  @Public()
  @UseGuards(GameServerAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Store the result of a kart race (mod only)',
    description: 'Posted once per finished race, fire-and-forget.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SaveRaceResponse })
  async saveRace(@Body() body: SaveRaceDto): Promise<SaveRaceResponse> {
    return await this.kartsService.saveRace(body);
  }

  @Get('ranking')
  @Public()
  @ApiOperation({
    summary: 'Best time per player',
    description:
      'Only finished, full-distance clasica runs are ranked — see KartsService.',
  })
  @ApiQuery({ name: 'circuito', required: false, example: 'Rainbow Road' })
  @ApiQuery({ name: 'modo', required: false, example: 'clasica' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, type: [KartRankingEntry] })
  async getRanking(
    @Query('circuito') circuito?: string,
    @Query('modo') modo?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<KartRankingEntry[]> {
    return await this.kartsService.getRanking(circuito, modo, limit);
  }

  @Get('stats/:uuid')
  @Public()
  @ApiOperation({ summary: 'Kart stats for one player' })
  @ApiResponse({ status: HttpStatus.OK, type: KartPlayerStats })
  async getPlayerStats(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<KartPlayerStats> {
    return await this.kartsService.getPlayerStats(uuid);
  }
}
