import { Injectable } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import {
  TcgpBoosterPack,
  tcgpBoosterPacks,
  tcgpCards,
  tcgpCardsPacks,
  tcgpUsersCards,
} from '@/_db/schema/TCGP';
import { and, eq, isNull } from 'drizzle-orm';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

@Injectable()
export class TgcpPackService {
  constructor(private db: MySQL2Service) {}

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
    [key: string]: { [key: string]: number[] };
  } = {};

  async calculateIndividualProbabilities(expansionID: string, packId: string) {
    const cacheKey = `${expansionID}-${packId}`;
    if (this.packProbabilitiesCache[cacheKey]) {
      return this.packProbabilitiesCache[cacheKey];
    }

    const db = this.db.getDrizzle();

    // Get all cards in the pack
    const packCards = await db
      .select({
        rarity: tcgpCards.rarity,
      })
      .from(tcgpCardsPacks)
      .innerJoin(
        tcgpCards,
        and(
          eq(tcgpCardsPacks.expansion, tcgpCards.expansion),
          eq(tcgpCardsPacks.card_number, tcgpCards.number),
        ),
      )
      .where(
        and(
          eq(tcgpCardsPacks.expansion, expansionID),
          eq(tcgpCardsPacks.pack_id, packId),
        ),
      )
      .execute();

    if (packCards.length === 0) {
      return { message: 'No cards found in the pack.' };
    }

    // Count the number of cards for each rarity
    const rarityCount: { [key: string]: number } = {};
    for (const card of packCards) {
      rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
    }

    // Calculate individual probabilities based on collective probabilities
    const individualProbabilities: { [key: string]: number[] } = {};
    for (const rarity in this.collectiveRarityChances) {
      if (rarityCount[rarity]) {
        individualProbabilities[rarity] = this.collectiveRarityChances[
          rarity
        ].map((chance) => chance / rarityCount[rarity]);
      } else {
        individualProbabilities[rarity] = [0, 0, 0, 0, 0];
      }
    }

    this.packProbabilitiesCache[cacheKey] = individualProbabilities;
    return individualProbabilities;
  }

  async getBoosterPacks(expansion: string = null): Promise<TcgpBoosterPack[]> {
    if (!expansion)
      return this.db.getDrizzle().select().from(tcgpBoosterPacks).execute();
    return this.db
      .getDrizzle()
      .select()
      .from(tcgpBoosterPacks)
      .where(eq(tcgpBoosterPacks.expansion, expansion))
      .execute();
  }

  async getBestPackToPull(username: string) {
    const db = this.db.getDrizzle();

    const user = await db
      .select({ id: boffMediaUsers.id })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.username, username))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userId = user[0].id;

    const missingCards = await db
      .select({
        expansion: tcgpCards.expansion,
        number: tcgpCards.number,
        rarity: tcgpCards.rarity,
        name: tcgpCards.name,
        pack: tcgpCardsPacks.pack_id,
      })
      .from(tcgpCards)
      .leftJoin(
        tcgpUsersCards,
        and(
          eq(tcgpUsersCards.user_id, userId),
          eq(tcgpUsersCards.expansion, tcgpCards.expansion),
          eq(tcgpUsersCards.card_number, tcgpCards.number),
        ),
      )
      .leftJoin(
        tcgpCardsPacks,
        and(
          eq(tcgpCardsPacks.expansion, tcgpCards.expansion),
          eq(tcgpCardsPacks.card_number, tcgpCards.number),
        ),
      )
      .where(isNull(tcgpUsersCards.user_id))
      .execute();

    const accumulatedChances: {
      [boosterPack: string]: { [key: string]: number[] };
    } = {};

    for (const card of missingCards) {
      if (!card.pack) continue;
      if (!accumulatedChances[card.pack]) {
        accumulatedChances[card.pack] = {};
      }

      const packProbabilities = await this.calculateIndividualProbabilities(card.expansion, card.pack);
      //const packProbabilities = this.individualRarityChances;

      if (
        typeof packProbabilities === 'object' &&
        !('message' in packProbabilities)
      ) {
        if (!accumulatedChances[card.pack][card.rarity]) {
          accumulatedChances[card.pack][card.rarity] = [0, 0, 0, 0, 0];
        }

        for (let i = 0; i < 5; i++) {
          accumulatedChances[card.pack][card.rarity][i] +=
            packProbabilities[card.rarity][i];
        }
      }
    }

    const packProbabilities: {
      [key: string]: {
        newCardProbabilities: number[];
        aggregateProbability: number;
      };
    } = {};

    for (const packId in accumulatedChances) {
      packProbabilities[packId] = {
        newCardProbabilities: [0, 0, 0, 0, 0],
        aggregateProbability: 0,
      };

      for (const rarity in accumulatedChances[packId]) {
        for (let i = 0; i < 5; i++) {
          packProbabilities[packId].newCardProbabilities[i] +=
            accumulatedChances[packId][rarity][i];
        }
      }

      packProbabilities[packId].aggregateProbability =
        1 -
        packProbabilities[packId].newCardProbabilities.reduce(
          (acc, prob) => acc * (1 - prob),
          1,
        );
    }

    const bestPack = Object.entries(packProbabilities).reduce(
      (best, [packId, probabilities]) => {
        return probabilities.aggregateProbability > best.probability
          ? { packId, probability: probabilities.aggregateProbability }
          : best;
      },
      { packId: null, probability: -1 },
    );

    if (bestPack.packId === null) {
      return { message: 'You have all the cards! No best pack to recommend.' };
    }

    const packDetails = await db
      .select()
      .from(tcgpBoosterPacks)
      .where(eq(tcgpBoosterPacks.name, bestPack.packId))
      .execute();

    if (packDetails.length === 0) {
      return { message: 'Best pack details not found in the database.' };
    }

    return {
      bestPack: packDetails[0],
      probabilities: packProbabilities[bestPack.packId],
      allPackProbabilities: packProbabilities,
    };
  }

  async getBestPackForEvent(
    username: string,
    eventCards: string[],
    expansion: string,
  ) {
    const db = this.db.getDrizzle();
  
    const user = await db
      .select({ id: boffMediaUsers.id })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.username, username))
      .execute();
  
    if (user.length === 0) {
      throw new Error('User not found');
    }
  
    const userId = user[0].id;
  
    // Get all cards the user has in the specified expansion
    const presentCards = await db
      .select({
        expansion: tcgpCards.expansion,
        number: tcgpCards.number,
        rarity: tcgpCards.rarity,
        name: tcgpCards.name,
      })
      .from(tcgpCards)
      .innerJoin(
        tcgpUsersCards,
        and(
          eq(tcgpUsersCards.user_id, userId),
          eq(tcgpUsersCards.expansion, tcgpCards.expansion),
          eq(tcgpUsersCards.card_number, tcgpCards.number),
        ),
      )
      .where(eq(tcgpCards.expansion, expansion))
      .execute();
  
    // Filter out the event cards that the user already has
    const missingEventCards = eventCards.filter(
      (eventCard) =>
        !presentCards.some((presentCard) =>
          presentCard.name.toLowerCase().replace("ex", "").trim() === (eventCard.toLowerCase()),
        ),
    );
  
    // Get all cards for the specific expansion
    const expansionCards = await db
      .select({
        expansion: tcgpCards.expansion,
        number: tcgpCards.number,
        rarity: tcgpCards.rarity,
        name: tcgpCards.name,
      })
      .from(tcgpCards)
      .where(eq(tcgpCards.expansion, expansion))
      .execute();
  
    // Filter the expansion cards to only include the missing event cards
    const missingCards = expansionCards.filter((card) =>
      missingEventCards.some((eventCard) =>
        card.name.toLowerCase().includes(eventCard.toLowerCase()),
      ),
    );
  
    // Get all packs and their cards for the specific expansion
    const packCards = await db
      .select({
        packId: tcgpCardsPacks.pack_id,
        expansion: tcgpCardsPacks.expansion,
        cardNumber: tcgpCardsPacks.card_number,
        rarity: tcgpCards.rarity,
        name: tcgpCards.name,
      })
      .from(tcgpCardsPacks)
      .innerJoin(
        tcgpCards,
        and(
          eq(tcgpCardsPacks.expansion, tcgpCards.expansion),
          eq(tcgpCardsPacks.card_number, tcgpCards.number),
        ),
      )
      .where(eq(tcgpCardsPacks.expansion, expansion))
      .execute();
  
    if (packCards.length === 0) {
      return { message: 'No packs or cards found for this expansion.' };
    }
  
    const accumulatedChances: {
      [boosterPack: string]: { [key: string]: number[] };
    } = {};
  
    for (const card of missingCards) {
      const packCardsForMissingCard = packCards.filter(
        (pc) => pc.cardNumber === card.number
      );
  
      for (const packCard of packCardsForMissingCard) {
        if (!accumulatedChances[packCard.packId]) {
          accumulatedChances[packCard.packId] = {};
        }
  
        const packProbabilities = await this.calculateIndividualProbabilities(packCard.expansion, packCard.packId);
        
        if (typeof packProbabilities === 'object' && !('message' in packProbabilities)) {
          if (!accumulatedChances[packCard.packId][card.rarity]) {
            accumulatedChances[packCard.packId][card.rarity] = [0, 0, 0, 0, 0];
          }
  
          for (let i = 0; i < 5; i++) {
            accumulatedChances[packCard.packId][card.rarity][i] += packProbabilities[card.rarity][i];
          }
        }
      }
    }
  
    const packProbabilities: {
      [key: string]: {
        newCardProbabilities: number[];
        aggregateProbability: number;
      };
    } = {};
  
    for (const packId in accumulatedChances) {
      packProbabilities[packId] = {
        newCardProbabilities: [0, 0, 0, 0, 0],
        aggregateProbability: 0,
      };
  
      for (const rarity in accumulatedChances[packId]) {
        for (let i = 0; i < 5; i++) {
          packProbabilities[packId].newCardProbabilities[i] += accumulatedChances[packId][rarity][i];
        }
      }
  
      packProbabilities[packId].aggregateProbability =
        1 - packProbabilities[packId].newCardProbabilities.reduce(
          (acc, prob) => acc * (1 - Math.min(prob, 1)),
          1,
        );
    }
  
    const bestPack = Object.entries(packProbabilities).reduce(
      (best, [packId, probabilities]) => {
        return probabilities.aggregateProbability > best.probability
          ? { packId, probability: probabilities.aggregateProbability }
          : best;
      },
      { packId: null, probability: -1 },
    );
  
    if (bestPack.packId === null) {
      return {
        message: 'You have all the event cards! No best pack to recommend.',
      };
    }
  
    // Get pack details
    const packDetails = await db
      .select()
      .from(tcgpBoosterPacks)
      .where(eq(tcgpBoosterPacks.name, bestPack.packId))
      .execute();
  
    if (packDetails.length === 0) {
      return { message: 'Best pack details not found in the database.' };
    }
  
    return {
      bestPack: packDetails[0],
      probabilities: packProbabilities[bestPack.packId],
      allPackProbabilities: packProbabilities,
      missingEventCards,
      totalEventCards: eventCards.length,
    };
  }
}
