import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { TcgFacadeService } from './tcg.facade.service';
import { TcgSeries } from './entities/tcg-series.entity';
import { TcgSet } from './entities/tcg-set.entity';
import { TcgCard } from './entities/tcg-card.entity';
import { SeriesCardsGroup } from './entities/series-cards-grouped.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { AddUserCardDto, UpdateUserCardQuantityDto } from './dto/user-card.dto';
import { UserCard, UserCardHistory } from './entities/user-card.entity';

@ApiTags('BoffMedia 🛠 | Pokemon TCG Pocket')
@Controller('tools/ptcgp')
@UseInterceptors(ResponseInterceptor)
export class TcgController {
  constructor(private readonly tcgFacade: TcgFacadeService) {}

  // ==================== HELPER METHODS ====================

  private safeParse(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }

  private parseCardData(card: any, locale: string): TcgCard {
    if(!card[`image_es`]) {
      console.warn(`[TCG] No image found for card ${card.id} in locale ${locale}`);
      return null;
    }
    return {
      id: card.id,
      setId: card.set_id,
      setName: card[`set_name_${locale}`] || card.set_name_en,
      localId: card.local_id,
      name: card[`name_${locale}`] || card.name_en,
      image: card[`image_${locale}`] || card.image_local_en,
      category: card.category,
      illustrator: card.illustrator,
      rarity: card.rarity,
      hp: card.hp,
      stage: card.stage,
      description: card[`description_${locale}`] || card.description_en,
      updated: card.updated,
      retreat: card.retreat,
      
      types: this.safeParse(card.types),
      weaknesses: this.safeParse(card.weaknesses),
      attacks: this.safeParse(card.attacks),
      boosters: this.safeParse(card.boosters),
      variants: this.safeParse(card.variants),
      legal: this.safeParse(card.legal),
    };
  }

  // ==================== DATABASE OPERATIONS ====================

  @Get('series')
  @ApiOperation({ summary: 'Get all series' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Series retrieved successfully from database.',
    type: [TcgSeries]
  })
  async getAllSeries(): Promise<TcgSeries[]> {
    return this.tcgFacade.getAllSeries();
  }

  @Get('series/:seriesId/sets')
  @ApiOperation({ summary: 'Get sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sets retrieved successfully from database.',
    type: [TcgSet]
  })
  async getSetsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSet[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    return sets.map(set => ({
      id: set.id,
      name: set[`name_${locale}`] || set.name_en,
      logo: set.logo,
      symbol: set.symbol,
      cardCountOfficial: set.card_count_official,
      cardCountTotal: set.card_count_total,
    }));
  }

  @Get('sets/:setId/cards')
  @ApiOperation({ summary: 'Get cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards retrieved successfully from database.',
    type: [TcgCard]
  })
  async getCardsForSetFromDb(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    const cards = await this.tcgFacade.getCardsForSetFromDb(setId);
    return cards.map(card => this.parseCardData(card, locale));
  }

  @Get('cards/:cardId')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Card retrieved successfully from database.',
    type: TcgCard
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Card not found.'
  })
  async getCardById(
    @Param('cardId') cardId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard> {
    const card = await this.tcgFacade.getCardById(cardId);
    return this.parseCardData(card, locale);
  }

  @Get('series/:seriesId/cards/grouped')
  @ApiOperation({ summary: 'Get all cards for series grouped by set' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All cards from series retrieved successfully from database, grouped by set.',
    type: [SeriesCardsGroup]
  })
  async getAllCardsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<SeriesCardsGroup[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    const groupedCards = [];
    
    for (const set of sets) {
      const cards = await this.tcgFacade.getCardsForSetFromDb(set.id);
      const mappedCards = cards.map(card => this.parseCardData(card, locale));

      groupedCards.push({
        setId: set.id,
        setName: set[`name_${locale}`] || set.name_en,
        cardCount: mappedCards.length,
        cards: mappedCards,
      });
    }
    
    return groupedCards;
  }

  @Get('series/:seriesId/cards')
  @ApiOperation({ summary: 'Get all cards for series ungrouped' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All cards from series retrieved successfully from database, ungrouped.',
    type: [TcgCard]
  })
  async getAllCardsForSeriesUngroupedFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    const allCards = [];
    
    for (const set of sets) {
      const cards = await this.tcgFacade.getCardsForSetFromDb(set.id);
      const mappedCards = cards.map(card => this.parseCardData(card, locale));
      allCards.push(...mappedCards);
    }
    
    return allCards;
  }

  // ==================== FETCH OPERATIONS (EXTERNAL API) ====================

  @Get('fetch/series')
  @ApiOperation({ summary: 'Fetch and store series' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Series fetched and stored successfully.',
    type: SuccessResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch series from external API.'
  })
  async fetchAndStoreSeries(): Promise<SuccessResponse> {
    return this.tcgFacade.fetchAndStoreSeries();
  }

  @Get('fetch/series/:seriesId/sets')
  @ApiOperation({ summary: 'Fetch sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sets fetched successfully from API.',
    type: [TcgSet]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.'
  })
  async fetchSetsForSeries(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSet[]> {
    return this.tcgFacade.fetchSetsForSeries(seriesId, locale);
  }

  @Get('fetch/series/:seriesId/sets/store')
  @ApiOperation({ summary: 'Fetch and store sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sets fetched and stored successfully (both languages).',
    type: [TcgSet]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.'
  })
  async fetchAndStoreSetsForSeries(
    @Param('seriesId') seriesId: string,
  ): Promise<TcgSet[]> {
    return this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
  }

  @Get('fetch/sets/:setId/cards')
  @ApiOperation({ summary: 'Fetch cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards fetched successfully from API.',
    type: [TcgCard]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.'
  })
  async fetchCardsForSet(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    return await this.tcgFacade.fetchAndStoreCardsForSet(setId, locale);
  }

  @Get('fetch/sets/:setId/cards/store')
  @ApiOperation({ summary: 'Fetch and store cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards fetched and stored successfully.',
    type: [TcgCard]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.'
  })
  async fetchAndStoreCardsForSet(
    @Param('setId') setId: string,
  ): Promise<TcgCard[]> {
    return await this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(setId);
  }

  // ==================== FETCH BATCH OPERATIONS ====================

  @Get('fetch/series/:seriesId/cards/store')
  @ApiOperation({ summary: 'Fetch and store all cards for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards fetched and stored for all sets in series.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          setId: { type: 'string' },
          cards: { type: 'array' },
          error: { type: 'string', nullable: true }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch sets or cards.'
  })
  async fetchAndStoreAllCardsForSeries(
    @Param('seriesId') seriesId: string,
  ): Promise<Array<{ setId: string; cards: any[] | null; error: string | null }>> {
    let sets;
    
    try {
      sets = await this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
    } catch (err) {
      console.error(`[TCG] Failed to fetch sets for series ${seriesId}:`, err);
      return [{ 
        setId: seriesId, 
        cards: null, 
        error: `Failed to fetch sets for series ${seriesId}: ${err?.message || err}` 
      }];
    }
    
    const results = [];
    
    for (const set of sets) {
      let cards = null;
      let error = null;

      console.log(`[TCG] Fetching cards for set ${set.id}...`);
      
      try {
        cards = await this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(set.id);
      } catch (err) {
        error = err?.message || err;
        console.error(`[TCG] Failed to fetch/store cards for set ${set.id}:`, err);
      }
      
      // If cards is null or empty, but error exists, try fetching EN only as fallback
      if ((!cards || cards.length === 0) && error) {
        try {
          cards = await this.tcgFacade.fetchAndStoreCardsForSet(set.id, 'en');
          error = `ES fetch failed, but EN succeeded.`;
        } catch (err2) {
          error += ` | EN fetch also failed: ${err2?.message || err2}`;
        }
      }
      
      results.push({ setId: set.id, cards, error });
    }
    
    return results;
  }
  // ==================== USER CARDS OPERATIONS ====================

  @Get('users/:userName/cards')
  @ApiOperation({ summary: 'Get user cards' })
  @ApiParam({ name: 'userName', description: 'User Name', example: 'user123' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User cards retrieved successfully.',
    type: [UserCard]
  })
  async getUserCards(@Param('userName') userName: string): Promise<UserCard[]> {
    return this.tcgFacade.getUserCards(userName);
  }

  @Post('users/cards')
  @ApiOperation({ summary: 'Add card to user collection' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Card added to user collection successfully.',
    type: SuccessResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or card does not exist.'
  })
  async addUserCard(@Body() addUserCardDto: AddUserCardDto): Promise<SuccessResponse> {
    return this.tcgFacade.addUserCard(addUserCardDto);
  }

  @Put('users/:userId/cards/:cardId')
  @ApiOperation({ summary: 'Update user card quantity' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User card quantity updated successfully.',
    type: SuccessResponse
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User does not own this card.'
  })
  async updateUserCardQuantity(
    @Param('userId') userId: string,
    @Param('cardId') cardId: string,
    @Body() updateDto: UpdateUserCardQuantityDto
  ): Promise<SuccessResponse> {
    return this.tcgFacade.updateUserCardQuantity(userId, cardId, updateDto);
  }

  @Delete('users/:userId/cards/:cardId')
  @ApiOperation({ summary: 'Remove card from user collection' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Card removed from user collection successfully.',
    type: SuccessResponse
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User does not own this card.'
  })
  async removeUserCard(
    @Param('userId') userId: string,
    @Param('cardId') cardId: string
  ): Promise<SuccessResponse> {
    return this.tcgFacade.removeUserCard(userId, cardId);
  }

  @Get('users/:userId/cards/history')
  @ApiOperation({ summary: 'Get user card history' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User card history retrieved successfully.',
    type: [UserCardHistory]
  })
  async getUserCardHistory(@Param('userId') userId: string): Promise<UserCardHistory[]> {
    return this.tcgFacade.getUserCardHistory(userId);
  }


  @Get('migrate')
  @ApiOperation({ summary: 'Migrate TCG data to new schema' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TCG data migration completed successfully.',
    type: SuccessResponse
  })
  async migrateData(): Promise<SuccessResponse> {
    return await this.tcgFacade.migrateOldUserCards();
  }
}