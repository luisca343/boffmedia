import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { TcgErrorService } from './tcg-error.service';
import { TcgConfigService } from './tcg-config.service';

@Injectable()
export class TcgFetchService {
  constructor(
    private readonly httpService: HttpService,
    private readonly errorService: TcgErrorService,
    private readonly configService: TcgConfigService,
  ) {}

  // ==================== SERIES FETCHING ====================

  async fetchAndMergeSeries(): Promise<TcgSeriesDto[]> {
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

      return Array.from(seriesMap.values());
    } catch (error) {
      this.errorService.handleApiError(error, 'Fetch and merge series');
    }
  }

  // ==================== SETS FETCHING ====================

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

  async fetchAndMergeSetsForSeries(seriesId: string): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);

      // Fetch EN and ES sets in parallel
      const [enRes, esRes] = await Promise.all([
        firstValueFrom(this.httpService.get(this.configService.getSeriesDetailUrl('en', seriesId))),
        firstValueFrom(this.httpService.get(this.configService.getSeriesDetailUrl('es', seriesId))),
      ]);

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

      return Array.from(setMap.values());
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and merge sets for series');
    }
  }

  // ==================== CARDS FETCHING ====================

  async fetchCardsForSet(setId: string, locale: string = 'en'): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);
      this.errorService.validateLocale(locale);

      // Fetch CardBriefs for the given locale
      const setRes = await firstValueFrom(this.httpService.get(this.configService.getSetUrl(locale, setId)));
      const cards = setRes.data.cards || [];
      const mergedCards: any[] = [];

      for (const card of cards) {
        console.log(`Fetching card ${card.id} for set ${setId} in locale ${locale}`);
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
          updated: cardData.updated ? new Date(cardData.updated) : null,
          
          // New complex fields as JSON strings
          types: this.safeStringify(cardData.types),
          weaknesses: this.safeStringify(cardData.weaknesses),
          attacks: this.safeStringify(cardData.attacks),
          boosters: this.safeStringify(cardData.boosters),
          variants: this.safeStringify(cardData.variants),
          legal: this.safeStringify(cardData.legal),
          retreat: cardData.retreat ?? null,
        };

        mergedCards.push(merged);
        
        // Rate limit: wait 250ms between requests
        await new Promise(res => setTimeout(res, 250));
      }

      return mergedCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch cards for set');
    }
  }

  async fetchAndMergeCardsForSet(setId: string): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);

      // Fetch EN first (always available)
      const enSetRes = await firstValueFrom(this.httpService.get(this.configService.getSetUrl('en', setId)));
      const enCards = enSetRes.data.cards || [];

      // Try to fetch ES, but handle gracefully if it doesn't exist
      let esCards = [];
      try {
        const esSetRes = await firstValueFrom(this.httpService.get(this.configService.getSetUrl('es', setId)));
        esCards = esSetRes.data.cards || [];
        console.log(`[TCG] Successfully fetched ES cards for set ${setId}`);
      } catch (esError) {
        if (esError.response?.status === 404) {
          console.warn(`[TCG] ES locale not available for set ${setId}, proceeding with EN only`);
          esCards = [];
        } else {
          // Re-throw if it's not a 404 error
          throw esError;
        }
      }

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
      const mergedCards: any[] = [];

      console.log(`[TCG] Starting detailed card fetching for ${mergedBriefs.length} cards in set ${setId}`);

      for (let i = 0; i < mergedBriefs.length; i++) {
        const brief = mergedBriefs[i];
        console.log(`[TCG] Fetching detailed data for card ${i + 1}/${mergedBriefs.length}: ${brief.id} in set ${setId}`);
        
        // Fetch EN card data (always available)
        const enCardRes = await firstValueFrom(this.httpService.get(this.configService.getCardUrl('en', brief.id)));
        const enCard = enCardRes.data;

        // Try to fetch ES card data, but handle gracefully if it doesn't exist
        let esCard = null;
        try {
          const esCardRes = await firstValueFrom(this.httpService.get(this.configService.getCardUrl('es', brief.id)));
          esCard = esCardRes.data;
        } catch (esCardError) {
          if (esCardError.response?.status === 404) {
            console.warn(`[TCG] ES version not available for card ${brief.id}, using EN description`);
            esCard = enCard; // Use EN data as fallback
          } else {
            // For other errors, still use EN as fallback but log the error
            console.warn(`[TCG] Error fetching ES version for card ${brief.id}:`, esCardError.message);
            esCard = enCard;
          }
        }

        // Download images immediately after fetching card data
        console.log(`[TCG] Downloading images for card ${brief.id}...`);
        const [imageLocalEn, imageLocalEs] = await Promise.all([
          this.downloadCardImage({ image: brief.image }, brief.id, setId, 'en'),
          this.downloadCardImage({ image: brief.image }, brief.id, setId, 'es')
        ]);

        // Merge card data with local image paths
        const merged = {
          id: brief.id,
          set_id: setId,
          local_id: brief.local_id,
          name_en: brief.name_en || enCard.name,
          name_es: brief.name_es || (esCard ? esCard.name : enCard.name),
          image_local_en: imageLocalEn,
          image_local_es: imageLocalEs,
          category: enCard.category,
          illustrator: enCard.illustrator,
          rarity: enCard.rarity,
          hp: enCard.hp ?? null,
          stage: enCard.stage,
          description_en: enCard.description,
          description_es: esCard ? esCard.description : enCard.description,
          updated: enCard.updated ? new Date(enCard.updated) : null,
          
          // New complex fields as JSON strings
          types: this.safeStringify(enCard.types),
          weaknesses: this.safeStringify(enCard.weaknesses),
          attacks: this.safeStringify(enCard.attacks),
          boosters: this.safeStringify(enCard.boosters),
          variants: this.safeStringify(enCard.variants),
          legal: this.safeStringify(enCard.legal),
          retreat: enCard.retreat ?? null,
        };

        mergedCards.push(merged);
        
        // Rate limit: wait 250ms between requests
        await new Promise(res => setTimeout(res, 250));
      }

      console.log(`[TCG] Completed detailed card fetching for set ${setId}`);
      return mergedCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and merge cards for set');
    }
  }

  // Add this helper method to the TcgFetchService class
  private async downloadCardImage(cardData: any, cardId: string, setId: string, locale: string): Promise<string | null> {
    if (!cardData.image) return null;

    try {
      console.log(`[TCG] Downloading ${locale.toUpperCase()} image for card ${cardId}...`);
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

  // ==================== PRIVATE HELPER METHODS ====================

  private safeStringify(data: any): string | null {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    if (typeof data === 'object' && Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }
}