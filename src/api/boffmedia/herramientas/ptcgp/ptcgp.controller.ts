import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  ValidationPipe, 
  UsePipes,
  HttpException,
  HttpStatus,
  Logger,
  Sse
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PtcgpFacadeService } from './ptcgp.facade.service';
import {
  GetCardsDto,
  GetCardDto,
  BatchUpdateCardsDto,
  GetUserCardsDto,
  GetRecentUpdatesDto,
  GetMissingCardsDto,
  GetBestPackDto,
  CalculateProbabilitiesDto,
  GetBattleDataDto,
  CardResponseDto,
  UserCardResponseDto,
  CollectionStatsResponseDto,
  BestPackResponseDto,
  HealthCheckResponseDto,
  BatchUpdateResponseDto
} from './dto/ptcgp.dto';

@ApiTags('Pokemon TCG Pocket')
@Controller('ptcgp')
export class PtcgpController {
  private readonly logger = new Logger(PtcgpController.name);

  constructor(
    private readonly ptcgpFacadeService: PtcgpFacadeService,
  ) {}

  // ==================== HEALTH CHECK ====================

  @Get('health')
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Service health status', type: HealthCheckResponseDto })
  async healthCheck(): Promise<HealthCheckResponseDto> {
    try {
      return await this.ptcgpFacadeService.healthCheck();
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException('Service health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== CARD MANAGEMENT ====================

  @Get('cards')
  @ApiOperation({ summary: 'Get all cards or cards from specific expansion' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'List of cards', type: [CardResponseDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCards(@Query() query: GetCardsDto): Promise<CardResponseDto[]> {
    try {
      return await this.ptcgpFacadeService.getCards(query.expansion);
    } catch (error) {
      this.logger.error('Error getting cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('cards/:expansion/:number')
  @ApiOperation({ summary: 'Get specific card' })
  @ApiParam({ name: 'expansion', description: 'Expansion ID' })
  @ApiParam({ name: 'number', description: 'Card number' })
  @ApiResponse({ status: 200, description: 'Card details', type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCard(@Param() params: GetCardDto): Promise<CardResponseDto> {
    try {
      const card = await this.ptcgpFacadeService.getCard(params.expansion, params.number);
      if (!card) {
        throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
      }
      return card;
    } catch (error) {
      this.logger.error('Error getting card:', error);
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== PACK MANAGEMENT ====================

  @Get('packs')
  @ApiOperation({ summary: 'Get all booster packs or packs from specific expansion' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'List of booster packs' })
  async getBoosterPacks(@Query('expansion') expansion?: string) {
    try {
      return await this.ptcgpFacadeService.getBoosterPacks(expansion);
    } catch (error) {
      this.logger.error('Error getting booster packs:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('packs/probabilities')
  @ApiOperation({ summary: 'Calculate pack opening probabilities' })
  @ApiResponse({ status: 200, description: 'Pack opening probabilities' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateProbabilities(@Body() dto: CalculateProbabilitiesDto) {
    try {
      return await this.ptcgpFacadeService.calculatePackProbabilities(dto.expansionID, dto.packId);
    } catch (error) {
      this.logger.error('Error calculating probabilities:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== USER CARD MANAGEMENT ====================

  @Get('users/:username/cards')
  @ApiOperation({ summary: 'Get user card collection' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({ status: 200, description: 'User card collection', type: [UserCardResponseDto] })
  async getUserCards(@Param('username') username: string): Promise<UserCardResponseDto[]> {
    try {
      return await this.ptcgpFacadeService.getUserCards(username);
    } catch (error) {
      this.logger.error('Error getting user cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('users/cards/batch-update')
  @ApiOperation({ summary: 'Update multiple user cards in batch' })
  @ApiResponse({ status: 200, description: 'Batch update result', type: BatchUpdateResponseDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async batchUpdateUserCards(@Body() dto: BatchUpdateCardsDto): Promise<BatchUpdateResponseDto> {
    try {
      return await this.ptcgpFacadeService.batchUpdateUserCards(dto.username, dto.cardUpdates);
    } catch (error) {
      this.logger.error('Error updating user cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/cards/recent')
  @ApiOperation({ summary: 'Get recent card updates for user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip', type: Number })
  @ApiResponse({ status: 200, description: 'Recent card updates' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRecentCardUpdates(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    try {
      return await this.ptcgpFacadeService.getRecentCardUpdates(username, limit, offset);
    } catch (error) {
      this.logger.error('Error getting recent updates:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/cards/missing')
  @ApiOperation({ summary: 'Get missing cards for user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'Missing cards' })
  async getMissingCards(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ) {
    try {
      return await this.ptcgpFacadeService.getMissingCards(username, expansion);
    } catch (error) {
      this.logger.error('Error getting missing cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/stats')
  @ApiOperation({ summary: 'Get user collection statistics' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'Collection statistics', type: CollectionStatsResponseDto })
  async getCollectionStats(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<CollectionStatsResponseDto> {
    try {
      return await this.ptcgpFacadeService.getCollectionStats(username, expansion);
    } catch (error) {
      this.logger.error('Error getting collection stats:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== PACK RECOMMENDATIONS ====================

  @Get('users/:username/best-pack')
  @ApiOperation({ summary: 'Get best pack recommendation for user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'Best pack recommendation', type: BestPackResponseDto })
  async getBestPack(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<BestPackResponseDto> {
    try {
      if (expansion) {
        return await this.ptcgpFacadeService.getBestPackForExpansion(username, expansion);
      }
      return await this.ptcgpFacadeService.getBestPackToPull(username);
    } catch (error) {
      this.logger.error('Error getting best pack:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/pack-analytics')
  @ApiOperation({ summary: 'Get detailed pack analytics for user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'expansion', required: false, description: 'Expansion ID' })
  @ApiResponse({ status: 200, description: 'Pack analytics' })
  async getPackAnalytics(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<any> {
    try {
      return await this.ptcgpFacadeService.getPackAnalytics(username, expansion);
    } catch (error) {
      this.logger.error('Error getting pack analytics:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/expansion-progress')
  @ApiOperation({ summary: 'Get expansion completion progress for user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({ status: 200, description: 'Expansion progress' })
  async getExpansionProgress(@Param('username') username: string) {
    try {
      return await this.ptcgpFacadeService.getExpansionProgress(username);
    } catch (error) {
      this.logger.error('Error getting expansion progress:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== DATA MANAGEMENT ====================

  @Get('sets')
  @ApiOperation({ summary: 'Get all card sets data' })
  @ApiResponse({ status: 200, description: 'Card sets data' })
  async getSets() {
    try {
      return await this.ptcgpFacadeService.getSets();
    } catch (error) {
      this.logger.error('Error getting sets:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scrape/refresh')
  @ApiOperation({ summary: 'Refresh data from Serebii' })
  @ApiResponse({ status: 200, description: 'Data refresh initiated' })
  async refreshData() {
    try {
      return await this.ptcgpFacadeService.refreshDataFromSerebii();
    } catch (error) {
      this.logger.error('Error refreshing data:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Sse('scrape/status')
  @ApiOperation({ summary: 'Get real-time scraping status via Server-Sent Events' })
  getFetchStatus(): Observable<any> {
    return this.ptcgpFacadeService.getFetchStatus();
  }

  @Get('scrape/solo-battles')
  @ApiOperation({ summary: 'Scrape solo battle data' })
  @ApiResponse({ status: 200, description: 'Solo battle data' })
  async scrapeSoloBattles() {
    try {
      return await this.ptcgpFacadeService.scrapeSoloBattles();
    } catch (error) {
      this.logger.error('Error scraping solo battles:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== BATTLE UTILITIES ====================

  @Post('battles/data')
  @ApiOperation({ summary: 'Get battle data from Serebii URL' })
  @ApiResponse({ status: 200, description: 'Battle data' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getBattleData(@Body() dto: GetBattleDataDto) {
    try {
      return await this.ptcgpFacadeService.getBattleData(dto.battleUrl);
    } catch (error) {
      this.logger.error('Error getting battle data:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}