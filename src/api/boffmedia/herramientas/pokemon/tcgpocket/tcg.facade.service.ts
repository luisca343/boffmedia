import { Injectable } from '@nestjs/common';
import { TcgService } from './services/tcg.service';
import { AddUserCardDto, UpdateUserCardQuantityDto } from './dto/user-card.dto';

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
    return await this.tcgService.fetchAndStoreCardsForSet(setId, locale);
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
    return await this.tcgService.fetchAndStoreCardsForSetBothLanguages(setId);
  }
  async getUserCards(userName: string) {
    return this.tcgService.getUserCards(userName);
  }

  async addUserCard(addUserCardDto: AddUserCardDto) {
    return this.tcgService.addUserCard(addUserCardDto);
  }

  async updateUserCardQuantity(userId: string, cardId: string, updateDto: UpdateUserCardQuantityDto) {
    return this.tcgService.updateUserCardQuantity(userId, cardId, updateDto);
  }

  async removeUserCard(userId: string, cardId: string) {
    return this.tcgService.removeUserCard(userId, cardId);
  }

  async getUserCardHistory(userId: string) {
    return this.tcgService.getUserCardHistory(userId);
  }

  async migrateOldUserCards() {
    return await this.tcgService.migrateOldUserCards();
  }
}