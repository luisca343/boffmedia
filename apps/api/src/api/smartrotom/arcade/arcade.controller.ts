import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ArcadeFacadeService } from './arcade.facade.service';

// Import the correct DTOs
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { ClaimRewardDto } from './dto/arcade-streak.dto';
import {
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
} from './dto/inventory.dto';
import { GiveLootboxDto } from './dto/lootbox-management.dto';

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
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { RequireSession } from '@api/_utils/decorators/require-session.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { Roles } from '@api/_utils/decorators/roles.decorator';

@ApiTags('SmartRotom | Arcade')
// Catalogue reads stay public. Everything that grants, consumes or resets a
// player's items runs on the SESSION's uuid: these routes took the owner from
// the body or the URL while being fully public, so anyone could hand themselves
// items, open someone else's lootbox or wipe their streak.
@Public()
@Controller('smartrotom/arcade')
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

  @RequireSession()
  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily reward claimed successfully.',
    type: ArcadeStreakClaim,
  })
  @ApiBody({ type: ClaimRewardDto })
  async claimDailyReward(
    @Body() _claim: ClaimRewardDto,
    @CurrentMcUuid() uuid: string,
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

  @RequireSession()
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
  async resetUserStreak(@CurrentMcUuid() uuid: string): Promise<void> {
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
    @Param('uuid') _pathUuid: string,
    @CurrentMcUuid() uuid: string,
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
    @Param('uuid') _pathUuid: string,
    @CurrentMcUuid() uuid: string,
    @Param('itemId') itemId: string,
  ): Promise<ArcadeInventoryItem | null> {
    return this.arcadeFacadeService.getUserItem(uuid, itemId);
  }

  @RequireSession()
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
    @CurrentMcUuid() uuid: string,
  ): Promise<ArcadeInventoryItem> {
    return this.arcadeFacadeService.addItemToInventory({
      // Session, not `data.uuid`: this route hands out items.
      uuid,
      itemId: data.itemId,
      itemType: data.itemType,
      amount: data.amount ?? 1,
      rarity: data.rarity,
      sourceType: data.sourceType,
    });
  }

  @RequireSession()
  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item consumed successfully.',
  })
  @ApiBody({ type: ConsumeInventoryItemDto })
  async consumeInventoryItem(
    @Body() { itemId, amount }: ConsumeInventoryItemDto,
    @CurrentMcUuid() uuid: string,
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

  @RequireSession()
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
    @Param('uuid') _pathUuid: string,
    @CurrentMcUuid() uuid: string,
    @Param('itemId') itemId: string,
  ): Promise<ArcadeInventoryItem> {
    return this.arcadeFacadeService.markItemAsUsed(uuid, itemId);
  }

  // ==================== LOOTBOX ENDPOINTS ====================

  @RequireSession()
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
    @Body() { boxId }: OpenLootBoxDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<OpenLootBoxResponseDto> {
    return this.arcadeFacadeService.openLootbox(uuid, boxId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
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

  // Claiming moved to MCEF: the page delivers via darCaja('arcade', ids) → mod → POST /smartrotom/caja/claim.

  /*
  @RequireSession()
  @Post('inventory/claim-multiple')
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Items claimed successfully.',
    type: [ArcadeInventory]
  })
  @ApiBody({ type: ClaimInventoryItemsDto })
  async claimMultipleItems(
    @Body() { items }: ClaimInventoryItemsDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<ArcadeInventory[]> {
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
