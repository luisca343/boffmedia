import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WingullService } from './wingull.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { TeleportPlayerDto } from '../_dto/teleport-player.dto';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/wingull')
@Controller('smartrotom/wingull')
@UseInterceptors(ResponseInterceptor)
export class WingullController {
  constructor(
    private readonly wingullService: WingullService,
  ) {}

  //=====================================================
  // Economy endpoints
  //=====================================================
  
  @Post('updateBalance')
  @ApiOperation({ summary: 'Update player balance in game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update balance.' })
  async updateBalance(@Body() account: {balance: number, type: string, uuid: string}) {
    return await this.wingullService.updateBalance(account);
  }

  @Post('getCurrentBalance')
  @ApiOperation({ summary: 'Get current balance for player from game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current balance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve current balance.' })
  async getCurrentBalance(@Body() { uuid, amount }: { uuid: string, amount?: number }) {
    const balance = await this.wingullService.getCurrentBalance(uuid, amount);
    return { balance };
  }

  @Post('money')
  @ApiOperation({ summary: 'Get player money directly' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Money amount retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve money amount.' })
  @ApiBody({ type: UuidDto })
  async getMoney(@Body() { uuid }: UuidDto) {
    const money = await this.wingullService.getMoney(uuid);
    return { money };
  }

  //=====================================================
  // Player endpoints
  //=====================================================

  @Post('stats')
  @ApiOperation({ summary: 'Get player stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player stats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve player stats.' })
  @ApiBody({ type: UuidDto })
  async getStats(@Body() { uuid }: UuidDto) {
    return await this.wingullService.getStats(uuid);
  }

  @Post('team')
  @ApiOperation({ summary: 'Get player team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player team retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve player team.' })
  @ApiBody({ type: UuidDto })
  async getTeam(@Body() { uuid }: UuidDto) {
    return await this.wingullService.getTeam(uuid);
  }

  @Post('updateDex')
  @ApiOperation({ summary: 'Update player Pokédex' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player Pokédex updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update player Pokédex.' })
  @ApiBody({ type: UuidDto })
  async updateDex(@Body() { uuid }: UuidDto) {
    return await this.wingullService.updateDex(uuid);
  }

  @Post('quests')
  @ApiOperation({ summary: 'Get player quests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve player quests.' })
  @ApiBody({ type: UuidDto })
  async getQuests(@Body() { uuid }: UuidDto) {
    return await this.wingullService.getQuests(uuid);
  }

  @Post('message')
  @ApiOperation({ summary: 'Send message to player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to send message.' })
  async sendMessage(@Body() { uuid, message }: { uuid: string, message: string }) {
    return await this.wingullService.sendMessage(uuid, message);
  }
  
  @Post('givePokemon')
  @ApiOperation({ summary: 'Give a Pokémon to a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon given successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to give Pokémon.' })
  async givePokemon(
    @Body() { uuid, pokespec, sendMessage = true }: 
    { uuid: string, pokespec: string, sendMessage?: boolean }
  ) {
    return await this.wingullService.givePokemon(uuid, pokespec, sendMessage);
  }

  //=====================================================
  // World endpoints
  //=====================================================

  @Get('performance')
  @ApiOperation({ summary: 'Get server performance data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance data retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve performance data.' })
  async getPerformance() {
    return await this.wingullService.getPerformance();
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get regions data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Regions data retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve regions data.' })
  async getRegions() {
    return await this.wingullService.getRegions();
  }

  @Get('weather')
  @ApiOperation({ summary: 'Get current weather information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weather information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve weather information.' })
  async getWeather() {
    return await this.wingullService.getWeather();
  }

  @Post('updateNPCs')
  @ApiOperation({ summary: 'Update NPCs in game world' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update NPCs.' })
  async updateNPCs(@Body() data: any) {
    return await this.wingullService.updateNPCs(data);
  }

  //=====================================================
  // Transportation endpoints
  //=====================================================

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Taxi stops retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve taxi stops.' })
  async getTaxiStops() {
    return await this.wingullService.getTaxiStops();
  }

  @Post('taxi/teleport')
  @ApiOperation({ summary: 'Teleport player to taxi stop' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player teleported successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to teleport player.' })
  async teleportPlayer(@Body() { id, uuid }: TeleportPlayerDto) {
    const result = await this.wingullService.teleportPlayer(id, uuid);
    return { success: result };
  }
}