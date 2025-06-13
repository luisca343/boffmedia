import { Controller, Get, HttpStatus, Param, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ArcadeFacadeService } from './arcade.facade.service';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './_dto/lottbox.dto';

export interface ClaimItemsWithTypesRequest {
  uuid: string;
  items: Array<{ id: string; type?: string; }>;
}

@ApiTags('SmartRotom | Arcade')
@Controller('smartrotom/arcade')
@UseInterceptors(ResponseInterceptor)
export class ArcadeController {
  constructor(
    private readonly arcadeFacadeService: ArcadeFacadeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arcade information retrieved successfully.' })
  async getArcade() {
    return "Arcade Controller";
  }

  @Get('wordle/:uuid')
  @ApiOperation({ summary: 'Get Wordle game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Wordle game retrieved successfully.' })
  async getWordle(@Param('uuid') uuid: string) {
    return await this.arcadeFacadeService.getWordle();
  }

  @Get('streak/:uuid')
  @ApiOperation({ summary: 'Get user\'s arcade streak status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Streak status retrieved successfully.' })
  async getArcadeStreak(@Param('uuid') uuid: string) {
    return await this.arcadeFacadeService.getArcadeStreak(uuid);
  }

  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daily reward claimed successfully.' })
  async claimDailyReward(@Body() body: { uuid: string }) {
    return await this.arcadeFacadeService.claimDailyReward(body.uuid);
  }

  @Get('banner')
  @ApiOperation({ summary: 'Get daily rewards banner configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Banner configuration retrieved successfully.' })
  async getRewardsBanner() {
    return await this.arcadeFacadeService.getRewardsBanner();
  }

  @Post('lootbox/open')
  @ApiOperation({ summary: 'Open a loot box and get a random item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Loot box opened successfully.' })
  @ApiBody({ type: OpenLootBoxDto })
  async openLootBox(@Body() openLootBoxDto: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    return await this.arcadeFacadeService.openLootBox(openLootBoxDto);
  }
  
  @Get('inventory/:uuid')
  @ApiOperation({ summary: 'Get player inventory items' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory retrieved successfully.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiQuery({ name: 'sourceType', description: 'Filter by source type', required: false })
  async getInventory(
    @Param('uuid') uuid: string,
    @Query('sourceType') sourceType?: string
  ) {
    return await this.arcadeFacadeService.getInventory(uuid, sourceType);
  }
  
  @Post('inventory/claim')
  @ApiOperation({ summary: 'Claim items from player inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Items claimed successfully.' })
  async claimInventoryItems(@Body() data: ClaimItemsWithTypesRequest) {
    return await this.arcadeFacadeService.claimInventoryItems(data.uuid, data.items);
  }

  @Post('inventory/add')
  @ApiOperation({ summary: 'Add item to player inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item added successfully.' })
  async addInventoryItem(@Body() data: {
    uuid: string;
    itemId: string;
    itemType: string;
    name: string;
    amount?: number;
    sourceType?: string;
    sourceId?: number;
    rarity?: string;
  }) {
    return await this.arcadeFacadeService.addInventoryItem(data);
  }

  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item consumed successfully.' })
  async consumeInventoryItem(@Body() data: { uuid: string; itemId: string }) {
    return await this.arcadeFacadeService.consumeInventoryItem(data.uuid, data.itemId);
  }

  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lootbox configuration retrieved successfully.' })
  async getLootboxConfig() {
    return this.arcadeFacadeService.getLootboxConfig();
  }

  @Post('lootbox/give')
  @ApiOperation({ summary: 'Give lootbox to player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lootbox given successfully.' })
  async giveLootbox(@Body() data: { uuid: string; lootboxType: string, amount?: number }) {
    return await this.arcadeFacadeService.giveLootbox(data.uuid, data.lootboxType, data.amount);
  }
}