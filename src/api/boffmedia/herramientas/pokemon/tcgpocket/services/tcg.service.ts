import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ITcgRepository } from '../repositories/interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { tcgSets, tcgCards } from '@/_db/schema/TCG';

@Injectable()
export class TcgService {
  async getSetsForSeriesFromDb(seriesId: string): Promise<any[]> {
    return this.seriesRepository.getSetsBySeriesId(seriesId);
  }

  async getCardsForSetFromDb(setId: string): Promise<any[]> {
    // Query cards from DB by setId
    if (this.seriesRepository && 'db' in this.seriesRepository) {
      return this.seriesRepository.getCardsBySetId(setId);
    }
    return [];
  }
  async fetchAndStoreCardsForSet(setId: string, locale: string = 'en'): Promise<any[]> {
    // Fetch CardBriefs for the given locale
    const setRes = await firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/${locale}/sets/${setId}`));
    const cards = setRes.data.cards || [];
    const mergedCards: any[] = [];
    for (const card of cards) {
      // Fetch full card data
      const cardRes = await firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/${locale}/cards/${card.id}`));
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
      };
      const cardImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'cards', setId);
      await fs.mkdir(cardImgDir, { recursive: true });
      // Download image
      let imageLocal = null;
      if (cardData.image) {
        const imageUrl = cardData.image + '/high.webp';
        const imageFilename = path.join(cardImgDir, `${card.id}_${locale}.webp`);
        try {
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(imageFilename, response.data);
          imageLocal = `/public/img/games/tcg/cards/${setId}/${card.id}_${locale}.webp`;
        } catch (err) {
          imageLocal = null;
        }
      }
      if (locale === 'en') merged.image_local_en = imageLocal;
      if (locale === 'es') merged.image_local_es = imageLocal;
      mergedCards.push(merged);
      await new Promise(res => setTimeout(res, 250));
    }
    // Insert into DB, filter out existing IDs
    if (this.seriesRepository && 'db' in this.seriesRepository) {
      const db: any = (this.seriesRepository as any).db;
      const existing = await db.select({ id: tcgCards.id }).from(tcgCards);
      const existingIds = new Set(existing.map((c: any) => c.id));
      const newCards = mergedCards.filter((c: any) => !existingIds.has(c.id));
      if (newCards.length > 0) {
        const insertCards = newCards.map(card => ({
          id: card.id,
          set_id: card.set_id,
          local_id: card.local_id,
          name_en: card.name_en,
          name_es: card.name_es,
          image_local_en: card.image_local_en,
          image_local_es: card.image_local_es,
          category: card.category,
          illustrator: card.illustrator,
          rarity: card.rarity,
          hp: card.hp,
          stage: card.stage,
          description_en: card.description_en,
          description_es: card.description_es,
          updated: card.updated,
        }));
        await db.insert(tcgCards).values(insertCards);
      }
    }
    return mergedCards;
  }
  constructor(
    @Inject(TCGPOCKET_REPOSITORY_TOKEN)
    private readonly seriesRepository: ITcgRepository,
    private readonly httpService: HttpService,
  ) {}

  async getAll(): Promise<TcgSeriesDto[]> {
    return this.seriesRepository.findAll();
  }

  async saveSeries(series: TcgSeriesDto[]): Promise<void> {
    const formattedSeries = series.map(s => ({
      id: s.id,
      name_en: s.name_en,
      name_es: s.name_es,
      logo: s.logo ?? '',
    }));
    await this.seriesRepository.insertSeries(formattedSeries);
  }

  async fetchAndStoreSeries(): Promise<{ success: boolean; count: number }> {
    // Fetch EN and ES series
    const [enRes, esRes] = await Promise.all([
      firstValueFrom(this.httpService.get('https://api.tcgdex.net/v2/en/series')),
      firstValueFrom(this.httpService.get('https://api.tcgdex.net/v2/es/series')),
    ]);
    const en = enRes.data;
    const es = esRes.data;
    // Merge by id
    const seriesMap = new Map<string, TcgSeriesDto>();
    en.forEach((s: any) => {
      seriesMap.set(s.id, {
        id: s.id,
        name_en: s.name,
        name_es: '',
        logo: s.logo || '',
      });
    });
    es.forEach((s: any) => {
      if (seriesMap.has(s.id)) {
        seriesMap.get(s.id)!.name_es = s.name;
      } else {
        seriesMap.set(s.id, {
          id: s.id,
          name_en: '',
          name_es: s.name,
          logo: s.logo || '',
        });
      }
    });
    const mergedSeries = Array.from(seriesMap.values());
    await this.saveSeries(mergedSeries);
    return { success: true, count: mergedSeries.length };
  }

  async fetchSetsForSeries(seriesId: string, locale: string = 'en'): Promise<any[]> {
    const url = `https://api.tcgdex.net/v2/${locale}/series/${seriesId}`;
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
  }

  async fetchSetsForSeriesBothLanguages(seriesId: string): Promise<any[]> {
    // Fetch EN and ES sets in parallel
    const [enRes, esRes] = await Promise.all([
      firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/en/series/${seriesId}`)),
      firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/es/series/${seriesId}`)),
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
    const mergedSets = Array.from(setMap.values());

    // Download images locally
    for (const set of mergedSets) {
      const setImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'sets', set.id);
      await fs.mkdir(setImgDir, { recursive: true });
      // Download logo
      if (set.logo) {
        const logoUrl = set.logo + '.webp';
        const logoFilename = path.join(setImgDir, `logo.webp`);
        try {
          const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(logoFilename, response.data);
          set.logo_local = `/public/img/games/tcg/sets/${set.id}/logo.webp`;
        } catch (err) {
          set.logo_local = null;
        }
      }
      // Download symbol
      if (set.symbol) {
        const symbolUrl = set.symbol + '.webp';
        const symbolFilename = path.join(setImgDir, `symbol.webp`);
        try {
          const response = await axios.get(symbolUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(symbolFilename, response.data);
          set.symbol_local = `/public/img/games/tcg/sets/${set.id}/symbol.webp`;
        } catch (err) {
          set.symbol_local = null;
        }
      }
    }

    // Insert into DB, filter out existing IDs
    if (this.seriesRepository && 'db' in this.seriesRepository) {
      const db: any = (this.seriesRepository as any).db;
      const existing = await db.select({ id: tcgSets.id }).from(tcgSets);
      const existingIds = new Set(existing.map((s: any) => s.id));
      const newSets = mergedSets.filter((s: any) => !existingIds.has(s.id));
      if (newSets.length > 0) {
        await db.insert(tcgSets).values(newSets);
      }
    }
    return mergedSets;
  }

  async fetchAndStoreCardsForSetBothLanguages(setId: string): Promise<any[]> {
    // Fetch CardBriefs for EN and ES
    const [enSetRes, esSetRes] = await Promise.all([
      firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/en/sets/${setId}`)),
      firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/es/sets/${setId}`)),
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

    // Fetch all existing cards for this set in one query using repository
    let existingCardsMap: Map<string, any> = new Map();
    const foundCards = await this.seriesRepository.getCardsBySetId(setId);
    for (const card of foundCards) {
      existingCardsMap.set(card.id, card);
    }

    const mergedCards: any[] = [];
    for (const brief of mergedBriefs) {
      // Fetch EN and ES card data
      const [enCardRes, esCardRes] = await Promise.all([
        firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/en/cards/${brief.id}`)),
        firstValueFrom(this.httpService.get(`https://api.tcgdex.net/v2/es/cards/${brief.id}`)),
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
      };
      const cardImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'cards', merged.set_id);
      await fs.mkdir(cardImgDir, { recursive: true });

      // Lookup existing card info from map
      const existingCard = existingCardsMap.get(merged.id);

      // Download EN image if not already present in DB
      let enImageLocal = existingCard?.image_local_en || null;
      if (!enImageLocal && enCard.image) {
        const enImageUrl = enCard.image + '/high.webp';
        const enImageFilename = path.join(cardImgDir, `${merged.id}_en.webp`);
        console.log(`[TCG] Downloading EN image for card ${merged.id} from ${enImageUrl}`);
        try {
          const response = await axios.get(enImageUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(enImageFilename, response.data);
          enImageLocal = `/public/img/games/tcg/cards/${merged.set_id}/${merged.id}_en.webp`;
          console.log(`[TCG] EN image saved: ${enImageLocal}`);
        } catch (err) {
          console.warn(`[TCG] Failed to download EN image for card ${merged.id}: ${err}`);
          enImageLocal = null;
        }
      } else if (enImageLocal) {
        console.log(`[TCG] EN image for card ${merged.id} already exists in DB: ${enImageLocal}`);
      }
      merged.image_local_en = enImageLocal;

      // Download ES image if not already present in DB
      let esImageLocal = existingCard?.image_local_es || null;
      if (!esImageLocal && esCard.image) {
        const esImageUrl = esCard.image + '/high.webp';
        const esImageFilename = path.join(cardImgDir, `${merged.id}_es.webp`);
        console.log(`[TCG] Downloading ES image for card ${merged.id} from ${esImageUrl}`);
        try {
          const response = await axios.get(esImageUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(esImageFilename, response.data);
          esImageLocal = `/public/img/games/tcg/cards/${merged.set_id}/${merged.id}_es.webp`;
          console.log(`[TCG] ES image saved: ${esImageLocal}`);
        } catch (err) {
          console.warn(`[TCG] Failed to download ES image for card ${merged.id}: ${err}`);
          esImageLocal = null;
        }
      } else if (esImageLocal) {
        console.log(`[TCG] ES image for card ${merged.id} already exists in DB: ${esImageLocal}`);
      }
      merged.image_local_es = esImageLocal;

      mergedCards.push(merged);
      // Rate limit: wait 250ms between requests
      await new Promise(res => setTimeout(res, 250));
    }

    // Insert into DB, filter out existing IDs
    if (this.seriesRepository && 'db' in this.seriesRepository) {
      const db: any = (this.seriesRepository as any).db;
      const existing = await db.select({ id: tcgCards.id }).from(tcgCards);
      const existingIds = new Set(existing.map((c: any) => c.id));
      const newCards = mergedCards.filter((c: any) => !existingIds.has(c.id));
      if (newCards.length > 0) {
        // Only insert fields that exist in the DB schema
        const insertCards = newCards.map(card => ({
          id: card.id,
          set_id: card.set_id,
          local_id: card.local_id,
          name_en: card.name_en,
          name_es: card.name_es,
          image_local_en: card.image_local_en,
          image_local_es: card.image_local_es,
          category: card.category,
          illustrator: card.illustrator,
          rarity: card.rarity,
          hp: card.hp,
          stage: card.stage,
          description_en: card.description_en,
          description_es: card.description_es,
          updated: card.updated,
        }));
        await db.insert(tcgCards).values(insertCards);
      }
    }
    return mergedCards;
  }
}
