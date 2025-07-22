import { Controller, Get, Param, Query, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { TcgFacadeService } from './tcg.facade.service';
import { TcgSeriesEntity } from './entities/tcg-series.entity';
import { TcgSetEntity } from './entities/tcg-set.entity';
import { TcgCardEntity } from './entities/tcg-card.entity';
import { SeriesCardsGroupEntity } from './entities/series-cards-grouped.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

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

  private parseCardData(card: any, locale: string): TcgCardEntity {
    return {
      id: card.id,
      localId: card.local_id,
      name: card[`name_${locale}`] || card.name_en,
      image: card[`image_local_${locale}`] || card.image_local_en,
      category: card.category,
      illustrator: card.illustrator,
      rarity: card.rarity,
      hp: card.hp,
      stage: card.stage,
      description: card[`description_${locale}`] || card.description_en,
      updated: card.updated,
      
      // Parse JSON fields
      types: this.safeParse(card.types),
      weaknesses: this.safeParse(card.weaknesses),
      attacks: this.safeParse(card.attacks),
      boosters: this.safeParse(card.boosters),
      variants: this.safeParse(card.variants),
      legal: this.safeParse(card.legal),
      retreat: card.retreat,
    };
  }

  // ==================== DATABASE OPERATIONS ====================

  @Get('series')
  @ApiOperation({ summary: 'Get all series' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Series retrieved successfully from database.',
    type: [TcgSeriesEntity]
  })
  async getAllSeries(): Promise<TcgSeriesEntity[]> {
    return this.tcgFacade.getAllSeries();
  }

  @Get('series/:seriesId/sets')
  @ApiOperation({ summary: 'Get sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sets retrieved successfully from database.',
    type: [TcgSetEntity]
  })
  async getSetsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSetEntity[]> {
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
    type: [TcgCardEntity]
  })
  async getCardsForSetFromDb(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCardEntity[]> {
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
    type: TcgCardEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Card not found.'
  })
  async getCardById(
    @Param('cardId') cardId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCardEntity> {
    const card = await this.tcgFacade.getCardById(cardId);
    return this.parseCardData(card, locale);
  }

  @Get('series/:seriesId/cards')
  @ApiOperation({ summary: 'Get all cards for series grouped by set' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All cards from series retrieved successfully from database, grouped by set.',
    type: [SeriesCardsGroupEntity]
  })
  async getAllCardsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<SeriesCardsGroupEntity[]> {
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
    type: [TcgSetEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.'
  })
  async fetchSetsForSeries(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSetEntity[]> {
    return this.tcgFacade.fetchSetsForSeries(seriesId, locale);
  }

  @Get('fetch/series/:seriesId/sets/store')
  @ApiOperation({ summary: 'Fetch and store sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sets fetched and stored successfully (both languages).',
    type: [TcgSetEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.'
  })
  async fetchAndStoreSetsForSeries(
    @Param('seriesId') seriesId: string,
  ): Promise<TcgSetEntity[]> {
    return this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
  }

  @Get('fetch/sets/:setId/cards')
  @ApiOperation({ summary: 'Fetch cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiQuery({ name: 'locale', description: 'Language locale (en|es)', required: false, example: 'en' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards fetched successfully from API.',
    type: [TcgCardEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.'
  })
  async fetchCardsForSet(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCardEntity[]> {
    return this.tcgFacade.fetchAndStoreCardsForSet(setId, locale);
  }

  @Get('fetch/sets/:setId/cards/store')
  @ApiOperation({ summary: 'Fetch and store cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cards fetched and stored successfully.',
    type: [TcgCardEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.'
  })
  async fetchAndStoreCardsForSet(
    @Param('setId') setId: string,
  ): Promise<TcgCardEntity[]> {
    return this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(setId);
  }

  // ==================== FETCH BATCH OPERATIONS ====================

  @Get('fetch/series/:seriesId/cards/store')
  @ApiOperation({ summary: 'Fetch and store all cards for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
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
}