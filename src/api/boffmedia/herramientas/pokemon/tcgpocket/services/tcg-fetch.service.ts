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

        mergedCards.push(merged);
        
        // Rate limit: wait 250ms between requests
        await new Promise(res => setTimeout(res, 250));
      }

      return mergedCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and merge cards for set');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private safeStringify(data: any): string | null {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    if (typeof data === 'object' && Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }
}