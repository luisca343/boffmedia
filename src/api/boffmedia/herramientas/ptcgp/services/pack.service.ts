import { Injectable } from '@nestjs/common';
import { PtcgpRepository } from '@repositories/boffmedia/ptcgp.repository';
import { TcgpBoosterPack } from '@/_db/schema/TCGP';

export interface RarityProbabilities {
  [key: string]: number[];
}

@Injectable()
export class PackService {
  constructor(
    private readonly ptcgpRepository: PtcgpRepository,
  ) {}

  // Individual probabilities for each rarity for each roll
  private individualRarityChances = {
    diamond1: [0.02, 0.02, 0.02, 0, 0],
    diamond2: [0, 0, 0, 0.02571, 0.01714],
    diamond3: [0, 0, 0, 0.00357, 0.01429],
    diamond4: [0, 0, 0, 0.00333, 0.01333],
    star1: [0, 0, 0, 0.00322, 0.01286],
    star2: [0, 0, 0, 0.00056, 0.00222],
    star3: [0, 0, 0, 0.00222, 0.00888],
    crown: [0, 0, 0, 0.00013, 0.00053],
    promo: [0, 0, 0, 0, 0],
  };

  // Collective probabilities for each rarity for each roll
  private collectiveRarityChances = {
    diamond1: [1.0, 1.0, 1.0, 0.0, 0.0],
    diamond2: [0.0, 0.0, 0.0, 0.9, 0.6],
    diamond3: [0.0, 0.0, 0.0, 0.05, 0.2],
    diamond4: [0.0, 0.0, 0.0, 0.01666, 0.06664],
    star1: [0.0, 0.0, 0.0, 0.02572, 0.10288],
    star2: [0.0, 0.0, 0.0, 0.005, 0.02],
    star3: [0.0, 0.0, 0.0, 0.00222, 0.00888],
    crown: [0.0, 0.0, 0.0, 0.0008, 0.0016],
    promo: [0, 0, 0, 0, 0],
  };

  private packProbabilitiesCache: {
    [key: string]: RarityProbabilities;
  } = {};

  async getBoosterPacks(expansion?: string): Promise<TcgpBoosterPack[]> {
    return this.ptcgpRepository.findBoosterPacksByExpansion(expansion);
  }

  async createBoosterPack(packData: Partial<TcgpBoosterPack>) {
    if (!packData.name || !packData.expansion) {
      throw new Error('Pack name and expansion are required');
    }

    // Check if pack already exists
    const existingPack = await this.ptcgpRepository.findBoosterPackByName(packData.name, packData.expansion);
    if (existingPack) {
      throw new Error(`Pack ${packData.name} already exists in expansion ${packData.expansion}`);
    }

    return this.ptcgpRepository.createBoosterPack(packData);
  }

  async calculateIndividualProbabilities(expansionID: string, packId: string): Promise<RarityProbabilities> {
    const cacheKey = `${expansionID}-${packId}`;
    if (this.packProbabilitiesCache[cacheKey]) {
      return this.packProbabilitiesCache[cacheKey];
    }

    // Get all cards in the pack
    const packCards = await this.ptcgpRepository.findCardsByPack(expansionID, packId);

    if (packCards.length === 0) {
      throw new Error(`No cards found for pack ${packId} in expansion ${expansionID}`);
    }

    // Count the number of cards for each rarity
    const rarityCount: { [key: string]: number } = {};
    for (const card of packCards) {
      const rarity = card.rarity || 'unknown';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    }

    // Calculate individual probabilities based on collective probabilities
    const individualProbabilities: RarityProbabilities = {};
    for (const rarity in this.collectiveRarityChances) {
      const count = rarityCount[rarity] || 0;
      if (count > 0) {
        individualProbabilities[rarity] = this.collectiveRarityChances[rarity].map(
          (prob) => prob / count
        );
      } else {
        individualProbabilities[rarity] = [0, 0, 0, 0, 0];
      }
    }

    this.packProbabilitiesCache[cacheKey] = individualProbabilities;
    return individualProbabilities;
  }

  async getBestPackToPull(username: string) {
    if (!username) {
      throw new Error('Username is required');
    }

    // Get user
    const user = await this.ptcgpRepository.findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate best pack based on missing cards
    const missingCards = await this.ptcgpRepository.findMissingCards(user.id);
    
    // Group missing cards by pack and calculate scores
    const packScores: { [key: string]: number } = {};
    
    for (const card of missingCards) {
      if (card.pack) {
        const rarityWeight = this.getRarityWeight(card.rarity);
        packScores[card.pack] = (packScores[card.pack] || 0) + rarityWeight;
      }
    }

    // Find the pack with the highest score
    const bestPack = Object.entries(packScores).reduce((best, [pack, score]) => 
      score > best.score ? { pack, score } : best, 
      { pack: '', score: 0 }
    );

    return {
      bestPack: bestPack.pack,
      score: bestPack.score,
      allScores: packScores
    };
  }

  async getBestPackForExpansion(username: string, expansion: string) {
    if (!username || !expansion) {
      throw new Error('Username and expansion are required');
    }

    const user = await this.ptcgpRepository.findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    const missingCards = await this.ptcgpRepository.findMissingCards(user.id, expansion);
    
    const packScores: { [key: string]: number } = {};
    
    for (const card of missingCards) {
      if (card.pack) {
        const rarityWeight = this.getRarityWeight(card.rarity);
        packScores[card.pack] = (packScores[card.pack] || 0) + rarityWeight;
      }
    }

    const bestPack = Object.entries(packScores).reduce((best, [pack, score]) => 
      score > best.score ? { pack, score } : best, 
      { pack: '', score: 0 }
    );

    return {
      expansion,
      bestPack: bestPack.pack,
      score: bestPack.score,
      allScores: packScores
    };
  }

  async getBestPackForEvent(username: string, eventCards: string[], expansion: string) {
    if (!username || !eventCards || !expansion) {
      throw new Error('Username, event cards, and expansion are required');
    }

    // This would require more complex logic to find specific cards
    // For now, return the best pack for the expansion
    return this.getBestPackForExpansion(username, expansion);
  }

  private getRarityWeight(rarity: string): number {
    const weights: { [key: string]: number } = {
      'crown': 100,
      'star3': 50,
      'star2': 30,
      'star1': 20,
      'diamond4': 15,
      'diamond3': 10,
      'diamond2': 5,
      'diamond1': 1,
      'promo': 75,
      'unknown': 1
    };
    
    return weights[rarity] || 1;
  }
}