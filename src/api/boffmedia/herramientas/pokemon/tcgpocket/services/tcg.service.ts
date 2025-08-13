import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ITcgRepository } from '../repositories/interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { TcgErrorService } from './tcg-error.service';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';
import { AddUserCardDto, UpdateUserCardQuantityDto } from '../dto/user-card.dto';
import { UserCard, UserCardHistory } from '@/_db/schema/TCG';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import { BoffMediaUsersManagementService } from '@api/boffmedia/users/services/users-management.service';

@Injectable()
export class TcgService {
  constructor(
    @Inject(TCGPOCKET_REPOSITORY_TOKEN)
    private readonly tcgRepository: ITcgRepository,
    private readonly errorService: TcgErrorService,
    private readonly fetchService: TcgFetchService,
    private readonly imageService: TcgImageService,
    private readonly usersService: BoffMediaUsersManagementService
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
      const mergedSeries = await this.fetchService.fetchAndMergeSeries();
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
      return await this.fetchService.fetchSetsForSeries(seriesId, locale);
    } catch (error) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  async fetchSetsForSeriesBothLanguages(seriesId: string): Promise<any[]> {
    try {
      const mergedSets = await this.fetchService.fetchAndMergeSetsForSeries(seriesId);

      // Download images locally
      await this.imageService.downloadSetImages(mergedSets);

      // Store in database
      await this.tcgRepository.insertSets(mergedSets);

      return mergedSets;
    } catch (error) {
      throw error; // Re-throw as fetchService already handles the error
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
      const mergedCards = await this.fetchService.fetchCardsForSet(setId, locale);

      // Download images for cards
      await this.imageService.downloadImagesForCards(mergedCards, setId);

      // Store in database
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  async fetchAndStoreCardsForSetBothLanguages(setId: string): Promise<any[]> {
    try {
      // Fetch all existing cards for this set
      const existingCards = await this.tcgRepository.getCardsBySetId(setId);
      const existingCardsMap = new Map(existingCards.map(card => [card.id, card]));

      console.log(`[TCG] Fetching cards for set ${setId}...`);
      const mergedCards = await this.fetchService.fetchAndMergeCardsForSet(setId);

      console.log(`[TCG] Storing ${mergedCards.length} cards for set ${setId}...`);
      // Store in database (images are already downloaded and URLs are set)
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  // ==================== USER CARDS OPERATIONS ====================

  async getUserCards(userName: string): Promise<any[]> {
    try {
      if (!userName || userName.trim().length === 0) {
        throw new BadRequestException('User Name is required');
      }
      
      const userId = await (await this.usersService.getUserByUsername(userName)).id;

      const userCards = await this.tcgRepository.getUserCards(userId);
      
      // Enrich with card details
      /*
      const enrichedCards = [];
      for (const userCard of userCards) {
        try {
          const cardDetails = await this.tcgRepository.findCardById(userCard.card_id);
          enrichedCards.push({
            ...userCard,
            setId: cardDetails ? cardDetails.setId : 'unknown',
            cardName: cardDetails ? (cardDetails.name_en || cardDetails.name_es) : 'Unknown Card',
            cardImage: cardDetails ? (cardDetails.image_en || cardDetails.image_es) : null,
          });
        } catch (error) {
          // If card details fail, still include the user card with basic info
          enrichedCards.push({
            ...userCard,
            setId: 'unknown',
            cardName: 'Unknown Card',
            cardImage: null,
          });
        }
      }*/

      return userCards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get user cards');
    }
  }

  async addUserCard(addUserCardDto: AddUserCardDto): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, cardId, quantity } = addUserCardDto;

      // Validate card exists
      const cardExists = await this.tcgRepository.checkIfCardExists(cardId);
      if (!cardExists) {
        throw new BadRequestException(`Card with ID ${cardId} does not exist`);
      }

      // Check if user already has this card
      const existingUserCard = await this.tcgRepository.getUserCard(userId, cardId);
      
      if (existingUserCard) {
        // Update existing quantity
        const newQuantity = existingUserCard.quantity + quantity;
        await this.tcgRepository.updateUserCardQuantity(userId, cardId, newQuantity);
      } else {
        // Add new card
        await this.tcgRepository.addUserCard(userId, cardId, quantity);
      }

      // Add to history
      await this.tcgRepository.addUserCardHistory(userId, cardId, quantity);

      return { 
        success: true, 
        message: `Added ${quantity} of card ${cardId} to user ${userId}` 
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Add user card');
    }
  }

  async updateUserCardQuantity(userId: number, cardId: string, updateDto: UpdateUserCardQuantityDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!cardId || cardId.trim().length === 0) {
        throw new BadRequestException('Card ID is required');
      }

      const existingUserCard = await this.tcgRepository.getUserCard(userId, cardId);
      if (!existingUserCard) {
        throw new NotFoundException(`User ${userId} does not own card ${cardId}`);
      }

      const quantityChange = updateDto.quantity - existingUserCard.quantity;
      
      if (updateDto.quantity === 0) {
        // Remove card entirely
        await this.tcgRepository.removeUserCard(userId, cardId);
      } else {
        // Update quantity
        await this.tcgRepository.updateUserCardQuantity(userId, cardId, updateDto.quantity);
      }

      // Add to history if there was a change
      if (quantityChange !== 0) {
        await this.tcgRepository.addUserCardHistory(userId, cardId, quantityChange);
      }

      return { 
        success: true, 
        message: `Updated card ${cardId} quantity to ${updateDto.quantity} for user ${userId}` 
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Update user card quantity');
    }
  }

  async removeUserCard(userId: number, cardId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!cardId || cardId.trim().length === 0) {
        throw new BadRequestException('Card ID is required');
      }

      const existingUserCard = await this.tcgRepository.getUserCard(userId, cardId);
      if (!existingUserCard) {
        throw new NotFoundException(`User ${userId} does not own card ${cardId}`);
      }

      await this.tcgRepository.removeUserCard(userId, cardId);

      // Add to history (negative of current quantity)
      await this.tcgRepository.addUserCardHistory(userId, cardId, -existingUserCard.quantity);

      return { 
        success: true, 
        message: `Removed card ${cardId} from user ${userId}` 
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Remove user card');
    }
  }

  async getUserCardHistory(userId: number): Promise<any[]> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const history = await this.tcgRepository.getUserCardHistory(userId);
      
      // Enrich with card details
      const enrichedHistory = [];
      for (const historyEntry of history) {
        try {
          const cardDetails = await this.tcgRepository.findCardById(historyEntry.card_id);
          enrichedHistory.push({
            ...historyEntry,
            setId: cardDetails ? cardDetails.setId : 'unknown',
            cardName: cardDetails ? (cardDetails.name_en || cardDetails.name_es) : 'Unknown Card',
          });
        } catch (error) {
          enrichedHistory.push({
            ...historyEntry,
            setId: 'unknown',
            cardName: 'Unknown Card',
          });
        }
      }

      return enrichedHistory;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get user card history');
    }
  }

  oldExpansionToSetIdMap: Record<string, string> = {
    geneticapex: 'A1',      
    mythicalisland: 'A1a',     
    'space-timesmackdown': 'A2',  
    triumphantlight: 'A2a',
    shiningrevelry: 'A2b',
    celestialguardians: 'A3', 
    extradimensionalcrisis: 'A3a', 
    eeveegrove: 'A3b',             
    'promo-a': 'P-A',
  };

  // ==================== MIGRATION ====================
    async migrateOldUserCards() {
      try {
        const filePath = path.join(process.cwd(), 'public/CARTAS.json');
        const data = await fsPromises.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        const newUserCards = jsonData.map((card: any) => {
          const setId = this.oldExpansionToSetIdMap[card.expansion] || 'unknown';
          const cardNumber = card.card_number.toString().padStart(3, '0');
          const card_id = `${setId}-${cardNumber}`;
          return {
            user_id: card.user_id,
            card_id,
            quantity: card.count,
          };
        });

        // Insert each card into the database
        for (const userCard of newUserCards) {
          console.log(`Inserting user card: ${userCard.user_id} - ${userCard.card_id} (${userCard.quantity})`);
          await this.tcgRepository.addUserCard(userCard.user_id, userCard.card_id, userCard.quantity);
        }

        return { success: true, inserted: newUserCards.length };
      } catch (error) {
        this.errorService.handleDatabaseError(error, 'Migrate old user cards');
      }
    }

}