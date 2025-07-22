import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable, Inject, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ITcgRepository } from '../repositories/interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { TcgErrorService } from './tcg-error.service';
import { TcgConfigService } from './tcg-config.service';

@Injectable()
export class TcgService {
  constructor(
    @Inject(TCGPOCKET_REPOSITORY_TOKEN)
    private readonly tcgRepository: ITcgRepository,
    private readonly httpService: HttpService,
    private readonly errorService: TcgErrorService,
    private readonly configService: TcgConfigService,
  ) {}

  // ==================== SERIES OPERATIONS ====================

  async getAll(): Promise<TcgSeriesDto[]> {
    try {
      return await this.tcgRepository.findAll();
    } catch (error) {
      this.errorService.handleDatabaseError(error, 'Get all series');
    }
  }

  async getSeriesById(id: string): Promise<any> {
    try {
      this.errorService.validateSeriesId(id);
      
      const series = await this.tcgRepository.findSeriesById(id);
      if (!series) {
        throw new NotFoundException(`Series with ID ${id} not found`);
      }

      return series;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get series by ID');
    }
  }

  async saveSeries(series: TcgSeriesDto[]): Promise<void> {
    try {
      if (!series || series.length === 0) {
        throw new BadRequestException('Series data is required');
      }

      const formattedSeries = series.map(s => ({
        id: s.id,
        name_en: s.name_en,
        name_es: s.name_es,
        logo: s.logo || null,
      }));

      await this.tcgRepository.insertSeries(formattedSeries);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Save series');
    }
  }

  async fetchAndStoreSeries(): Promise<{ success: boolean; count: number }> {
    try {
      // Fetch EN and ES series in parallel
      const [enRes, esRes] = await Promise.all([
        firstValueFrom(this.httpService.get(this.configService.getSeriesUrl('en'))),
        firstValueFrom(this.httpService.get(this.configService.getSeriesUrl('es'))),
      ]);

      const enSeries = enRes.data;
      const esSeries = esRes.data;

      // Merge by id
      const seriesMap = new Map<string, TcgSeriesDto>();
      
      enSeries.forEach((s: any) => {
        seriesMap.set(s.id, {
          id: s.id,
          name_en: s.name,
          name_es: '',
          logo: s.logo || null,
        });
      });

      esSeries.forEach((s: any) => {
        if (seriesMap.has(s.id)) {
          seriesMap.get(s.id)!.name_es = s.name;
        } else {
          seriesMap.set(s.id, {
            id: s.id,
            name_en: '',
            name_es: s.name,
            logo: s.logo || null,
          });
        }
      });

      const mergedSeries = Array.from(seriesMap.values());
      await this.saveSeries(mergedSeries);

      return { success: true, count: mergedSeries.length };
    } catch (error) {
      this.errorService.handleApiError(error, 'Fetch and store series');
    }
  }

  // ==================== SETS OPERATIONS ====================

  async getSetsForSeriesFromDb(seriesId: string): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);
      return await this.tcgRepository.getSetsBySeriesId(seriesId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get sets for series from database');
    }
  }

  async fetchSetsForSeries(seriesId: string, locale: string = 'en'): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);
      this.errorService.validateLocale(locale);

      const url = this.configService.getSeriesDetailUrl(locale, seriesId);
      const response = await firstValueFrom(this.httpService.get(url));
      const sets = response.data.sets || [];

      return sets.map((set: any) => ({
        id: set.id,
        name: set.name,
        logo: set.logo,
        symbol: set.symbol,
        cardCountOfficial: set.cardCount?.official ?? 0,
        cardCountTotal: set.cardCount?.total ?? 0,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch sets for series');
    }
  }

  async fetchSetsForSeriesBothLanguages(seriesId: string): Promise<any[]> {
    console.log(`[TCG] Fetching sets for series ${seriesId} in both languages`);
    try {
      this.errorService.validateSeriesId(seriesId);

      // Fetch EN and ES sets in parallel
      const [enRes, esRes] = await Promise.all([
        firstValueFrom(this.httpService.get(this.configService.getSeriesDetailUrl('en', seriesId))),
        firstValueFrom(this.httpService.get(this.configService.getSeriesDetailUrl('es', seriesId))),
      ]);

      console.log(`[TCG] EN sets: ${enRes.data.sets.length}, ES sets: ${esRes.data.sets.length}`);
      if (!enRes.data.sets || !esRes.data.sets) {
        throw new NotFoundException(`No sets found for series ID ${seriesId}`);
      }
      

      const enSets = enRes.data.sets || [];
      const esSets = esRes.data.sets || [];

      // Merge by set id
      const setMap = new Map<string, any>();
      
      enSets.forEach((set: any) => {
        setMap.set(set.id, {
          id: set.id,
          series_id: seriesId,
          name_en: set.name,
          name_es: '',
          logo: set.logo,
          symbol: set.symbol,
          card_count_official: set.cardCount?.official ?? 0,
          card_count_total: set.cardCount?.total ?? 0,
        });
      });

      esSets.forEach((set: any) => {
        if (setMap.has(set.id)) {
          setMap.get(set.id).name_es = set.name;
        } else {
          setMap.set(set.id, {
            id: set.id,
            series_id: seriesId,
            name_en: '',
            name_es: set.name,
            logo: set.logo,
            symbol: set.symbol,
            card_count_official: set.cardCount?.official ?? 0,
            card_count_total: set.cardCount?.total ?? 0,
          });
        }
      });

      const mergedSets = Array.from(setMap.values());

      // Download images locally
      await this.downloadSetImages(mergedSets);

      // Store in database
      await this.tcgRepository.insertSets(mergedSets);

      return mergedSets;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch sets for series (both languages)');
    }
  }

  // ==================== CARDS OPERATIONS ====================

  async getCardsForSetFromDb(setId: string): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);
      return await this.tcgRepository.getCardsBySetId(setId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get cards for set from database');
    }
  }

  async getCardById(cardId: string): Promise<any> {
    try {
      if (!cardId || cardId.trim().length === 0) {
        throw new BadRequestException('Card ID is required');
      }
      
      const card = await this.tcgRepository.findCardById(cardId);
      
      if (!card) {
        throw new NotFoundException(`Card with ID ${cardId} not found`);
      }

      return card;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get card by ID');
    }
  }

  async fetchAndStoreCardsForSet(setId: string, locale: string = 'en'): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);
      this.errorService.validateLocale(locale);

      // Fetch CardBriefs for the given locale
      const setRes = await firstValueFrom(this.httpService.get(this.configService.getSetUrl(locale, setId)));
      const cards = setRes.data.cards || [];
      const mergedCards: any[] = [];

      for (const card of cards) {
        // Fetch full card data
        const cardRes = await firstValueFrom(this.httpService.get(this.configService.getCardUrl(locale, card.id)));
        const cardData = cardRes.data;

        // Build card object (only for the requested language)
        const merged = {
          id: card.id,
          set_id: setId,
          local_id: card.localId,
          name_en: locale === 'en' ? cardData.name : '',
          name_es: locale === 'es' ? cardData.name : '',
          image_local_en: null,
          image_local_es: null,
          category: cardData.category,
          illustrator: cardData.illustrator,
          rarity: cardData.rarity,
          hp: cardData.hp ?? null,
          stage: cardData.stage,
          description_en: locale === 'en' ? cardData.description : '',
          description_es: locale === 'es' ? cardData.description : '',
          updated: cardData.updated,
          
          // New complex fields as JSON strings
          types: this.safeStringify(cardData.types),
          weaknesses: this.safeStringify(cardData.weaknesses),
          attacks: this.safeStringify(cardData.attacks),
          boosters: this.safeStringify(cardData.boosters),
          variants: this.safeStringify(cardData.variants),
          legal: this.safeStringify(cardData.legal),
          retreat: cardData.retreat ?? null,
        };

        // Download image
        const imageLocal = await this.downloadCardImage(cardData, card.id, setId, locale);
        if (locale === 'en') merged.image_local_en = imageLocal;
        if (locale === 'es') merged.image_local_es = imageLocal;

        mergedCards.push(merged);
        
        // Rate limit: wait 250ms between requests
        await new Promise(res => setTimeout(res, 250));
      }

      // Store in database
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and store cards for set');
    }
  }

  async fetchAndStoreCardsForSetBothLanguages(setId: string): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);

      // Fetch CardBriefs for EN and ES
      const [enSetRes, esSetRes] = await Promise.all([
        firstValueFrom(this.httpService.get(this.configService.getSetUrl('en', setId))),
        firstValueFrom(this.httpService.get(this.configService.getSetUrl('es', setId))),
      ]);

      const enCards = enSetRes.data.cards || [];
      const esCards = esSetRes.data.cards || [];

      // Merge CardBriefs by id
      const cardBriefMap = new Map<string, any>();
      
      enCards.forEach((card: any) => {
        cardBriefMap.set(card.id, {
          id: card.id,
          set_id: setId,
          local_id: card.localId,
          name_en: card.name,
          name_es: '',
          image: card.image,
        });
      });

      esCards.forEach((card: any) => {
        if (cardBriefMap.has(card.id)) {
          cardBriefMap.get(card.id).name_es = card.name;
        } else {
          cardBriefMap.set(card.id, {
            id: card.id,
            set_id: setId,
            local_id: card.localId,
            name_en: '',
            name_es: card.name,
            image: card.image,
          });
        }
      });

      const mergedBriefs = Array.from(cardBriefMap.values());

      // Fetch all existing cards for this set
      const existingCards = await this.tcgRepository.getCardsBySetId(setId);
      const existingCardsMap = new Map(existingCards.map(card => [card.id, card]));

      const mergedCards: any[] = [];

      for (const brief of mergedBriefs) {
        // Fetch EN and ES card data
        const [enCardRes, esCardRes] = await Promise.all([
          firstValueFrom(this.httpService.get(this.configService.getCardUrl('en', brief.id))),
          firstValueFrom(this.httpService.get(this.configService.getCardUrl('es', brief.id))),
        ]);

        const enCard = enCardRes.data;
        const esCard = esCardRes.data;

        // Merge card data
        const merged = {
          id: brief.id,
          set_id: setId,
          local_id: brief.local_id,
          name_en: enCard.name,
          name_es: esCard.name,
          image_local_en: null,
          image_local_es: null,
          category: enCard.category,
          illustrator: enCard.illustrator,
          rarity: enCard.rarity,
          hp: enCard.hp ?? null,
          stage: enCard.stage,
          description_en: enCard.description,
          description_es: esCard.description,
          updated: enCard.updated,
          
          // New complex fields as JSON strings
          types: this.safeStringify(enCard.types),
          weaknesses: this.safeStringify(enCard.weaknesses),
          attacks: this.safeStringify(enCard.attacks),
          boosters: this.safeStringify(enCard.boosters),
          variants: this.safeStringify(enCard.variants),
          legal: this.safeStringify(enCard.legal),
          retreat: enCard.retreat ?? null,
        };

        // Get existing card info
        const existingCard = existingCardsMap.get(merged.id);

        // Download images if not already present
        merged.image_local_en = await this.downloadCardImageIfNotExists(
          enCard, merged.id, setId, 'en', existingCard?.image_local_en
        );
        merged.image_local_es = await this.downloadCardImageIfNotExists(
          esCard, merged.id, setId, 'es', existingCard?.image_local_es
        );

        mergedCards.push(merged);
        
        // Rate limit: wait 250ms between requests
        await new Promise(res => setTimeout(res, 250));
      }

      // Store in database
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and store cards for set (both languages)');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  // Helper method to safely stringify JSON
  private safeStringify(data: any): string | null {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    if (typeof data === 'object' && Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }

  // Helper method to safely parse JSON
  private safeParse(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('[TCG] Failed to parse JSON:', jsonString);
      return null;
    }
  }

  private async downloadSetImages(sets: any[]): Promise<void> {
    for (const set of sets) {
      const setImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'sets', set.id);
      await fs.mkdir(setImgDir, { recursive: true });

      // Download logo
      if (set.logo) {
        try {
          const logoUrl = set.logo + '.webp';
          const logoFilename = path.join(setImgDir, 'logo.webp');
          const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(logoFilename, response.data);
          // Store path WITHOUT /public prefix
          set.logo_local = `/img/games/tcg/sets/${set.id}/logo.webp`;
        } catch (err) {
          console.warn(`[TCG] Failed to download logo for set ${set.id}:`, err);
          set.logo_local = null;
        }
      }

      // Download symbol
      if (set.symbol) {
        try {
          const symbolUrl = set.symbol + '.webp';
          const symbolFilename = path.join(setImgDir, 'symbol.webp');
          const response = await axios.get(symbolUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(symbolFilename, response.data);
          // Store path WITHOUT /public prefix
          set.symbol_local = `/img/games/tcg/sets/${set.id}/symbol.webp`;
        } catch (err) {
          console.warn(`[TCG] Failed to download symbol for set ${set.id}:`, err);
          set.symbol_local = null;
        }
      }
    }
  }

  private async downloadCardImage(cardData: any, cardId: string, setId: string, locale: string): Promise<string | null> {
    if (!cardData.image) return null;

    try {
      const cardImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'cards', setId);
      await fs.mkdir(cardImgDir, { recursive: true });

      const imageUrl = cardData.image + '/high.webp';
      const imageFilename = path.join(cardImgDir, `${cardId}_${locale}.webp`);
      
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(imageFilename, response.data);
      
      return `/img/games/tcg/cards/${setId}/${cardId}_${locale}.webp`;
    } catch (err) {
      console.warn(`[TCG] Failed to download ${locale} image for card ${cardId}:`, err);
      return null;
    }
  }

  private async downloadCardImageIfNotExists(
    cardData: any, 
    cardId: string, 
    setId: string, 
    locale: string, 
    existingImagePath?: string
  ): Promise<string | null> {
    // If image already exists in DB, return it
    if (existingImagePath) {
      console.log(`[TCG] ${locale.toUpperCase()} image for card ${cardId} already exists: ${existingImagePath}`);
      return existingImagePath;
    }

    // Download new image
    const imagePath = await this.downloadCardImage(cardData, cardId, setId, locale);
    if (imagePath) {
      console.log(`[TCG] ${locale.toUpperCase()} image downloaded for card ${cardId}: ${imagePath}`);
    }
    
    return imagePath;
  }
}