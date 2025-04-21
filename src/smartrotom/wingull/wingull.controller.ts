import { Body, Controller, Get, Param, Post, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { WingullService } from './wingull.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { TeleportPlayerDto } from '../_dto/teleport-player.dto';

@ApiTags('smartrotom/wingull')
@Controller('smartrotom/wingull')
export class WingullController {
  constructor(
    private readonly wingullService: WingullService,
    private readonly responseService: ResponseService,
  ) {}

  //=====================================================
  // Economy endpoints
  //=====================================================
  
  @Post('updateBalance')
  @ApiOperation({ summary: 'Update player balance in game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update balance.' })
  async updateBalance(@Body() account: {balance: number, type: string, uuid: string}) {
    const action = 'update balance';
    try {
      this.responseService.logRequest(action, account);
      const result = await this.wingullService.updateBalance(account);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Balance updated successfully', result);
    } catch (error) {
      return this.responseService.handleError(action, error, account);
    }
  }

  @Post('getCurrentBalance')
  @ApiOperation({ summary: 'Get current balance for player from game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current balance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve current balance.' })
  async getCurrentBalance(@Body() { uuid, amount }: { uuid: string, amount?: number }) {
    const action = 'get current balance';
    try {
      this.responseService.logRequest(action, { uuid, amount });
      const balance = await this.wingullService.getCurrentBalance(uuid, amount);
      this.responseService.logSuccess(action, balance);
      return this.responseService.createSuccessResponse('Current balance retrieved successfully', { balance });
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid, amount });
    }
  }

  @Post('money')
  @ApiOperation({ summary: 'Get player money directly' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Money amount retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve money amount.' })
  @ApiBody({ type: UuidDto })
  async getMoney(@Body() { uuid }: UuidDto) {
    const action = 'get money';
    try {
      this.responseService.logRequest(action, { uuid });
      const money = await this.wingullService.getMoney(uuid);
      this.responseService.logSuccess(action, { money });
      return this.responseService.createSuccessResponse('Money amount retrieved successfully', { money });
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid });
    }
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
    const action = 'get player stats';
    try {
      this.responseService.logRequest(action, { uuid });
      const stats = await this.wingullService.getStats(uuid);
      this.responseService.logSuccess(action, stats);
      return this.responseService.createSuccessResponse('Player stats retrieved successfully', stats);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('team')
  @ApiOperation({ summary: 'Get player team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player team retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve player team.' })
  @ApiBody({ type: UuidDto })
  async getTeam(@Body() { uuid }: UuidDto) {
    const action = 'get player team';
    try {
      this.responseService.logRequest(action, { uuid });
      const team = await this.wingullService.getTeam(uuid);
      this.responseService.logSuccess(action, team);
      return this.responseService.createSuccessResponse('Player team retrieved successfully', team);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('updateDex')
  @ApiOperation({ summary: 'Update player Pokédex' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player Pokédex updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update player Pokédex.' })
  @ApiBody({ type: UuidDto })
  async updateDex(@Body() { uuid }: UuidDto) {
    const action = 'update player Pokédex';
    try {
      this.responseService.logRequest(action, { uuid });
      const dexData = await this.wingullService.updateDex(uuid);
      this.responseService.logSuccess(action, dexData);
      return this.responseService.createSuccessResponse('Player Pokédex updated successfully', dexData);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('quests')
  @ApiOperation({ summary: 'Get player quests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve player quests.' })
  @ApiBody({ type: UuidDto })
  async getQuests(@Body() { uuid }: UuidDto) {
    const action = 'get player quests';
    try {
      this.responseService.logRequest(action, { uuid });
      const quests = await this.wingullService.getQuests(uuid);
      this.responseService.logSuccess(action, quests);
      return this.responseService.createSuccessResponse('Player quests retrieved successfully', quests);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('message')
  @ApiOperation({ summary: 'Send message to player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to send message.' })
  async sendMessage(@Body() { uuid, message }: { uuid: string, message: string }) {
    const action = 'send message to player';
    try {
      this.responseService.logRequest(action, { uuid, message });
      const result = await this.wingullService.sendMessage(uuid, message);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Message sent successfully', result);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid, message });
    }
  }
  
  @Post('givePokemon')
  @ApiOperation({ summary: 'Give a Pokémon to a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon given successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to give Pokémon.' })
  async givePokemon(
    @Body() { uuid, pokespec, sendMessage = true }: 
    { uuid: string, pokespec: string, sendMessage?: boolean }
  ) {
    const action = 'give Pokémon to player';
    try {
      this.responseService.logRequest(action, { uuid, pokespec, sendMessage });
      const result = await this.wingullService.givePokemon(uuid, pokespec, sendMessage);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Pokémon given successfully', result);
    } catch (error) {
      return this.responseService.handleError(action, error, { uuid, pokespec });
    }
  }

  //=====================================================
  // World endpoints
  //=====================================================

  @Get('performance')
  @ApiOperation({ summary: 'Get server performance data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance data retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve performance data.' })
  async getPerformance() {
    const action = 'get server performance';
    try {
      this.responseService.logRequest(action, {});
      const performance = await this.wingullService.getPerformance();
      this.responseService.logSuccess(action, performance);
      return this.responseService.createSuccessResponse('Performance data retrieved successfully', performance);
    } catch (error) {
      return this.responseService.handleError(action, error, {});
    }
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get regions data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Regions data retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve regions data.' })
  async getRegions() {
    const action = 'get regions data';
    try {
      this.responseService.logRequest(action, {});
      const regions = await this.wingullService.getRegions();
      this.responseService.logSuccess(action, regions);
      return this.responseService.createSuccessResponse('Regions data retrieved successfully', regions);
    } catch (error) {
      return this.responseService.handleError(action, error, {});
    }
  }

  @Get('weather')
  @ApiOperation({ summary: 'Get current weather information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weather information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve weather information.' })
  async getWeather() {
    const action = 'get weather information';
    try {
      this.responseService.logRequest(action, {});
      const weather = await this.wingullService.getWeather();
      this.responseService.logSuccess(action, weather);
      return this.responseService.createSuccessResponse('Weather information retrieved successfully', weather);
    } catch (error) {
      return this.responseService.handleError(action, error, {});
    }
  }

  @Post('updateNPCs')
  @ApiOperation({ summary: 'Update NPCs in game world' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update NPCs.' })
  async updateNPCs(@Body() data: any) {
    const action = 'update NPCs';
    try {
      this.responseService.logRequest(action, data);
      const result = await this.wingullService.updateNPCs(data);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('NPCs updated successfully', result);
    } catch (error) {
      return this.responseService.handleError(action, error, data);
    }
  }

  //=====================================================
  // Transportation endpoints
  //=====================================================

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Taxi stops retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve taxi stops.' })
  async getTaxiStops() {
    const action = 'get taxi stops';
    try {
      this.responseService.logRequest(action, {});
      const stops = await this.wingullService.getTaxiStops();
      this.responseService.logSuccess(action, stops);
      return this.responseService.createSuccessResponse('Taxi stops retrieved successfully', stops);
    } catch (error) {
      return this.responseService.handleError(action, error, {});
    }
  }

  @Post('taxi/teleport')
  @ApiOperation({ summary: 'Teleport player to taxi stop' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player teleported successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to teleport player.' })
  async teleportPlayer(@Body() { id, uuid }: TeleportPlayerDto) {
    const action = 'teleport player';
    try {
      this.responseService.logRequest(action, { id, uuid });
      const result = await this.wingullService.teleportPlayer(id, uuid);
      this.responseService.logSuccess(action, { success: result });
      return this.responseService.createSuccessResponse(
        result ? 'Player teleported successfully' : 'Failed to teleport player', 
        { success: result }
      );
    } catch (error) {
      return this.responseService.handleError(action, error, { id, uuid });
    }
  }
}