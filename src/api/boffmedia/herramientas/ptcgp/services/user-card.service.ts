import { Injectable } from '@nestjs/common';
import { PtcgpRepository } from '@api/_repositories/ptcgp.repository';

export interface CardUpdate {
  expansion: string;
  cardNumber: number;
  packId: string;
  change: number;
}

@Injectable()
export class UserCardService {
  constructor(
    private readonly ptcgpRepository: PtcgpRepository,
  ) {}

  async getUserCards(username: string) {
    if (!username) {
      throw new Error('Username is required');
    }

    return this.ptcgpRepository.findUserCards(username);
  }

  async batchUpdateUserCards(username: string, cardUpdates: CardUpdate[]) {
    if (!username || !cardUpdates || cardUpdates.length === 0) {
      throw new Error('Username and card updates are required');
    }

    return this.ptcgpRepository.executeTransaction(async (tx) => {
      const user = await this.ptcgpRepository.findUserByUsername(username);
      
      if (!user) {
        throw new Error('User not found');
      }

      const userId = user.id;
      const results = [];

      for (const update of cardUpdates) {
        const { expansion, cardNumber, change } = update;

        // Validate the update
        if (!expansion || !cardNumber || change === undefined) {
          throw new Error('Invalid card update: expansion, cardNumber, and change are required');
        }

        const existingCard = await this.ptcgpRepository.findUserCard(userId, expansion, cardNumber);

        if (existingCard) {
          const newCount = Math.max(0, (existingCard.count || 0) + change);
          
          if (newCount === 0) {
            // Delete the card if count reaches 0
            await this.ptcgpRepository.deleteUserCard(userId, expansion, cardNumber);
          } else {
            // Update the card count
            await this.ptcgpRepository.updateUserCard(userId, expansion, cardNumber, {
              count: newCount
            });
          }

          // Record in history
          await this.ptcgpRepository.createCardHistory({
            user_id: userId,
            expansion,
            card_number: cardNumber,
            count: newCount
          });

          results.push({
            expansion,
            cardNumber,
            oldCount: existingCard.count || 0,
            newCount,
            change
          });
        } else if (change > 0) {
          // Create new card if it doesn't exist and change is positive
          await this.ptcgpRepository.createUserCard({
            user_id: userId,
            expansion,
            card_number: cardNumber,
            count: change
          });

          // Record in history
          await this.ptcgpRepository.createCardHistory({
            user_id: userId,
            expansion,
            card_number: cardNumber,
            count: change
          });

          results.push({
            expansion,
            cardNumber,
            oldCount: 0,
            newCount: change,
            change
          });
        }
      }

      return results;
    });
  }

  async getRecentCardUpdates(username: string, limit: number = 10, offset: number = 0) {
    if (!username) {
      throw new Error('Username is required');
    }

    const user = await this.ptcgpRepository.findUserByUsername(username);
    
    if (!user) {
      throw new Error('User not found');
    }

    return this.ptcgpRepository.findRecentCardUpdates(user.id, limit, offset);
  }

  async getMissingCards(username: string, expansion?: string) {
    if (!username) {
      throw new Error('Username is required');
    }

    const user = await this.ptcgpRepository.findUserByUsername(username);
    
    if (!user) {
      throw new Error('User not found');
    }

    return this.ptcgpRepository.findMissingCards(user.id, expansion);
  }

  async getCollectionStats(username: string, expansion?: string) {
    if (!username) {
      throw new Error('Username is required');
    }

    const user = await this.ptcgpRepository.findUserByUsername(username);
    
    if (!user) {
      throw new Error('User not found');
    }

    const userCards = await this.ptcgpRepository.findUserCards(username);
    const missingCards = await this.ptcgpRepository.findMissingCards(user.id, expansion);
    
    let totalCards = 0;
    if (expansion) {
      totalCards = await this.ptcgpRepository.countTotalCards(expansion);
    } else {
      // Count total cards across all expansions
      const allCards = await this.ptcgpRepository.findCards();
      totalCards = allCards.length;
    }

    const ownedCards = userCards.length;
    const completionPercentage = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;

    return {
      totalCards,
      ownedCards,
      missingCards: missingCards.length,
      completionPercentage: Math.round(completionPercentage * 100) / 100
    };
  }
}