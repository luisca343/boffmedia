import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ArcadeFacadeService } from './arcade.facade.service';

// Import the correct DTOs
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { ClaimRewardDto } from './dto/arcade-streak.dto';
import {
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
} from './dto/inventory.dto';
import { GiveLootboxDto } from './dto/lootbox-management.dto';
import { ClaimItemsDto, ClaimItemsResponseDto } from './dto/claim-items.dto';

// Import entities
import { ArcadeStreak } from './entities/arcade-streak.entity';
import { ArcadeInventoryItem } from './entities/arcade-inventory.entity';
import { ArcadeStreakClaim } from './entities/arcade-streak-claim.entity';
import { ArcadeInventoryResponse } from './entities/inventory-response.entity';
import {
  LootboxConfigEntity,
  RarityRange,
} from './entities/lootbox-config.entity';
import { DailyRewardsConfig } from './entities/daily-rewards.entity';

@ApiTags('SmartRotom | Arcade')
@Controller('smartrotom/arcade')
@UseInterceptors(ResponseInterceptor)
export class ArcadeController {
  constructor(private readonly arcadeFacadeService: ArcadeFacadeService) {}

  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Arcade information retrieved successfully.',
    example: 'Arcade Controller',
  })
  async getArcade(): Promise<string> {
    return 'Arcade Controller';
  }

  // ==================== STREAK ENDPOINTS ====================
  @Get('banner')
  @ApiOperation({ summary: 'Get daily rewards banner configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner configuration retrieved successfully.',
    type: DailyRewardsConfig,
  })
  async getRewardsBanner(): Promise<DailyRewardsConfig> {
    return await this.arcadeFacadeService.getRewardsBanner();
  }

  @Get('streak/:uuid')
  @ApiOperation({ summary: "Get user's arcade streak status" })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Streak status retrieved successfully.',
    type: ArcadeStreak,
  })
  async getArcadeStreak(@Param('uuid') uuid: string): Promise<ArcadeStreak> {
    return this.arcadeFacadeService.getUserStreak(uuid);
  }

  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily reward claimed successfully.',
    type: ArcadeStreakClaim,
  })
  @ApiBody({ type: ClaimRewardDto })
  async claimDailyReward(
    @Body() { uuid }: ClaimRewardDto,
  ): Promise<ArcadeStreakClaim> {
    return this.arcadeFacadeService.claimDailyReward(uuid);
  }

  @Get('streak/:uuid/stats')
  @ApiOperation({ summary: 'Get detailed streak statistics' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Streak statistics retrieved successfully.',
    type: ArcadeStreak,
  })
  async getStreakStats(@Param('uuid') uuid: string): Promise<ArcadeStreak> {
    return this.arcadeFacadeService.getStreakStats(uuid);
  }

  @Post('streak/:uuid/reset')
  @ApiOperation({ summary: 'Reset user streak (admin only)' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Streak reset successfully.',
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
    type: [ArcadeInventoryResponse],
  })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiQuery({
    name: 'itemType',
    description: 'Filter by item type',
    required: false,
    example: 'consumable',
  })
  @ApiQuery({
    name: 'rarity',
    description: 'Filter by rarity',
    required: false,
    example: 'rare',
  })
  async getInventory(
    @Param('uuid') uuid: string,
    @Query('itemType') _itemType?: string,
    @Query('rarity') _rarity?: string,
  ): Promise<ArcadeInventoryResponse> {
    /*
    if (itemType) {
      return this.arcadeFacadeService.getInventoryItemsByType(uuid, itemType);
    }
    if (rarity) {
      return this.arcadeFacadeService.getInventoryItemsByRarity(uuid, rarity);
    }*/
    return this.arcadeFacadeService.getUserInventory(uuid);
  }

  @Get('inventory/:uuid/stats')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory statistics retrieved successfully.',
  })
  async getInventoryStats(@Param('uuid') uuid: string): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }> {
    return this.arcadeFacadeService.getInventoryStats(uuid);
  }
  @ApiExtraModels(RarityRange)
  @Get('inventory/:uuid/item/:itemId')
  @ApiOperation({ summary: 'Get specific inventory item' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiParam({ name: 'itemId', description: 'Item ID', example: 'potion_heal' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory item retrieved successfully.',
    type: ArcadeInventoryItem,
  })
  async getUserItem(
    @Param('uuid') uuid: string,
    @Param('itemId') itemId: string,
  ): Promise<ArcadeInventoryItem | null> {
    return this.arcadeFacadeService.getUserItem(uuid, itemId);
  }

  @Post('inventory/add')
  @ApiOperation({ summary: 'Add item to player inventory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item added successfully.',
    type: ArcadeInventoryItem,
  })
  @ApiBody({ type: AddInventoryItemDto })
  async addInventoryItem(
    @Body() data: AddInventoryItemDto,
  ): Promise<ArcadeInventoryItem> {
    return this.arcadeFacadeService.addItemToInventory({
      uuid: data.uuid,
      itemId: data.itemId,
      itemType: data.itemType,
      amount: data.amount,
      rarity: data.rarity,
      sourceType: data.sourceType,
    });
  }

  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item consumed successfully.',
  })
  @ApiBody({ type: ConsumeInventoryItemDto })
  async consumeInventoryItem(
    @Body() { uuid, itemId, amount }: ConsumeInventoryItemDto,
  ): Promise<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }> {
    return this.arcadeFacadeService.consumeInventoryItem(
      uuid,
      itemId,
      amount || 1,
    );
  }

  @Post('inventory/:uuid/item/:itemId/use')
  @ApiOperation({ summary: 'Mark inventory item as used' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiParam({ name: 'itemId', description: 'Item ID', example: 'potion_heal' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item marked as used successfully.',
    type: ArcadeInventoryItem,
  })
  async markItemAsUsed(
    @Param('uuid') uuid: string,
    @Param('itemId') itemId: string,
  ): Promise<ArcadeInventoryItem> {
    return this.arcadeFacadeService.markItemAsUsed(uuid, itemId);
  }

  // ==================== LOOTBOX ENDPOINTS ====================

  @Post('lootbox/open')
  @ApiOperation({ summary: 'Open a loot box and get a random item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Loot box opened successfully.',
    type: OpenLootBoxResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or no boxes available.',
  })
  @ApiBody({ type: OpenLootBoxDto })
  async openLootBox(
    @Body() { uuid, boxId }: OpenLootBoxDto,
  ): Promise<OpenLootBoxResponseDto> {
    return this.arcadeFacadeService.openLootbox(uuid, boxId);
  }

  @Post('lootbox/give')
  @ApiOperation({ summary: 'Give lootbox to player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lootbox given successfully.',
  })
  @ApiBody({ type: GiveLootboxDto })
  async giveLootbox(
    @Body() { uuid, lootboxType, amount }: GiveLootboxDto,
  ): Promise<void> {
    return this.arcadeFacadeService.giveLootbox(uuid, lootboxType, amount || 1);
  }

  @ApiExtraModels(RarityRange)
  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lootbox configuration retrieved successfully.',
    type: LootboxConfigEntity,
  })
  async getLootboxConfig(): Promise<LootboxConfigEntity> {
    return this.arcadeFacadeService.getLootboxConfig();
  }

  // ==================== COMBINED ENDPOINTS ====================

  @Post('claim-items')
  @ApiOperation({
    summary:
      'Claim multiple items from inventory and give them to player in-game',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Items claimed and distributed successfully.',
    type: ClaimItemsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or missing parameters.',
  })
  @ApiBody({ type: ClaimItemsDto })
  async claimItems(
    @Body() claimData: ClaimItemsDto,
  ): Promise<ClaimItemsResponseDto> {
    return this.arcadeFacadeService.claimItems(claimData);
  }

  /*
  @Post('inventory/claim-multiple')
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
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complete user data retrieved successfully.',
  })
  async getCompleteUserData(@Param('uuid') uuid: string): Promise<{
    streak: ArcadeStreak;
    inventory: ArcadeInventoryResponse;
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }> {
    return this.arcadeFacadeService.getCompleteUserData(uuid);
  }
}
