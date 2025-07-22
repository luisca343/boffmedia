import { Injectable } from '@nestjs/common';
import { TcgService } from './services/tcg.service';

@Injectable()
export class TcgFacadeService {
  constructor(private readonly tcgService: TcgService) {}
  async getSetsForSeriesFromDb(seriesId: string) {
    return this.tcgService.getSetsForSeriesFromDb(seriesId);
  }

  async getCardsForSetFromDb(setId: string) {
    return this.tcgService.getCardsForSetFromDb(setId);
  }

  async getCardById(cardId: string) {
    return this.tcgService.getCardById(cardId);
  }

  async fetchAndStoreCardsForSet(setId: string, locale: string = 'en') {
    return this.tcgService.fetchAndStoreCardsForSet(setId, locale);
  }

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

  async fetchAndStoreCardsForSetBothLanguages(setId: string) {
    return this.tcgService.fetchAndStoreCardsForSetBothLanguages(setId);
  }
}
