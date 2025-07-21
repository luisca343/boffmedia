import { Injectable } from '@nestjs/common';
import { TcgService } from './services/tcg.service';

@Injectable()
export class TcgFacadeService {
  constructor(private readonly tcgService: TcgService) {}

  async getAllSeries() {
    return this.tcgService.getAll();
  }

  async fetchAndStoreSeries() {
    return this.tcgService.fetchAndStoreSeries();
  }

  async fetchSetsForSeries(seriesId: string, locale: string = 'en') {
    return this.tcgService.fetchSetsForSeries(seriesId, locale);
  }

  async fetchSetsForSeriesBothLanguages(seriesId: string) {
    return this.tcgService.fetchSetsForSeriesBothLanguages(seriesId);
  }
}
