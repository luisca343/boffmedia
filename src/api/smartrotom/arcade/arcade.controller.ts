import { Controller, Get, HttpStatus, Param, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { ArcadeService, ClaimItemsWithTypesRequest } from './arcade.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './_dto/lottbox.dto';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/arcade')
@Controller('smartrotom/arcade')
@UseInterceptors(ResponseInterceptor)
export class ArcadeController {
  constructor(
    private readonly arcadeService: ArcadeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arcade information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve arcade information.' })
  async getArcade() {
    return "Arcade Controller";
  }

  @Get('wordle/:uuid')
  @ApiOperation({ summary: 'Get Wordle game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Wordle game retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Wordle game.' })
  async getWordle(@Param('uuid') uuid: string) {
    return await this.arcadeService.getWordle();
  }

  @Get('streak/:uuid')
  @ApiOperation({ summary: 'Get user\'s arcade streak status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Streak status retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve streak status.' })
  async getArcadeStreak(@Param('uuid') uuid: string) {
    return await this.arcadeService.getArcadeStreak(uuid);
  }

  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daily reward claimed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Already claimed today.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim daily reward.' })
  async claimDailyReward(@Body() body: { uuid: string }) {
    return await this.arcadeService.claimDailyReward(body.uuid);
  }

  @Get('banner')
  @ApiOperation({ summary: 'Get daily rewards banner configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Banner configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve banner configuration.' })
  async getRewardsBanner() {
    return await this.arcadeService.getRewardsBanner();
  }

  @Post('lootbox/open')
  @ApiOperation({ summary: 'Open a loot box and get a random item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Loot box opened successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request or missing box.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to open loot box.' })
  @ApiBody({ type: OpenLootBoxDto })
  async openLootBox(@Body() openLootBoxDto: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    return await this.arcadeService.openLootBox(openLootBoxDto);
  }
  
  @Get('inventory/:uuid')
  @ApiOperation({ summary: 'Get player inventory items' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Player not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve inventory.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiQuery({ name: 'sourceType', description: 'Filter by source type (e.g. mine, daily, shop)', required: false })
  async getInventory(
    @Param('uuid') uuid: string,
    @Query('sourceType') sourceType?: string
  ) {
    return await this.arcadeService.getInventory(uuid, sourceType);
  }
  
  @Post('inventory/claim')
  @ApiOperation({ summary: 'Claim items from player inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Items claimed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No valid items to claim.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim items.' })
  @ApiBody({ 
    description: 'Player UUID and items to claim with types',
    schema: {
      properties: {
        uuid: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        items: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              id: { type: 'string', example: 'pixelmon:poke_ball' },
              type: { type: 'string', example: 'COMMON' }
            }
          },
          example: [
            { id: 'pixelmon:poke_ball', type: 'COMMON' },
            { id: 'pixelmon:great_ball', type: 'UNCOMMON' }
          ] 
        }
      }
    } 
  })
  async claimInventoryItems(@Body() data: ClaimItemsWithTypesRequest) {
    return await this.arcadeService.claimInventoryItems(data.uuid, data.items);
  }

  @Post('inventory/add')
  @ApiOperation({ summary: 'Add item to player inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item added successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to add item.' })
  @ApiBody({
    description: 'Inventory item details',
    schema: {
      properties: {
        uuid: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        itemId: { type: 'string', example: 'potion:super' },
        itemType: { type: 'string', example: 'consumable' },
        name: { type: 'string', example: 'Super Potion' },
        amount: { type: 'number', example: 1 },
        sourceType: { type: 'string', example: 'shop' },
        sourceId: { type: 'number', example: 123 },
        rarity: { type: 'string', example: 'rare', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] }
      }
    }
  })
  async addInventoryItem(
    @Body() data: {
      uuid: string;
      itemId: string;
      itemType: string;
      name: string;
      amount?: number;
      sourceType?: string;
      sourceId?: number;
      rarity?: string;
    }
  ) {
    return await this.arcadeService.addInventoryItem(data);
  }

  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item consumed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid item or cannot be consumed.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to consume item.' })
  @ApiBody({
    description: 'Player UUID and item ID to consume',
    schema: {
      properties: {
        uuid: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        itemId: { type: 'string', example: 'crate:common' }
      }
    }
  })
  async consumeInventoryItem(@Body() data: { uuid: string; itemId: string }) {
    return await this.arcadeService.consumeInventoryItem(data.uuid, data.itemId);
  }

  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lootbox configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve lootbox configuration.' })
  async getLootboxConfig() {
    return this.arcadeService.getLootboxConfig();
  }

  @Post('lootbox/give')
  @ApiOperation({ summary: 'Give lootbox to player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lootbox given successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to give lootbox.' })
  @ApiBody({
    description: 'Player UUID and lootbox type',
    schema: {
      properties: {
        uuid: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        lootboxType: { type: 'string', example: 'trainer-box' },
        amount: { type: 'number', example: 1 }
      }
    }
  })
  async giveLootbox(@Body() data: { uuid: string; lootboxType: string, amount?: number }) {
    return await this.arcadeService.giveLootbox(data.uuid, data.lootboxType, data.amount);
  }
}