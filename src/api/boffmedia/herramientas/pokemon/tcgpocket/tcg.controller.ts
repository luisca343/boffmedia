import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { TcgFacadeService } from './tcg.facade.service';

@ApiTags('BoffMedia 🛠 | Pokemon TCG Pocket')
@Controller('tools/ptcgp')
@UseInterceptors(ResponseInterceptor)
export class TcgController {

  /**
   * Get all cards from all sets in a series from DB, with language fallback
   */
  @Get('series/:seriesId/cards/db')
  @ApiOperation({ summary: 'Get all cards in a series from DB (language fallback)' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiQuery({ name: 'locale', description: 'Requested language (en|es)', required: false })
  @ApiResponse({ status: 200, description: 'All cards from all sets in series retrieved from DB.' })
  async getAllCardsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ) {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    const allCards = [];
    for (const set of sets) {
      const cards = await this.tcgFacade.getCardsForSetFromDb(set.id);
      allCards.push(...cards.map(card => ({
        id: card.id,
        localId: card.local_id,
        setId: set.id,
        setName: set[`name_${locale}`] || set.name_en,
        name: card[`name_${locale}`] || card.name_en,
        image: card[`image_local_${locale}`] || card.image_local_en,
        category: card.category,
        illustrator: card.illustrator,
        rarity: card.rarity,
        hp: card.hp,
        stage: card.stage,
        description: card[`description_${locale}`] || card.description_en,
        updated: card.updated,
      })));
    }
    return allCards;
  }
  
  @Get('series/:seriesId/sets/cards/all')
  @ApiOperation({ summary: 'Fetch and store all cards for all sets in a series (EN+ES, fallback)' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiResponse({ status: 200, description: 'Cards fetched and stored for all sets.' })
  @ApiResponse({ status: 500, description: 'Failed to fetch sets or cards.' })
  async fetchAndStoreAllCardsForSeries(
    @Param('seriesId') seriesId: string,
  ) {
    let sets;
    try {
      sets = await this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
    } catch (err) {
      console.error(`[TCG] Failed to fetch sets for series ${seriesId}:`, err);
      return { error: `Failed to fetch sets for series ${seriesId}`, details: err?.message || err };
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
      // If cards is null or empty, but error exists, try fetching EN only
      if ((!cards || cards.length === 0) && error) {
        try {
          cards = await this.tcgFacade.fetchAndStoreCardsForSet(set.id, 'en');
          error = `[TCG] ES fetch failed, but EN succeeded.`;
        } catch (err2) {
          error += ` | EN fetch also failed: ${err2?.message || err2}`;
        }
      }
      results.push({ setId: set.id, cards, error });
    }
    return results;
  }

  /**
   * Get all sets for a series from DB, with language fallback
   */
  @Get('series/:seriesId/sets/db')
  @ApiOperation({ summary: 'Get all sets for a series from DB (language fallback)' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiQuery({ name: 'locale', description: 'Requested language (en|es)', required: false })
  @ApiResponse({ status: 200, description: 'Sets retrieved from DB.' })
  async getSetsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ) {
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

  /**
   * Get all cards for a set from DB, with language fallback
   */
  @Get('sets/:setId/cards/db')
  @ApiOperation({ summary: 'Get all cards for a set from DB (language fallback)' })
  @ApiParam({ name: 'setId', description: 'Set ID' })
  @ApiQuery({ name: 'locale', description: 'Requested language (en|es)', required: false })
  @ApiResponse({ status: 200, description: 'Cards retrieved from DB.' })
  async getCardsForSetFromDb(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ) {
    const cards = await this.tcgFacade.getCardsForSetFromDb(setId);
    return cards.map(card => ({
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
    }));
  }
  constructor(private readonly tcgFacade: TcgFacadeService) {}

  @Get('series')
  @ApiOperation({ summary: 'Get all series from DB' })
  @ApiResponse({ status: 200, description: 'Series retrieved from DB.' })
  async getAllSeries() {
    return this.tcgFacade.getAllSeries();
  }

  @Get('series/fetch')
  @ApiOperation({ summary: 'Fetch and store all series from API' })
  @ApiResponse({ status: 200, description: 'Series fetched and stored.' })
  async fetchAndStoreSeries() {
    return this.tcgFacade.fetchAndStoreSeries();
  }

  @Get('series/:seriesId/sets')
  @ApiOperation({ summary: 'Get all sets for a series from API (single language)' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiQuery({ name: 'locale', description: 'Requested language (en|es)', required: false })
  @ApiResponse({ status: 200, description: 'Sets retrieved from API.' })
  async getSetsForSeries(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ) {
    return this.tcgFacade.fetchSetsForSeries(seriesId, locale);
  }

  @Get('series/:seriesId/sets/all')
  @ApiOperation({ summary: 'Get all sets for a series from API (EN+ES, merged)' })
  @ApiParam({ name: 'seriesId', description: 'Series ID' })
  @ApiResponse({ status: 200, description: 'Sets retrieved from API (EN+ES).' })
  async getSetsForSeriesBothLanguages(
    @Param('seriesId') seriesId: string,
  ) {
    return this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
  }

  @Get('sets/:setId/cards/all')
  @ApiOperation({ summary: 'Fetch and store all cards for a set (EN+ES, merged)' })
  @ApiParam({ name: 'setId', description: 'Set ID' })
  @ApiResponse({ status: 200, description: 'Cards fetched and stored for set.' })
  async fetchAndStoreCardsForSetBothLanguages(
    @Param('setId') setId: string,
  ) {
    return this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(setId);
  }
}
