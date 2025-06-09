import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CardService } from './services/card.service';
import { PackService, RarityProbabilities } from './services/pack.service';
import { UserCardService, CardUpdate } from './services/user-card.service';
import { ScraperService } from './services/scraper.service';
import { TcgpCard, TcgpBoosterPack } from '@/_db/schema/TCGP';

interface FetchStatusData {
  status: 'fetching' | 'success' | 'error';
  message: string;
  timestamp: string;
}

interface BestPackResult {
  bestPack: string;
  score: number;
  allScores: { [key: string]: number };
}

interface CollectionStats {
  totalCards: number;
  ownedCards: number;
  missingCards: number;
  completionPercentage: number;
}

@Injectable()
export class PtcgpFacadeService {
  private readonly logger = new Logger(PtcgpFacadeService.name);

  constructor(
    private readonly cardService: CardService,
    private readonly packService: PackService,
    private readonly userCardService: UserCardService,
    private readonly scraperService: ScraperService,
  ) {}

  // ==================== CARD MANAGEMENT ====================

  async getCards(expansion?: string): Promise<TcgpCard[]> {
    try {
      return await this.cardService.getCards(expansion);
    } catch (error) {
      this.logger.error('Error getting cards:', error);
      throw new Error(`Failed to get cards: ${error.message}`);
    }
  }

  async getCard(expansion: string, number: number): Promise<TcgpCard | null> {
    try {
      return await this.cardService.getCard(expansion, number);
    } catch (error) {
      this.logger.error('Error getting card:', error);
      throw new Error(`Failed to get card: ${error.message}`);
    }
  }

  async createCard(cardData: Partial<TcgpCard>) {
    try {
      return await this.cardService.createCard(cardData);
    } catch (error) {
      this.logger.error('Error creating card:', error);
      throw new Error(`Failed to create card: ${error.message}`);
    }
  }

  // ==================== PACK MANAGEMENT ====================

  async getBoosterPacks(expansion?: string): Promise<TcgpBoosterPack[]> {
    try {
      return await this.packService.getBoosterPacks(expansion);
    } catch (error) {
      this.logger.error('Error getting booster packs:', error);
      throw new Error(`Failed to get booster packs: ${error.message}`);
    }
  }

  async createBoosterPack(packData: Partial<TcgpBoosterPack>) {
    try {
      return await this.packService.createBoosterPack(packData);
    } catch (error) {
      this.logger.error('Error creating booster pack:', error);
      throw new Error(`Failed to create booster pack: ${error.message}`);
    }
  }

  async calculatePackProbabilities(expansionID: string, packId: string): Promise<RarityProbabilities> {
    try {
      return await this.packService.calculateIndividualProbabilities(expansionID, packId);
    } catch (error) {
      this.logger.error('Error calculating pack probabilities:', error);
      throw new Error(`Failed to calculate pack probabilities: ${error.message}`);
    }
  }

  async getBestPackToPull(username: string): Promise<BestPackResult> {
    try {
      return await this.packService.getBestPackToPull(username);
    } catch (error) {
      this.logger.error('Error getting best pack to pull:', error);
      throw new Error(`Failed to get best pack: ${error.message}`);
    }
  }

  async getBestPackForExpansion(username: string, expansion: string): Promise<BestPackResult & { expansion: string }> {
    try {
      return await this.packService.getBestPackForExpansion(username, expansion);
    } catch (error) {
      this.logger.error('Error getting best pack for expansion:', error);
      throw new Error(`Failed to get best pack for expansion: ${error.message}`);
    }
  }

  async getBestPackForEvent(username: string, eventCards: string[], expansion: string) {
    try {
      return await this.packService.getBestPackForEvent(username, eventCards, expansion);
    } catch (error) {
      this.logger.error('Error getting best pack for event:', error);
      throw new Error(`Failed to get best pack for event: ${error.message}`);
    }
  }

  // ==================== USER CARD MANAGEMENT ====================

  async getUserCards(username: string) {
    try {
      return await this.userCardService.getUserCards(username);
    } catch (error) {
      this.logger.error('Error getting user cards:', error);
      throw new Error(`Failed to get user cards: ${error.message}`);
    }
  }

  async batchUpdateUserCards(username: string, cardUpdates: CardUpdate[]) {
    try {
      const results = await this.userCardService.batchUpdateUserCards(username, cardUpdates);
      
      this.logger.log(`Successfully updated ${cardUpdates.length} cards for user ${username}`);
      
      return {
        success: true,
        message: 'Cards updated successfully',
        results
      };
    } catch (error) {
      this.logger.error('Error updating user cards:', error);
      throw new Error(`Failed to update cards: ${error.message}`);
    }
  }

  async getRecentCardUpdates(username: string, limit: number = 10, offset: number = 0) {
    try {
      return await this.userCardService.getRecentCardUpdates(username, limit, offset);
    } catch (error) {
      this.logger.error('Error getting recent card updates:', error);
      throw new Error(`Failed to get recent updates: ${error.message}`);
    }
  }

  async getMissingCards(username: string, expansion?: string) {
    try {
      return await this.userCardService.getMissingCards(username, expansion);
    } catch (error) {
      this.logger.error('Error getting missing cards:', error);
      throw new Error(`Failed to get missing cards: ${error.message}`);
    }
  }

  async getCollectionStats(username: string, expansion?: string): Promise<CollectionStats> {
    try {
      return await this.userCardService.getCollectionStats(username, expansion);
    } catch (error) {
      this.logger.error('Error getting collection stats:', error);
      throw new Error(`Failed to get collection stats: ${error.message}`);
    }
  }

  // ==================== DATA SCRAPING ====================

  async getSets(): Promise<any> {
    try {
      return await this.scraperService.getSets();
    } catch (error) {
      this.logger.error('Error getting sets:', error);
      throw new Error(`Failed to get sets: ${error.message}`);
    }
  }

  async scrapeSoloBattles() {
    try {
      return await this.scraperService.scrapeSoloBattles();
    } catch (error) {
      this.logger.error('Error scraping solo battles:', error);
      throw new Error(`Failed to scrape solo battles: ${error.message}`);
    }
  }

  async refreshDataFromSerebii(): Promise<any> {
    try {
      this.logger.log('Starting data refresh from Serebii...');
      return await this.scraperService.startFetch();
    } catch (error) {
      this.logger.error('Error refreshing data from Serebii:', error);
      throw new Error(`Failed to refresh data: ${error.message}`);
    }
  }

  getFetchStatus(): Observable<FetchStatusData> {
    return this.scraperService.getFetchStatus();
  }

  // ==================== ANALYTICS & INSIGHTS ====================

  async getPackAnalytics(username: string, expansion?: string) {
    try {
      const [
        missingCards,
        collectionStats,
        bestPack,
        boosterPacks
      ] = await Promise.all([
        this.getMissingCards(username, expansion),
        this.getCollectionStats(username, expansion),
        expansion 
          ? this.getBestPackForExpansion(username, expansion)
          : this.getBestPackToPull(username),
        this.getBoosterPacks(expansion)
      ]);

      // Group missing cards by pack
      const missingByPack: { [key: string]: any[] } = {};
      const rarityByPack: { [key: string]: { [key: string]: number } } = {};

      for (const card of missingCards) {
        if (card.pack) {
          if (!missingByPack[card.pack]) {
            missingByPack[card.pack] = [];
            rarityByPack[card.pack] = {};
          }
          
          missingByPack[card.pack].push(card);
          
          const rarity = card.rarity || 'unknown';
          rarityByPack[card.pack][rarity] = (rarityByPack[card.pack][rarity] || 0) + 1;
        }
      }

      // Calculate pack recommendations
      const packRecommendations = Object.keys(missingByPack).map(packName => ({
        packName,
        missingCount: missingByPack[packName].length,
        rarityBreakdown: rarityByPack[packName],
        score: bestPack.allScores[packName] || 0,
        isRecommended: packName === bestPack.bestPack
      })).sort((a, b) => b.score - a.score);

      return {
        collectionStats,
        bestPack,
        packRecommendations,
        missingByPack,
        availablePacks: boosterPacks.map(pack => pack.name)
      };
    } catch (error) {
      this.logger.error('Error getting pack analytics:', error);
      throw new Error(`Failed to get pack analytics: ${error.message}`);
    }
  }

  async getExpansionProgress(username: string) {
    try {
      const userCards = await this.getUserCards(username);
      const allCards = await this.getCards();

      // Group by expansion
      const expansionProgress: { [key: string]: any } = {};
      
      // Initialize with all expansions
      const expansions = [...new Set(allCards.map(card => card.expansion))];
      
      for (const expansion of expansions) {
        const totalCards = allCards.filter(card => card.expansion === expansion).length;
        const ownedCards = userCards.filter(card => card.expansion === expansion).length;
        const completion = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;

        expansionProgress[expansion] = {
          name: expansion,
          totalCards,
          ownedCards,
          completion: Math.round(completion * 100) / 100,
          missing: totalCards - ownedCards
        };
      }

      return {
        expansions: Object.values(expansionProgress),
        overall: {
          totalExpansions: expansions.length,
          completedExpansions: Object.values(expansionProgress).filter((exp: any) => exp.completion === 100).length,
          averageCompletion: expansions.length > 0 
            ? Object.values(expansionProgress).reduce((sum: number, exp: any) => sum + exp.completion, 0) / expansions.length 
            : 0
        }
      };
    } catch (error) {
      this.logger.error('Error getting expansion progress:', error);
      throw new Error(`Failed to get expansion progress: ${error.message}`);
    }
  }

  // ==================== BATTLE UTILITIES ====================

  async getBattleData(battleUrl: string) {
    try {
      // This would use the existing battle service logic
      // For now, return a placeholder
      return {
        commonRewards: [],
        quests: []
      };
    } catch (error) {
      this.logger.error('Error getting battle data:', error);
      throw new Error(`Failed to get battle data: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  async validateUserExists(username: string): Promise<boolean> {
    try {
      const userCards = await this.getUserCards(username);
      return true; // If no error thrown, user exists
    } catch (error) {
      if (error.message.includes('User not found')) {
        return false;
      }
      throw error; // Re-throw other errors
    }
  }

  async healthCheck() {
    try {
      // Test basic functionality
      const cards = await this.getCards();
      const packs = await this.getBoosterPacks();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: {
          totalCards: cards.length,
          totalPacks: packs.length
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}