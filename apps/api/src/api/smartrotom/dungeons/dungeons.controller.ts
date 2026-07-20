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
import { DungeonsService } from './dungeons.service';
import { SaveDungeonRunDto } from './dto/save-dungeon-run.dto';
import { DungeonRankingEntry } from './entities/dungeon-ranking-entry.entity';
import { DungeonPlayerStats } from './entities/dungeon-player-stats.entity';
import { SaveDungeonRunResponse } from './entities/save-dungeon-run-response.entity';

@ApiTags('SmartRotom | Dungeons')
@Controller('smartrotom/dungeons')
export class DungeonsController {
  constructor(private readonly dungeonsService: DungeonsService) {}

  /**
   * The mod's run journal (Teras docs/DUNGEONS.md §9). Unlike `caja`, this route stays on
   * the `MinecraftMiddleware` list: the mod sends the top-level `server`, so the tripwire
   * still catches a cross-environment write. `GameServerAuthGuard` is the real credential.
   * No `@SkipEnvelope()` — the mod posts fire-and-forget and never reads the response.
   */
  @Post('run')
  @Public()
  @UseGuards(GameServerAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Store the result of a dungeon run (mod only)',
    description:
      'Posted once per run, completed or abandoned — an attempt is a row worth having.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SaveDungeonRunResponse })
  async saveRun(
    @Body() body: SaveDungeonRunDto,
  ): Promise<SaveDungeonRunResponse> {
    return await this.dungeonsService.saveRun(body);
  }

  @Get('ranking')
  @Public()
  @ApiOperation({ summary: 'Dungeon leaderboard' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, type: [DungeonRankingEntry] })
  async getRanking(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<DungeonRankingEntry[]> {
    return await this.dungeonsService.getRanking(limit);
  }

  @Get('stats/:uuid')
  @Public()
  @ApiOperation({ summary: 'Dungeon stats and rank for one player' })
  @ApiResponse({ status: HttpStatus.OK, type: DungeonPlayerStats })
  async getPlayerStats(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<DungeonPlayerStats> {
    return await this.dungeonsService.getPlayerStats(uuid);
  }
}
