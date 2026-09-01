import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ITcgRepository } from '../repositories/interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { TcgErrorService } from './tcg-error.service';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';
import {
  AddUserCardDto,
  UpdateUserCardQuantityDto,
} from '../dto/user-card.dto';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { BoffMediaUsersManagementService } from '@api/boffmedia/users/services/users-management.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TcgService {
  constructor(
    private readonly logger: Logger,

    @Inject(TCGPOCKET_REPOSITORY_TOKEN)
    private readonly tcgRepository: ITcgRepository,
    private readonly errorService: TcgErrorService,
    private readonly fetchService: TcgFetchService,
    private readonly imageService: TcgImageService,
    private readonly usersService: BoffMediaUsersManagementService,
  ) {}

  // ==================== SERIES OPERATIONS ====================

  async getAll(): Promise<TcgSeriesDto[]> {
    try {
      return await this.tcgRepository.findAll();
    } catch (error: any) {
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
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
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

      const formattedSeries = series.map((s) => ({
        id: s.id,
        name_en: s.name_en,
        name_es: s.name_es,
        logo: s.logo || null,
      }));

      await this.tcgRepository.insertSeries(formattedSeries as any);
    } catch (error: any) {
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
    } catch (error: any) {
      this.errorService.handleApiError(error, 'Fetch and store series');
    }
  }

  // ==================== SETS OPERATIONS ====================

  async getSetsForSeriesFromDb(seriesId: string): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);
      return await this.tcgRepository.getSetsBySeriesId(seriesId);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(
        error,
        'Get sets for series from database',
      );
    }
  }

  async fetchSetsForSeries(
    seriesId: string,
    locale: string = 'en',
  ): Promise<any[]> {
    try {
      return await this.fetchService.fetchSetsForSeries(seriesId, locale);
    } catch (error: any) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  async fetchSetsForSeriesBothLanguages(seriesId: string): Promise<any[]> {
    try {
      const mergedSets =
        await this.fetchService.fetchAndMergeSetsForSeries(seriesId);

      // Download images locally
      await this.imageService.downloadSetImages(mergedSets);

      // Store in database
      await this.tcgRepository.insertSets(mergedSets);

      return mergedSets;
    } catch (error: any) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  // ==================== CARDS OPERATIONS ====================

  async getCardsForSetFromDb(setId: string): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);
      return await this.tcgRepository.getCardsBySetId(setId);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(
        error,
        'Get cards for set from database',
      );
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
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get card by ID');
    }
  }

  async fetchAndStoreCardsForSet(
    setId: string,
    locale: string = 'en',
  ): Promise<any[]> {
    try {
      const mergedCards = await this.fetchService.fetchCardsForSet(
        setId,
        locale,
      );

      // Download images for cards
      await this.imageService.downloadImagesForCards(mergedCards, setId);

      // Store in database
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error: any) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  async fetchAndStoreCardsForSetBothLanguages(setId: string): Promise<any[]> {
    try {
      // Fetch all existing cards for this set
      const existingCards = await this.tcgRepository.getCardsBySetId(setId);
      const _existingCardsMap = new Map(
        existingCards.map((card) => [card.id, card]),
      );

      this.logger.log(`[TCG] Fetching cards for set ${setId}...`);
      const mergedCards =
        await this.fetchService.fetchAndMergeCardsForSet(setId);

      this.logger.log(
        `[TCG] Storing ${mergedCards.length} cards for set ${setId}...`,
      );
      // Store in database (images are already downloaded and URLs are set)
      await this.tcgRepository.insertCards(mergedCards);

      return mergedCards;
    } catch (error: any) {
      throw error; // Re-throw as fetchService already handles the error
    }
  }

  // ==================== USER CARDS OPERATIONS ====================

  /**
   * A player's collection, addressed by numeric id OR by username.
   *
   * The route param is called `userName`, but every sibling route on the
   * controller (`PUT`/`DELETE /users/:userId/cards/...`) takes an id, and the
   * ported tool sends an id here too. This used to do
   * `(await getUserByUsername(id))!.id` — for an id that lookup returns
   * undefined and the `!` turned it into a TypeError, surfaced to the app as a
   * 500 "Database operation failed". Accept both, and answer 404 when the user
   * genuinely is not there.
   */
  async getUserCards(userIdOrName: string): Promise<any[]> {
    try {
      const identifier = userIdOrName?.trim();
      if (!identifier) {
        throw new BadRequestException('A user id or username is required');
      }

      const userId = /^\d+$/.test(identifier)
        ? Number(identifier)
        : (await this.usersService.getUserByUsername(identifier))?.id;

      if (!userId) {
        throw new NotFoundException(`User ${identifier} not found`);
      }

      const tcgUserCards = await this.tcgRepository.getUserCards(userId);

      // Enrich with card details
      /*
      const enrichedCards = [];
      for (const userCard of tcgUserCards) {
        try {
          const cardDetails = await this.tcgRepository.findCardById(userCard.card_id);
          enrichedCards.push({
            ...userCard,
            setId: cardDetails ? cardDetails.setId : 'unknown',
            cardName: cardDetails ? (cardDetails.name_en || cardDetails.name_es) : 'Unknown Card',
            cardImage: cardDetails ? (cardDetails.image_en || cardDetails.image_es) : null,
          });
        } catch (error: any) {
          // If card details fail, still include the user card with basic info
          enrichedCards.push({
            ...userCard,
            setId: 'unknown',
            cardName: 'Unknown Card',
            cardImage: null,
          });
        }
      }*/

      return tcgUserCards;
    } catch (error: any) {
      // A missing user is a 404, not a database failure.
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Get user cards');
    }
  }

  async addUserCard(
    addUserCardDto: AddUserCardDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, cardId, quantity } = addUserCardDto;

      // Validate card exists
      const cardExists = await this.tcgRepository.checkIfCardExists(cardId);
      if (!cardExists) {
        throw new BadRequestException(`Card with ID ${cardId} does not exist`);
      }

      // Check if user already has this card
      const existingUserCard = await this.tcgRepository.getUserCard(
        userId,
        cardId,
      );

      if (existingUserCard) {
        // Update existing quantity
        const newQuantity = existingUserCard.quantity + quantity;
        await this.tcgRepository.updateUserCardQuantity(
          userId,
          cardId,
          newQuantity,
        );
      } else {
        // Add new card
        await this.tcgRepository.addUserCard(userId, cardId, quantity);
      }

      // Add to history
      await this.tcgRepository.addUserCardHistory(userId, cardId, quantity);

      return {
        success: true,
        message: `Added ${quantity} of card ${cardId} to user ${userId}`,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Add user card');
    }
  }

  async updateUserCardQuantity(
    userId: number,
    cardId: string,
    updateDto: UpdateUserCardQuantityDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!cardId || cardId.trim().length === 0) {
        throw new BadRequestException('Card ID is required');
      }

      const existingUserCard = await this.tcgRepository.getUserCard(
        userId,
        cardId,
      );

      // An UPSERT, which is what PUT means: make the resource be this. It used
      // to 404 when the row was absent, and that is unusable for the desktop
      // app's offline queue — a player who adds a card on a train sends the
      // write when they reconnect, by which time "did the row exist when they
      // clicked" is not a question anyone can answer. Replaying the intent
      // ("this card's quantity is 4") always can be.
      //
      // The same property makes a repeat harmless: the queue is at-least-once
      // (see tool_db.rs), so the second delivery of the same PUT has to land on
      // the same state rather than double the count the way POST does.
      const current = existingUserCard?.quantity ?? 0;
      const quantityChange = updateDto.quantity - current;

      if (updateDto.quantity === 0) {
        // Already absent is already the requested state — a no-op, not a 404,
        // so a replayed removal succeeds instead of wedging the queue.
        if (existingUserCard) {
          await this.tcgRepository.removeUserCard(userId, cardId);
        }
      } else if (existingUserCard) {
        await this.tcgRepository.updateUserCardQuantity(
          userId,
          cardId,
          updateDto.quantity,
        );
      } else {
        // Creating, so the card itself has to be real — `addUserCard` checks
        // this on its own path and the check belongs on every path that can
        // insert, or a typo'd id becomes a row nothing can render.
        const cardExists = await this.tcgRepository.checkIfCardExists(cardId);
        if (!cardExists) {
          throw new BadRequestException(`Card with ID ${cardId} does not exist`);
        }
        await this.tcgRepository.addUserCard(userId, cardId, updateDto.quantity);
      }

      // Add to history if there was a change
      if (quantityChange !== 0) {
        await this.tcgRepository.addUserCardHistory(
          userId,
          cardId,
          quantityChange,
        );
      }

      return {
        success: true,
        message: `Updated card ${cardId} quantity to ${updateDto.quantity} for user ${userId}`,
      };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.errorService.handleDatabaseError(error, 'Update user card quantity');
    }
  }

  async removeUserCard(
    userId: number,
    cardId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!cardId || cardId.trim().length === 0) {
        throw new BadRequestException('Card ID is required');
      }

      const existingUserCard = await this.tcgRepository.getUserCard(
        userId,
        cardId,
      );
      if (!existingUserCard) {
        throw new NotFoundException(
          `User ${userId} does not own card ${cardId}`,
        );
      }

      await this.tcgRepository.removeUserCard(userId, cardId);

      // Add to history (negative of current quantity)
      await this.tcgRepository.addUserCardHistory(
        userId,
        cardId,
        -existingUserCard.quantity,
      );

      return {
        success: true,
        message: `Removed card ${cardId} from user ${userId}`,
      };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
          const cardDetails = await this.tcgRepository.findCardById(
            historyEntry.cardId,
          );
          enrichedHistory.push({
            ...historyEntry,
            setId: cardDetails ? cardDetails.setId : 'unknown',
            cardName: cardDetails
              ? cardDetails.name_en || cardDetails.name_es
              : 'Unknown Card',
          });
        } catch (_error: any) {
          enrichedHistory.push({
            ...historyEntry,
            setId: 'unknown',
            cardName: 'Unknown Card',
          });
        }
      }

      return enrichedHistory;
    } catch (error: any) {
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
      const filePath = path.join(process.cwd(), 'data/tcgpocket/cartas.json');
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
        this.logger.log(
          `Inserting user card: ${userCard.user_id} - ${userCard.card_id} (${userCard.quantity})`,
        );
        await this.tcgRepository.addUserCard(
          userCard.user_id,
          userCard.card_id,
          userCard.quantity,
        );
      }

      return { success: true, inserted: newUserCards.length };
    } catch (error: any) {
      this.errorService.handleDatabaseError(error, 'Migrate old user cards');
    }
  }
}
