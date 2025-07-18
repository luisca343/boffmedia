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
  Sse,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Observable } from 'rxjs';

// Import Facade Service
import { PtcgpFacadeService } from './ptcgp.facade.service';

// Import DTOs
import { GetResourceDto } from './dto/get-resource.dto';
import { GetCardsDto, GetCardDto, CreateCardDto } from './dto/get-cards.dto';
import { GetPacksDto, CreatePackDto, GetPackProbabilitiesDto, GetBestPackDto, GetBestPackForExpansionDto } from './dto/get-packs.dto';
import { GetUserCardsDto, BatchUpdateCardsDto, GetRecentUpdatesDto, GetMissingCardsDto, GetCollectionStatsDto } from './dto/user-cards.dto';
import { GetExpansionsDto, GetExpansionDto, CreateExpansionDto, UpdateExpansionDto } from './dto/expansions.dto';
import { GetSetsDto, ScrapeBattlesDto, StartFetchDto, GetFetchStatusDto, GetBattleDataDto } from './dto/scraper.dto';

// Import Entities
import { CardEntity } from './entities/card.entity';
import { BoosterPackEntity, PackProbabilitiesEntity, BestPackEntity } from './entities/pack.entity';
import { 
  UserCardEntity, 
  CardUpdateResultEntity, 
  RecentCardUpdateEntity, 
  MissingCardEntity, 
  CollectionStatsEntity 
} from './entities/user-card.entity';
import { ExpansionEntity } from './entities/expansion.entity';
import { 
  FetchStatusEntity, 
  BattleDataEntity, 
  SetsDataEntity 
} from './entities/scraper.entity';
import { PtcgpOperationResultEntity, PtcgpCreateResultEntity, BatchUpdateResultEntity } from './entities/operation-result.entity';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('BoffMedia 🛠 | Pokemon TCG Pocket')
@Controller('tools/ptcgp')
@UseInterceptors(ResponseInterceptor)
export class PtcgpController {
  private readonly logger = new Logger(PtcgpController.name);

  constructor(
    private readonly ptcgpFacadeService: PtcgpFacadeService,
  ) {}

  // ==================== HEALTH CHECK ====================

  @Get('health')
  @ApiOperation({ 
    summary: 'Check service health',
    description: 'Returns the current health status of the PTCGP service'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2024-12-15T10:30:00Z',
        stats: { totalCards: 286, totalPacks: 6 }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Service health check failed' 
  })
  async healthCheck() {
    try {
      return await this.ptcgpFacadeService.healthCheck();
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException('Service health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== CARD MANAGEMENT ====================

  @Get('cards')
  @ApiOperation({ 
    summary: 'Get all cards or cards from specific expansion',
    description: 'Retrieve all Pokemon TCG Pocket cards, optionally filtered by expansion'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID (e.g., genetic-apex)',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of cards retrieved successfully',
    type: [CardEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCards(@Query() query: GetCardsDto): Promise<CardEntity[]> {
    try {
      return await this.ptcgpFacadeService.getCards(query.expansion);
    } catch (error) {
      this.logger.error('Error getting cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('cards/:expansion/:number')
  @ApiOperation({ 
    summary: 'Get specific card',
    description: 'Retrieve detailed information about a specific card by expansion and number'
  })
  @ApiParam({ 
    name: 'expansion', 
    description: 'Expansion identifier',
    example: 'genetic-apex'
  })
  @ApiParam({ 
    name: 'number', 
    description: 'Card number within the expansion',
    example: 25
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Card details retrieved successfully',
    type: CardEntity
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Card not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid parameters' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCard(@Param() params: GetCardDto): Promise<CardEntity | null> {
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

  @Post('cards')
  @ApiOperation({ 
    summary: 'Create a new card',
    description: 'Add a new card to the database'
  })
  @ApiBody({ 
    type: CreateCardDto,
    description: 'Card data to create'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Card created successfully',
    type: PtcgpCreateResultEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid card data or card already exists' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCard(@Body() dto: CreateCardDto): Promise<PtcgpCreateResultEntity> {
    try {
      return await this.ptcgpFacadeService.createCard(dto);
    } catch (error) {
      this.logger.error('Error creating card:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== PACK MANAGEMENT ====================

  @Get('packs')
  @ApiOperation({ 
    summary: 'Get all booster packs',
    description: 'Retrieve all booster packs, optionally filtered by expansion'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of booster packs',
    type: [BoosterPackEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request parameters' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getBoosterPacks(@Query() query: GetPacksDto): Promise<BoosterPackEntity[]> {
    try {
      return await this.ptcgpFacadeService.getBoosterPacks(query.expansion);
    } catch (error) {
      this.logger.error('Error getting booster packs:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('packs')
  @ApiOperation({ 
    summary: 'Create a new booster pack',
    description: 'Add a new booster pack to the database'
  })
  @ApiBody({ 
    type: CreatePackDto,
    description: 'Pack data to create'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Booster pack created successfully',
    type: PtcgpCreateResultEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid pack data or pack already exists' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createBoosterPack(@Body() dto: CreatePackDto): Promise<PtcgpCreateResultEntity> {
    try {
      return await this.ptcgpFacadeService.createBoosterPack(dto);
    } catch (error) {
      this.logger.error('Error creating booster pack:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('packs/probabilities')
  @ApiOperation({ 
    summary: 'Calculate pack opening probabilities',
    description: 'Calculate the probability of getting each rarity from a specific pack'
  })
  @ApiBody({ 
    type: GetPackProbabilitiesDto,
    description: 'Pack and expansion to analyze'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Pack opening probabilities calculated',
    type: PackProbabilitiesEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid pack or expansion' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateProbabilities(@Body() dto: GetPackProbabilitiesDto): Promise<PackProbabilitiesEntity> {
    try {
      return await this.ptcgpFacadeService.calculatePackProbabilities(dto.expansion, dto.packId);
    } catch (error) {
      this.logger.error('Error calculating probabilities:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== USER CARD MANAGEMENT ====================

  @Get('users/:username/cards')
  @ApiOperation({ 
    summary: 'Get user card collection',
    description: 'Retrieve all cards owned by a specific user'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to get cards for',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User card collection retrieved successfully',
    type: [UserCardEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  async getUserCards(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<UserCardEntity[]> {
    try {
      return await this.ptcgpFacadeService.getUserCards(username);
    } catch (error) {
      this.logger.error('Error getting user cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('users/cards/batch-update')
  @ApiOperation({ 
    summary: 'Update multiple user cards in batch',
    description: 'Update card counts for multiple cards in a single transaction'
  })
  @ApiBody({ 
    type: BatchUpdateCardsDto,
    description: 'Batch update data including username and card changes'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Batch update completed successfully',
    type: [CardUpdateResultEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid update data or user not found' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async batchUpdateUserCards(@Body() dto: BatchUpdateCardsDto): Promise<CardUpdateResultEntity[]> {
    try {
      return await this.ptcgpFacadeService.batchUpdateUserCards(dto.username, dto.cardUpdates);
    } catch (error) {
      this.logger.error('Error updating user cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/cards/recent')
  @ApiOperation({ 
    summary: 'Get recent card updates for user',
    description: 'Retrieve the most recent card collection changes for a user'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to get updates for',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Number of records to return (default: 10)',
    example: 10
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    description: 'Number of records to skip (default: 0)',
    example: 0
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recent card updates retrieved successfully',
    type: [RecentCardUpdateEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRecentCardUpdates(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<RecentCardUpdateEntity[]> {
    try {
      return await this.ptcgpFacadeService.getRecentCardUpdates(username, limit, offset);
    } catch (error) {
      this.logger.error('Error getting recent updates:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/cards/missing')
  @ApiOperation({ 
    summary: 'Get missing cards for user',
    description: 'Retrieve all cards that the user does not own yet'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to get missing cards for',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Missing cards retrieved successfully',
    type: [MissingCardEntity]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  async getMissingCards(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<MissingCardEntity[]> {
    try {
      return await this.ptcgpFacadeService.getMissingCards(username, expansion);
    } catch (error) {
      this.logger.error('Error getting missing cards:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/stats')
  @ApiOperation({ 
    summary: 'Get user collection statistics',
    description: 'Get comprehensive statistics about a user\'s card collection progress'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to get statistics for',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Collection statistics retrieved successfully',
    type: CollectionStatsEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  async getCollectionStats(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<CollectionStatsEntity> {
    try {
      return await this.ptcgpFacadeService.getCollectionStats(username, expansion);
    } catch (error) {
      this.logger.error('Error getting collection stats:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== PACK RECOMMENDATIONS ====================

  @Get('users/:username/best-pack')
  @ApiOperation({ 
    summary: 'Get best pack recommendation for user',
    description: 'Calculate which booster pack would be most beneficial for the user to open'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to get recommendation for',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Limit recommendation to specific expansion',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Best pack recommendation calculated successfully',
    type: BestPackEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  async getBestPack(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ): Promise<BestPackEntity> {
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
  @ApiOperation({ 
    summary: 'Get detailed pack analytics for user',
    description: 'Get comprehensive analytics including pack recommendations, missing cards breakdown, and collection insights'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to analyze',
    example: 'trainer123'
  })
  @ApiQuery({ 
    name: 'expansion', 
    required: false, 
    description: 'Filter by expansion ID',
    example: 'genetic-apex'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Pack analytics retrieved successfully',
    schema: {
      example: {
        collectionStats: { totalCards: 286, ownedCards: 142, missingCards: 144, completionPercentage: 49.65 },
        bestPack: { bestPack: 'charizard', score: 145.5, allScores: { charizard: 145.5, pikachu: 120.3 } },
        packRecommendations: [{ packName: 'charizard', missingCount: 48, score: 145.5, isRecommended: true }]
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found or invalid parameters' 
  })
  async getPackAnalytics(
    @Param('username') username: string,
    @Query('expansion') expansion?: string
  ) {
    try {
      return await this.ptcgpFacadeService.getPackAnalytics(username, expansion);
    } catch (error) {
      this.logger.error('Error getting pack analytics:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users/:username/expansion-progress')
  @ApiOperation({ 
    summary: 'Get expansion completion progress for user',
    description: 'Get detailed progress information for all expansions'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username to analyze',
    example: 'trainer123'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Expansion progress retrieved successfully',
    schema: {
      example: {
        expansions: [
          { name: 'genetic-apex', totalCards: 286, ownedCards: 142, completion: 49.65, missing: 144 }
        ],
        overall: { totalExpansions: 1, completedExpansions: 0, averageCompletion: 49.65 }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'User not found' 
  })
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
  @ApiOperation({ 
    summary: 'Get all card sets data',
    description: 'Retrieve comprehensive data about all card sets including main sets and promo sets'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Card sets data retrieved successfully',
    type: SetsDataEntity
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve sets data' 
  })
  async getSets(): Promise<SetsDataEntity> {
    try {
      return await this.ptcgpFacadeService.getSets();
    } catch (error) {
      this.logger.error('Error getting sets:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scrape/refresh')
  @ApiOperation({ 
    summary: 'Refresh data from Serebii',
    description: 'Initiate a full data refresh from Serebii.net, updating all cards, packs, and sets'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Data refresh initiated successfully',
    type: SetsDataEntity
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to refresh data' 
  })
  async refreshData(): Promise<SetsDataEntity> {
    try {
      return await this.ptcgpFacadeService.refreshDataFromSerebii();
    } catch (error) {
      this.logger.error('Error refreshing data:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Sse('scrape/status')
  @ApiOperation({ 
    summary: 'Get real-time scraping status via Server-Sent Events',
    description: 'Subscribe to real-time updates about the data scraping process'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Server-sent event stream for scraping status',
    type: FetchStatusEntity
  })
  getFetchStatus(): Observable<FetchStatusEntity> {
    return this.ptcgpFacadeService.getFetchStatus();
  }

  @Get('scrape/solo-battles')
  @ApiOperation({ 
    summary: 'Scrape solo battle data',
    description: 'Retrieve and parse solo battle information from Serebii'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Solo battle data scraped successfully',
    type: BattleDataEntity
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to scrape battle data' 
  })
  async scrapeSoloBattles(): Promise<BattleDataEntity> {
    try {
      return await this.ptcgpFacadeService.scrapeSoloBattles();
    } catch (error) {
      this.logger.error('Error scraping solo battles:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== BATTLE UTILITIES ====================

  @Post('battles/data')
  @ApiOperation({ 
    summary: 'Get battle data from Serebii URL',
    description: 'Parse and retrieve battle information from a specific Serebii battle page'
  })
  @ApiBody({ 
    type: GetBattleDataDto,
    description: 'Battle URL to scrape'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Battle data retrieved successfully',
    type: BattleDataEntity
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid URL or failed to parse battle data' 
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getBattleData(@Body() dto: GetBattleDataDto): Promise<BattleDataEntity> {
    try {
      return await this.ptcgpFacadeService.getBattleData(dto.battleUrl);
    } catch (error) {
      this.logger.error('Error getting battle data:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}