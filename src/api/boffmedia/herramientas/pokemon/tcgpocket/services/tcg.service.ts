import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ITcgRepository } from '../repositories/interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { tcgSets } from '@/_db/schema/Tcg';

@Injectable()
export class TcgService {
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
}
