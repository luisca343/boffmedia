import {
  Body,
  Controller,
  Get,
  Post,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WingullFacadeService } from './wingull.facade.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { Weather } from './entities/weather.entity';
import { Performance } from './entities/performance.entity';
import { Region } from './entities/region.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { TaxiStop } from './entities/taxi-stop.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { PokemonW } from './entities/pokemon-w.entity';
import { WingullWorldService } from './services/wingull-world.service';
import { UpdateDex } from './entities/update-dex.entity';
import { UpdateBattleTeamDto } from './dto/battle-team.dto';
import { MovePokemonDto } from './dto/move-pokemon.dto';
import { UpdateWingullNpcsDto } from './dto/update-npcs.dto';
import { WingullBalanceDto } from './dto/wingull-balance.dto';
import { GetBalanceDto } from './dto/get-balance.dto';
import { MessageRequestDto } from './dto/message-request.dto';
import { PokemonGiveRequestDto } from './dto/pokemon-give-request.dto';
import { Logger } from 'nestjs-pino';

@ApiTags('SmartRotom | Wingull')
// Game-server bridge routes, with two callers: the Minecraft plugin
// server-to-server with its opaque token, and the web on behalf of a signed-in
// player. `GameOrUserAuthGuard` accepts exactly those two credentials, and it
// sits on the **writes only** — the money/state mutations that were once
// reachable by anyone on the internet (`money`, `updateBalance`).
//
// The guard must NOT go on the controller. `@Public()` only tells the global
// JwtAuthGuard to stand down; an explicitly declared guard still runs. With it
// at controller level every GET was rejected too, and a GET carries no body —
// so the transitional `body.server` tripwire could never fire and reads like
// `weather` and `towns` 401'd for every caller. The reads are world state, not
// player state, so they stay anonymous under `@Public()`.
@Public()
@Controller('wingull')
export class WingullController {
  constructor(
    private readonly logger: Logger,

    private readonly wingullFacadeService: WingullFacadeService,
    private readonly wingullWorldService: WingullWorldService,
  ) {}

  // Town colors configuration
  private readonly townColors = {
    ARRECIFE_WINGULL: { fill: 0x5500bfff, border: 0x00bfff },
    PUERTO_WINGULL: { fill: 0x550077be, border: 0x0077be },
    PUEBLO_TULIPAN: { fill: 0x5532cd32, border: 0x32cd32 },
    PUEBLO_SHIROI: { fill: 0x55ffffff, border: 0xffffff },
    PUEBLO_TAKAI: { fill: 0x55e0ffff, border: 0xe0ffff },
    PUEBLO_HAGANE: { fill: 0x55808080, border: 0x808080 },
    PUEBLO_DENTO: { fill: 0x556a5acd, border: 0x6a5acd },
    PUEBLO_IWA: { fill: 0x55a9a9a9, border: 0xa9a9a9 },
    PUEBLO_TSUCHI: { fill: 0x55d2691e, border: 0xd2691e },
    PUEBLO_OASIS: { fill: 0x55f4a460, border: 0xf4a460 },
    PUEBLO_SENSHI: { fill: 0x55b22222, border: 0xb22222 },
    PUEBLO_KINOKO: { fill: 0x55ff69b4, border: 0xff69b4 },
    PUEBLO_SAKURA: { fill: 0xffffb7c5, border: 0xffb7c5 },
    PUEBLO_DOKU: { fill: 0x55800080, border: 0x800080 },
    PUEBLO_GAKU: { fill: 0x55f4a460, border: 0xf4a460 },
    PUEBLO_LAVANDA: { fill: 0x55483d8b, border: 0x483d8b },
    PUEBLO_DENKI: { fill: 0x55ffff00, border: 0xffff00 },
    PUEBLO_MIZU: { fill: 0x554169e1, border: 0x4169e1 },
    PUEBLO_OLIVO: { fill: 0x55556b2f, border: 0x556b2f },
    NARUKAMI: { fill: 0x55ffd700, border: 0xffd700 },
    AKINA: { fill: 0x55ff4500, border: 0xff4500 },
    FUKITSU: { fill: 0x55000000, border: 0x000000 },
    GANSOLIA: { fill: 0x55deb887, border: 0xdeb887 },
  };

  //=====================================================
  // Economy endpoints
  //=====================================================

  @UseGuards(GameOrUserAuthGuard)
  @Post('updateBalance')
  @ApiOperation({ summary: 'Update player balance in game' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update balance.',
  })
  @ApiBody({ type: UuidDto })
  async updateBalance(@Body() account: WingullBalanceDto) {
    return await this.wingullFacadeService.updateBalance(account);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('getCurrentBalance')
  @ApiOperation({ summary: 'Get current balance for player from game' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current balance retrieved successfully.',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve current balance.',
  })
  @ApiBody({ type: UuidDto })
  async getCurrentBalance(@Body() { uuid, amount }: GetBalanceDto) {
    const balance = await this.wingullFacadeService.getCurrentBalance(
      uuid,
      amount,
    );
    return balance;
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('money')
  @ApiOperation({ summary: 'Get player money directly' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Money amount retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve money amount.',
  })
  @ApiBody({ type: UuidDto })
  async getMoney(@Body() { uuid }: UuidDto) {
    const money = await this.wingullFacadeService.getMoney(uuid);
    return { money };
  }

  //=====================================================
  // Player endpoints
  //=====================================================

  @UseGuards(GameOrUserAuthGuard)
  @Post('stats')
  @ApiOperation({ summary: 'Get player stats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player stats retrieved successfully.',
    type: PlayerStats,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve player stats.',
  })
  @ApiBody({ type: UuidDto })
  async getStats(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.getStats(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('team')
  @ApiOperation({ summary: 'Get player team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player team retrieved successfully.',
    type: [PokemonW],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve player team.',
  })
  @ApiBody({ type: UuidDto })
  async getTeam(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.getTeam(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('pc')
  @ApiOperation({ summary: 'Get player PC' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player PC retrieved successfully.',
    type: [PokemonW],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve player PC.',
  })
  @ApiBody({ type: UuidDto })
  async getPC(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.getPC(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('pc/move')
  @ApiOperation({ summary: 'Move Pokémon inside the PC' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pokémon moved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to move Pokémon.',
  })
  @ApiBody({ type: MovePokemonDto })
  async movePokemon(@Body() movePokemonDto: MovePokemonDto) {
    return await this.wingullFacadeService.movePokemon(movePokemonDto);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('battleteams')
  @ApiOperation({ summary: 'Get all battle teams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle teams retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve battle teams.',
  })
  @ApiBody({ type: UuidDto })
  async getBattleTeams(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.getBattleTeams(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('battleteams/update')
  @ApiOperation({ summary: 'Update a battle team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle team updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update battle team.',
  })
  @ApiBody({ type: UpdateBattleTeamDto })
  async updateBattleTeam(@Body() updateBattleTeamDto: UpdateBattleTeamDto) {
    return await this.wingullFacadeService.updateBattleTeam(
      updateBattleTeamDto,
    );
  }

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Taxi stops retrieved successfully.',
    type: [TaxiStop],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve taxi stops.',
  })
  async getTaxiStops() {
    this.logger.log('Fetching all taxi stops');
    return await this.wingullFacadeService.getTaxiStops();
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('updateDex')
  @ApiOperation({ summary: 'Update player Pokédex' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player Pokédex updated successfully.',
    type: [UpdateDex],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update player Pokédex.',
  })
  @ApiBody({ type: UuidDto })
  async updateDex(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.updateDex(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('quests')
  @ApiOperation({ summary: 'Get player quests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player quests retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve player quests.',
  })
  @ApiBody({ type: UuidDto })
  async getQuests(@Body() { uuid }: UuidDto) {
    return await this.wingullFacadeService.getQuests(uuid);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('message')
  @ApiOperation({ summary: 'Send message to player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message sent successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to send message.',
  })
  async sendMessage(@Body() { uuid, message }: MessageRequestDto) {
    return await this.wingullFacadeService.sendMessage(uuid, message);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('globalchat')
  @ApiOperation({ summary: 'Send message to player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message sent successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to send message.',
  })
  async globalchat(@Body() { uuid, message }: MessageRequestDto) {
    return await this.wingullFacadeService.globalchat(uuid, message);
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('givePokemon')
  @ApiOperation({ summary: 'Give a Pokémon to a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pokémon given successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to give Pokémon.',
  })
  async givePokemon(
    @Body() { uuid, pokespec, sendMessage = true }: PokemonGiveRequestDto,
  ) {
    return await this.wingullFacadeService.givePokemon(
      uuid,
      pokespec,
      sendMessage,
    );
  }

  //=====================================================
  // World endpoints
  //=====================================================

  @Get('performance')
  @ApiOperation({ summary: 'Get server performance data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance data retrieved successfully.',
    type: Performance,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve performance data.',
  })
  async getPerformance() {
    return await this.wingullFacadeService.getPerformance();
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get regions data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Regions data retrieved successfully.',
    type: [Region],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve regions data.',
  })
  async getRegions() {
    return await this.wingullFacadeService.getRegions();
  }

  @Get('weather')
  @ApiOperation({ summary: 'Get current weather information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weather information retrieved successfully.',
    type: Weather,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve weather information.',
  })
  async getWeather(): Promise<Weather> {
    this.logger.log('Fetching current weather information');
    this.logger.log(await this.wingullFacadeService.getWeather());
    return await this.wingullFacadeService.getWeather();
  }

  @UseGuards(GameOrUserAuthGuard)
  @Post('updateNPCs')
  @ApiOperation({ summary: 'Update NPCs in game world' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NPCs updated successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update NPCs.',
  })
  @ApiBody({ description: 'Data to update NPCs', type: UpdateWingullNpcsDto })
  async updateNPCs(@Body() data: UpdateWingullNpcsDto) {
    return await this.wingullFacadeService.updateNPCs(data);
  }

  @Get('owned-regions/:uuid')
  @ApiOperation({ summary: "Fetch the regions a player owns, by UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Player's owned regions fetched successfully.",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Failed to fetch player's owned regions.",
  })
  async getPlayersOwnedRegions(@Param('uuid') uuid: string) {
    return await this.wingullFacadeService.getPlayersOwnedRegions(uuid);
  }

  @Get('plots')
  @ApiOperation({ summary: 'Fetch all plots' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plots fetched successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch plots.',
  })
  async getAllPlots() {
    return await this.wingullFacadeService.getAllPlots();
  }

  @Get('towns')
  @ApiOperation({ summary: 'Get all available towns' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Towns list retrieved successfully.',
    type: [String],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve towns list.',
  })
  async getAllTowns() {
    return await this.wingullWorldService.getAllTowns();
  }

  @Get('towns/:townName')
  @ApiOperation({ summary: 'Get information about a specific town' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Town information retrieved successfully.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Town not found.' })
  async getTownInfo(@Param('townName') townName: string) {
    return await this.wingullWorldService.getTownInfo(townName);
  }
}
