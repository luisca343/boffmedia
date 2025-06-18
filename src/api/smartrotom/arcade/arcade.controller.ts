import { Controller, Get, HttpStatus, Param, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ArcadeFacadeService } from './arcade.facade.service';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { GetStreakDto, ClaimRewardDto, ArcadeStreak, ClaimRewardResponse } from './dto/arcade-streak.dto';
import { GetInventoryDto, AddInventoryItemDto, ConsumeInventoryItemDto, ClaimInventoryItemsDto } from './dto/inventory.dto';
import { GiveLootboxDto } from './dto/lootbox-management.dto';
import { InventoryResponse } from './entities/inventory-item.entity';
import { LootboxConfigResponse } from './entities/lootbox.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

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
  
  @Get('wordle/:uuid')
  @ApiOperation({ summary: 'Get Wordle game' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Wordle game retrieved successfully.',
    example: 'wordle'
  })
  async getWordle(@Param('uuid') uuid: string): Promise<string> {
    return await this.arcadeFacadeService.getWordle();
  }
  
  @Get('streak/:uuid')
  @ApiOperation({ summary: 'Get user\'s arcade streak status' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Streak status retrieved successfully.',
    type: ArcadeStreak
  })
  async getArcadeStreak(@Param('uuid') uuid: string): Promise<ArcadeStreak> {
    return await this.arcadeFacadeService.getArcadeStreak(uuid);
  }
  
  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Daily reward claimed successfully.',
    type: ClaimRewardResponse
  })
  @ApiBody({ type: ClaimRewardDto })
  async claimDailyReward(@Body() { uuid }: ClaimRewardDto): Promise<ClaimRewardResponse> {
    return await this.arcadeFacadeService.claimDailyReward(uuid);
  }
  
  @Get('banner')
  @ApiOperation({ summary: 'Get daily rewards banner configuration' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Banner configuration retrieved successfully.'
  })
  async getRewardsBanner() {
    return await this.arcadeFacadeService.getRewardsBanner();
  }
  
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
  async openLootBox(@Body() openLootBoxDto: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    return await this.arcadeFacadeService.openLootBox(openLootBoxDto);
  }
  
  @Get('inventory/:uuid')
  @ApiOperation({ summary: 'Get player inventory items' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inventory retrieved successfully.',
    type: InventoryResponse
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiQuery({ name: 'sourceType', description: 'Filter by source type', required: false })
  async getInventory(
    @Param('uuid') uuid: string,
    @Query('sourceType') sourceType?: string
  ): Promise<InventoryResponse> {
    return await this.arcadeFacadeService.getInventory(uuid, sourceType);
  }
  
  @Post('inventory/claim')
  @ApiOperation({ summary: 'Claim items from player inventory' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Items claimed successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: ClaimInventoryItemsDto })
  async claimInventoryItems(@Body() { uuid, items }: ClaimInventoryItemsDto) {
    return await this.arcadeFacadeService.claimInventoryItems(uuid, items);
  }
  
  @Post('inventory/add')
  @ApiOperation({ summary: 'Add item to player inventory' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Item added successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: AddInventoryItemDto })
  async addInventoryItem(@Body() data: AddInventoryItemDto) {
    return await this.arcadeFacadeService.addInventoryItem(data);
  }
  
  @Post('inventory/consume')
  @ApiOperation({ summary: 'Consume an inventory item' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Item consumed successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: ConsumeInventoryItemDto })
  async consumeInventoryItem(@Body() { uuid, itemId }: ConsumeInventoryItemDto) {
    return await this.arcadeFacadeService.consumeInventoryItem(uuid, itemId);
  }
  
  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lootbox configuration retrieved successfully.',
    type: LootboxConfigResponse
  })
  async getLootboxConfig(): Promise<LootboxConfigResponse> {
    return this.arcadeFacadeService.getLootboxConfig();
  }
  
  @Post('lootbox/give')
  @ApiOperation({ summary: 'Give lootbox to player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lootbox given successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: GiveLootboxDto })
  async giveLootbox(@Body() { uuid, lootboxType, amount }: GiveLootboxDto) {
    return await this.arcadeFacadeService.giveLootbox(uuid, lootboxType, amount);
  }
}