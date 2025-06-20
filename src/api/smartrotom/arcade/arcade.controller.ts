import { Controller, Get, HttpStatus, Param, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ArcadeFacadeService } from './arcade.facade.service';

// Import the correct DTOs
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { GetStreakDto, ClaimRewardDto } from './dto/arcade-streak.dto';
import { GetInventoryDto, AddInventoryItemDto, ConsumeInventoryItemDto, ClaimInventoryItemsDto } from './dto/inventory.dto';
import { GiveLootboxDto } from './dto/lootbox-management.dto';

// Import entities
import { ArcadeStreak } from './entities/arcade-streak.entity';
import { ArcadeInventory } from './entities/arcade-inventory.entity';

@ApiTags('SmartRotom | Arcade')
@Controller('smartrotom/arcade')
@UseInterceptors(ResponseInterceptor)
export class ArcadeController {
  constructor(
    private readonly arcadeFacadeService: ArcadeFacadeService,
  ) {}
  
  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Arcade information retrieved successfully.',
    example: 'Arcade Controller'
  })
  async getArcade(): Promise<string> {
    return "Arcade Controller";
  }
  
  // ==================== STREAK ENDPOINTS ====================
  
  @Get('streak/:uuid')
  @ApiOperation({ summary: 'Get user\'s arcade streak status' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Streak status retrieved successfully.',
    type: ArcadeStreak
  })
  async getArcadeStreak(@Param('uuid') uuid: string): Promise<ArcadeStreak> {
    return this.arcadeFacadeService.getUserStreak(uuid);
  }
  
  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Daily reward claimed successfully.'
  })
  @ApiBody({ type: ClaimRewardDto })
  async claimDailyReward(@Body() { uuid }: ClaimRewardDto): Promise<{
    streak: ArcadeStreak;
    reward: any;
    inventoryItems?: ArcadeInventory[];
  }> {
    return this.arcadeFacadeService.claimDailyReward(uuid);
  }

  @Get('streak/:uuid/stats')
  @ApiOperation({ summary: 'Get detailed streak statistics' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Streak statistics retrieved successfully.',
    type: ArcadeStreak
  })
  async getStreakStats(@Param('uuid') uuid: string): Promise<ArcadeStreak> {
    return this.arcadeFacadeService.getStreakStats(uuid);
  }

  @Post('streak/:uuid/reset')
  @ApiOperation({ summary: 'Reset user streak (admin only)' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Streak reset successfully.'
  })
  async resetUserStreak(@Param('uuid') uuid: string): Promise<void> {
    return this.arcadeFacadeService.resetUserStreak(uuid);
  }
  
  // ==================== INVENTORY ENDPOINTS ====================
  
  @Get('inventory/:uuid')
  @ApiOperation({ summary: 'Get player inventory items' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inventory retrieved successfully.',
    type: [ArcadeInventory]
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiQuery({ name: 'itemType', description: 'Filter by item type', required: false, example: 'consumable' })
  @ApiQuery({ name: 'rarity', description: 'Filter by rarity', required: false, example: 'rare' })
  async getInventory(
    @Param('uuid') uuid: string,
    @Query('itemType') itemType?: string,
    @Query('rarity') rarity?: string
  ): Promise<ArcadeInventory[]> {
    if (itemType) {
      return this.arcadeFacadeService.getInventoryItemsByType(uuid, itemType);
    }
    if (rarity) {
      return this.arcadeFacadeService.getInventoryItemsByRarity(uuid, rarity);
    }
    return this.arcadeFacadeService.getUserInventory(uuid);
  }

  @Get('inventory/:uuid/stats')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inventory statistics retrieved successfully.'
  })
  async getInventoryStats(@Param('uuid') uuid: string): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }> {
    return this.arcadeFacadeService.getInventoryStats(uuid);
  }

  @Get('inventory/:uuid/item/:itemId')
  @ApiOperation({ summary: 'Get specific inventory item' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiParam({ name: 'itemId', description: 'Item ID', example: 'potion_heal' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inventory item retrieved successfully.',
    type: ArcadeInventory
  })
  async getUserItem(
    @Param('uuid') uuid: string,
    @Param('itemId') itemId: string
  ): Promise<ArcadeInventory | null> {
    return this.arcadeFacadeService.getUserItem(uuid, itemId);
  }
  
  @Post('inventory/add')
  @ApiOperation({ summary: 'Add item to player inventory' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Item added successfully.',
    type: ArcadeInventory
  })
  @ApiBody({ type: AddInventoryItemDto })
  async addInventoryItem(@Body() data: AddInventoryItemDto): Promise<ArcadeInventory> {
    return this.arcadeFacadeService.addItemToInventory({
      uuid: data.uuid,
      itemId: data.itemId,
      itemType: data.itemType,
      amount: data.amount,
      rarity: data.rarity,
      sourceType: data.sourceType
    });
  }
  
  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Item consumed successfully.'
  })
  @ApiBody({ type: ConsumeInventoryItemDto })
  async consumeInventoryItem(@Body() { uuid, itemId, amount }: ConsumeInventoryItemDto): Promise<{
    item: ArcadeInventory | null;
    consumed: number;
  }> {
    return this.arcadeFacadeService.consumeInventoryItem(uuid, itemId, amount || 1);
  }

  @Post('inventory/:uuid/item/:itemId/use')
  @ApiOperation({ summary: 'Mark inventory item as used' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiParam({ name: 'itemId', description: 'Item ID', example: 'potion_heal' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Item marked as used successfully.',
    type: ArcadeInventory
  })
  async markItemAsUsed(
    @Param('uuid') uuid: string,
    @Param('itemId') itemId: string
  ): Promise<ArcadeInventory> {
    return this.arcadeFacadeService.markItemAsUsed(uuid, itemId);
  }
  
  // ==================== LOOTBOX ENDPOINTS ====================
  
  @Post('lootbox/open')
  @ApiOperation({ summary: 'Open a loot box and get a random item' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Loot box opened successfully.',
    type: OpenLootBoxResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or no boxes available.'
  })
  @ApiBody({ type: OpenLootBoxDto })
  async openLootBox(@Body() { uuid, boxId }: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    return this.arcadeFacadeService.openLootbox(uuid, boxId);
  }
  
  @Post('lootbox/give')
  @ApiOperation({ summary: 'Give lootbox to player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lootbox given successfully.'
  })
  @ApiBody({ type: GiveLootboxDto })
  async giveLootbox(@Body() { uuid, lootboxType, amount }: GiveLootboxDto): Promise<void> {
    return this.arcadeFacadeService.giveLootbox(uuid, lootboxType, amount || 1);
  }

  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lootbox configuration retrieved successfully.'
  })
  async getLootboxConfig(): Promise<any> {
    return this.arcadeFacadeService.getLootboxConfig();
  }
  
  // ==================== COMBINED ENDPOINTS ====================

  /*
  @Post('inventory/claim-multiple')
  @ApiOperation({ summary: 'Claim multiple items at once' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Items claimed successfully.',
    type: [ArcadeInventory]
  })
  @ApiBody({ type: ClaimInventoryItemsDto })
  async claimMultipleItems(@Body() { uuid, items }: ClaimInventoryItemsDto): Promise<ArcadeInventory[]> {
    return this.arcadeFacadeService.claimMultipleItems(uuid, items);
  }*/

  @Get('user/:uuid/complete-data')
  @ApiOperation({ summary: 'Get complete user arcade data' })
  @ApiParam({ name: 'uuid', description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Complete user data retrieved successfully.'
  })
  async getCompleteUserData(@Param('uuid') uuid: string): Promise<{
    streak: ArcadeStreak;
    inventory: ArcadeInventory[];
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }> {
    return this.arcadeFacadeService.getCompleteUserData(uuid);
  }
}