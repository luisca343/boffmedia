import { Controller, Get, HttpStatus, Logger, Param, Post, Body, Headers, HttpException, Query } from '@nestjs/common';
import { ArcadeService } from './arcade.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './_dto/lottbox.dto';

@ApiTags('smartrotom/arcade')
@Controller('smartrotom/arcade')
export class ArcadeController {
  private readonly logger = new Logger(ArcadeController.name);

  constructor(
    private readonly arcadeService: ArcadeService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arcade information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve arcade information.' })
  async getArcade() {
    const action = 'get arcade information';
    try {
      this.responseService.logRequest(action, null);
      const result = "Arcade Controller";
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Arcade information retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('wordle/:uuid')
  @ApiOperation({ summary: 'Get Wordle game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Wordle game retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Wordle game.' })
  async getWordle(@Param('uuid') uuid: string) {
    const action = 'get Wordle game';
    try {
      this.responseService.logRequest(action, null);
      const result = await this.arcadeService.getWordle();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Wordle game retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('streak/:uuid')
  @ApiOperation({ summary: 'Get user\'s arcade streak status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Streak status retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve streak status.' })
  async getArcadeStreak(@Param('uuid') uuid: string) {
    try {
      console.log('Retrieving streak status for UUID:', uuid);
      const streak = await this.arcadeService.getArcadeStreak(uuid);
      return {
        data: streak,
        statusCode: 200,
        message: 'Streak status retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to retrieve streak status:', error);
      throw new Error('Failed to retrieve streak status');
    }
  }

  @Post('streak/claim')
  @ApiOperation({ summary: 'Claim daily arcade reward' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daily reward claimed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Already claimed today.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim daily reward.' })
  async claimDailyReward(@Body() body: { uuid: string }) {
    try {
      console.log('Claiming daily reward for UUID:', body);
      const result = await this.arcadeService.claimDailyReward(body.uuid);
      
      if (!result.success) {
        return {
          data: result,
          statusCode: 400,
          message: result.message,
        };
      }
      
      return {
        data: result,
        statusCode: 200,
        message: 'Daily reward claimed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to claim daily reward:', error);
      throw new Error('Failed to claim daily reward');
    }
  }

  @Get('banner')
  @ApiOperation({ summary: 'Get daily rewards banner configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Banner configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve banner configuration.' })
  async getRewardsBanner() {
    try {
      const banner = await this.arcadeService.getRewardsBanner();
      return {
        data: banner,
        statusCode: 200,
        message: 'Banner configuration retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to retrieve banner configuration:', error);
      throw new Error('Failed to retrieve banner configuration');
    }
  }

  @Post('lootbox/open')
  @ApiOperation({ summary: 'Open a loot box and get a random item' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Loot box opened successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request or missing box.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to open loot box.' })
  @ApiBody({ type: OpenLootBoxDto })
  async openLootBox(@Body() openLootBoxDto: OpenLootBoxDto): Promise<{ data: OpenLootBoxResponseDto, statusCode: number, message: string }> {
    try {
      const result = await this.arcadeService.openLootBox(openLootBoxDto);
      
      return {
        data: result,
        statusCode: 200,
        message: 'Loot box opened successfully'
      };
    } catch (error) {
      this.logger.error('Failed to open loot box:', error);
      
      if (error.message === 'Box not found' || error.message === 'No boxes available') {
        return {
          data: { success: false, message: error.message },
          statusCode: 400,
          message: error.message
        };
      }
      
      throw new Error('Failed to open loot box');
    }
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
    try {
      const inventory = await this.arcadeService.getInventory(uuid, sourceType);
      return {
        data: inventory,
        statusCode: HttpStatus.OK,
        message: 'Inventory retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Failed to retrieve inventory:', error);
      throw new HttpException('Failed to retrieve inventory', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Post('inventory/claim')
  @ApiOperation({ summary: 'Claim items from player inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Items claimed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No valid items to claim.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to claim items.' })
  @ApiBody({ 
    description: 'Player UUID and item IDs to claim',
    schema: {
      properties: {
        uuid: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        itemIds: { type: 'array', items: { type: 'string' }, example: ['item1', 'item2'] }
      }
    } 
  })
  async claimInventoryItems(
    @Body() data: { uuid: string; itemIds: string[] }
  ) {
    try {
      const result = await this.arcadeService.claimInventoryItems(data.uuid, data.itemIds);
      
      if (!result.success) {
        return {
          data: result,
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.message
        };
      }
      
      return {
        data: result,
        statusCode: HttpStatus.OK,
        message: `Successfully claimed ${result.claimedItems.length} items`,
      };
    } catch (error) {
      this.logger.error('Failed to claim inventory items:', error);
      throw new HttpException('Failed to claim inventory items', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
      rarity?: string; // Add rarity field
    }
  ) {
    try {
      const result = await this.arcadeService.addInventoryItem(data);
      
      if (!result.success) {
        return {
          data: result,
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.message,
        };
      }
      
      return {
        data: result,
        statusCode: HttpStatus.OK,
        message: 'Item added to inventory successfully',
      };
    } catch (error) {
      this.logger.error('Failed to add inventory item:', error);
      throw new HttpException('Failed to add inventory item', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
  async consumeInventoryItem(
    @Body() data: { uuid: string; itemId: string }
  ) {
    try {
      const result = await this.arcadeService.consumeInventoryItem(data.uuid, data.itemId);
      
      if (!result.success) {
        return {
          data: result,
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.message,
        };
      }
      
      return {
        data: result,
        statusCode: HttpStatus.OK,
        message: 'Item consumed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to consume inventory item:', error);
      throw new HttpException('Failed to consume inventory item', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('lootbox/config')
  @ApiOperation({ summary: 'Get lootbox configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lootbox configuration retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve lootbox configuration.' })
  async getLootboxConfig() {
    try {
      const config = this.arcadeService.getLootboxConfig();
      return {
        data: config,
        statusCode: HttpStatus.OK,
        message: 'Lootbox configuration retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Failed to retrieve lootbox configuration:', error);
      throw new HttpException('Failed to retrieve lootbox configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
  async giveLootbox(
    @Body() data: { uuid: string; lootboxType: string, amount?: number }
  ) {
    try {
      const result = await this.arcadeService.giveLootbox(data.uuid, data.lootboxType, data.amount);
      
      if (!result.success) {
        return {
          data: result,
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.message,
        };
      }
      
      return {
        data: result,
        statusCode: HttpStatus.OK,
        message: 'Lootbox given successfully',
      };
    } catch (error) {
      this.logger.error('Failed to give lootbox:', error);
      throw new HttpException('Failed to give lootbox', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}