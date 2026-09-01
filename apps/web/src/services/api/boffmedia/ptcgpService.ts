import { apiGET, apiPOST, apiPUT, apiDELETE, apiAuthedAutoGET, getApiUrl, sessionToken } from '@/services/boffAPI';
import type {
  TcgSeries,
  TcgSet,
  TcgCard,
  SeriesCardsGroup,
  SuccessResponse,
} from '@boffmedia/shared';

// User cards DTOs
interface AddUserCardDto {
  userId: number;
  cardId: string;
  quantity?: number;
  variant?: string;
}

interface UpdateUserCardQuantityDto {
  quantity: number;
}

interface UserCardEntity {
  id: string;
  userId: string;
  cardId: string;
  quantity: number;
  variant: string | null;
  addedAt: Date;
  updatedAt: Date;
}

interface UserCardHistoryEntity {
  id: string;
  userId: string;
  cardId: string;
  action: 'ADD' | 'UPDATE' | 'REMOVE';
  previousQuantity: number | null;
  newQuantity: number | null;
  variant: string | null;
  timestamp: Date;
}


// ==================== SELECTIVE SYNC (ADMIN) ====================

export type TcgSyncStage = 'series' | 'sets' | 'cards' | 'images';

export type TcgSyncSetState = 'missing' | 'cards-partial' | 'images-partial' | 'ok';

export interface TcgSyncSetStatus {
  id: string;
  name: string;
  inDb: boolean;
  cardsRemote: number;
  cardsInDb: number;
  imagesEn: number;
  imagesEs: number;
  /** Cards with artwork in at least one locale. */
  imagesAny: number;
  /** Cards with no artwork at all. */
  imagesMissing: number;
  state: TcgSyncSetState;
}

export interface TcgSyncStatus {
  seriesId: string;
  remoteAvailable: boolean;
  remoteError?: string | null;
  setsRemote: number;
  setsInDb: number;
  cardsRemote: number;
  cardsInDb: number;
  imagesPresent: number;
  imagesExpected: number;
  sets: TcgSyncSetStatus[];
}

export interface TcgSyncRequest {
  seriesId?: string;
  series?: boolean;
  sets?: boolean;
  cards?: boolean;
  images?: boolean;
  setIds?: string[];
  force?: boolean;
}

export interface TcgSyncCounts {
  downloaded: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface TcgSyncFailure {
  stage: TcgSyncStage;
  scope: string;
  message: string;
}

/** Mirrors `TcgSyncEvent` in the API's tcg-sync.service.ts. */
export type TcgSyncEvent =
  | { type: 'start'; seriesId: string; stages: TcgSyncStage[]; sets: Array<{ id: string; name: string }> }
  | { type: 'stage'; stage: TcgSyncStage; state: 'running' | 'done' | 'error'; message?: string; counts?: TcgSyncCounts }
  | {
      type: 'set';
      stage: 'cards' | 'images';
      setId: string;
      setName: string;
      index: number;
      total: number;
      state: 'running' | 'done' | 'skipped' | 'error';
      counts?: TcgSyncCounts;
      message?: string;
      /** Cards upstream publishes no artwork for. Not a failure - an absence. */
      unavailable?: number;
    }
  | { type: 'item'; stage: 'cards' | 'images'; setId: string; done: number; total: number; label?: string }
  | { type: 'done'; cancelled: boolean; durationMs: number; counts: TcgSyncCounts; failures: TcgSyncFailure[] };

export class PtcgpService {
  // ==================== DATABASE OPERATIONS ====================

  /**
   * Get all series from database
   */
  static getAllSeries() {
    return apiGET<TcgSeries[]>('/tools/ptcgp/series');
  }

  /**
   * Get sets for series from database
   */
  static getSetsForSeries(seriesId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgSet[]>(`/tools/ptcgp/series/${seriesId}/sets${params}`);
  }

  /**
   * Get cards for set from database
   */
  static getCardsForSet(setId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgCard[]>(`/tools/ptcgp/sets/${setId}/cards${params}`);
  }

  /**
   * Get card by ID from database
   */
  static getCardById(cardId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgCard>(`/tools/ptcgp/cards/${cardId}${params}`);
  }

  /**
   * Get all cards for series grouped by set from database
   */
  static getAllCardsForSeriesGrouped(seriesId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<SeriesCardsGroup[]>(`/tools/ptcgp/series/${seriesId}/cards/grouped${params}`);
  }

  /**
   * Get all cards for series ungrouped (flat array)
   */
  static getAllCardsForSeries(seriesId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgCard[]>(`/tools/ptcgp/series/${seriesId}/cards${params}`);
  }

  // ==================== FETCH OPERATIONS (EXTERNAL API) ====================

  /**
   * Fetch and store series from external API
   */
  static fetchAndStoreSeries() {
    return apiGET<SuccessResponse>('/tools/ptcgp/fetch/series');
  }

  /**
   * Fetch sets for series from external API
   */
  static fetchSetsForSeries(seriesId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgSet[]>(`/tools/ptcgp/fetch/series/${seriesId}/sets${params}`);
  }

  /**
   * Fetch and store sets for series (both languages)
   */
  static fetchAndStoreSetsForSeries(seriesId: string) {
    return apiGET<TcgSet[]>(`/tools/ptcgp/fetch/series/${seriesId}/sets/store`);
  }

  /**
   * Fetch cards for set from external API
   */
  static fetchCardsForSet(setId: string, locale: string = 'en') {
    const params = locale !== 'en' ? `?locale=${locale}` : '';
    return apiGET<TcgCard[]>(`/tools/ptcgp/fetch/sets/${setId}/cards${params}`);
  }

  /**
   * Fetch and store cards for set (both languages)
   */
  static fetchAndStoreCardsForSet(setId: string) {
    return apiGET<TcgCard[]>(`/tools/ptcgp/fetch/sets/${setId}/cards/store`);
  }

  // ==================== FETCH BATCH OPERATIONS ====================

  /**
   * Fetch and store all cards for series
   */
  static fetchAndStoreAllCardsForSeries(seriesId: string) {
    return apiGET<Array<{ setId: string; cards: TcgCard[] | null; error: string | null }>>(
      `/tools/ptcgp/fetch/series/${seriesId}/cards/store`
    );
  }

  // ==================== USER CARDS OPERATIONS ====================

  /**
   * Get user cards
   */
  static getUserCards(userId: string) {
    return apiGET<UserCardEntity[]>(`/tools/ptcgp/users/${userId}/cards`);
  }

  /**
   * Add card to user collection
   */
  static addUserCard(data: AddUserCardDto) {
    return apiPOST<SuccessResponse>('/tools/ptcgp/users/cards', data);
  }

  /**
   * Update user card quantity
   */
  static updateUserCardQuantity(userId: number, cardId: string, data: UpdateUserCardQuantityDto) {
    return apiPUT<SuccessResponse>(`/tools/ptcgp/users/${userId}/cards/${cardId}`, data);
  }

  /**
   * Remove card from user collection
   */
  static removeUserCard(userId: number, cardId: string) {
    return apiDELETE<SuccessResponse>(`/tools/ptcgp/users/${userId}/cards/${cardId}`);
  }

  /**
   * Get user card history
   */
  static getUserCardHistory(userId: number) {
    return apiGET<UserCardHistoryEntity[]>(`/tools/ptcgp/users/${userId}/cards/history`);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get complete series data (sets and all cards)
   */
  static async getSeriesData(seriesId: string, locale: string = 'en') {
    const [sets, allCards] = await Promise.all([
      PtcgpService.getSetsForSeries(seriesId, locale),
      PtcgpService.getAllCardsForSeries(seriesId, locale)
    ]);
    return { sets, allCards };
  }

  /**
   * Get set with its cards
   */
  static async getSetWithCards(setId: string, locale: string = 'en') {
    const cards = await PtcgpService.getCardsForSet(setId, locale);
    return { setId, cards };
  }

  /**
   * Initialize series data (fetch and store everything)
   */
  static async initializeSeriesData(seriesId: string) {
    try {
      // First ensure series exists
      await PtcgpService.fetchAndStoreSeries();
      
      // Then fetch and store sets
      await PtcgpService.fetchAndStoreSetsForSeries(seriesId);
      
      // Finally fetch and store all cards
      const results = await PtcgpService.fetchAndStoreAllCardsForSeries(seriesId);
      
      return results;
    } catch (error) {
      console.error('Failed to initialize series data:', error);
      throw error;
    }
  }


  // ==================== SELECTIVE SYNC (ADMIN) ====================

  /**
   * Stored versus available, per set. Read before syncing so the admin sees what
   * is missing, partial or already up to date.
   */
  static getSyncStatus(seriesId: string = 'tcgp') {
    return apiAuthedAutoGET<TcgSyncStatus>(
      `/tools/ptcgp/admin/sync/status?seriesId=${encodeURIComponent(seriesId)}`,
    );
  }

  /**
   * Runs a selective sync, calling `onEvent` for each SSE frame as it arrives.
   * Pass an `AbortSignal` to stop the run: the API watches for the disconnect and
   * halts instead of finishing the remaining sets.
   */
  static async streamSync(
    request: TcgSyncRequest,
    onEvent: (event: TcgSyncEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch(`${getApiUrl()}/tools/ptcgp/admin/sync/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await sessionToken()}`,
      },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      throw new Error(`Sync failed to start (HTTP ${res.status})`);
    }
    if (!res.body) throw new Error('No response body from sync stream.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep the incomplete tail for the next chunk

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as TcgSyncEvent);
        } catch {
          // malformed frame - skip
        }
      }
    }
  }

  /**
   * Get series overview with basic stats
   */
  static async getSeriesOverview(seriesId: string, locale: string = 'en') {
    const seriesData = await PtcgpService.getAllCardsForSeriesGrouped(seriesId, locale);
    
    const totalCards = seriesData.data?.reduce((sum, set) => sum + set.cardCount, 0) || 0;
    const totalSets = seriesData.data?.length || 0;
    
    return {
      seriesId,
      totalSets,
      totalCards,
      sets: seriesData.data?.map(set => ({
        setId: set.setId,
        setName: set.setName,
        cardCount: set.cardCount
      })) || []
    };
  }

  /**
   * Check if series has data in database
   */
  static async hasSeriesData(seriesId: string) {
    try {
      const sets = await PtcgpService.getSetsForSeries(seriesId);
      return sets.data && sets.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh series data (fetch latest from external API)
   */
  static async refreshSeriesData(seriesId: string) {
    const results = await PtcgpService.fetchAndStoreAllCardsForSeries(seriesId);
    
    const successful = results.data?.filter(r => !r.error) || [];
    const failed = results.data?.filter(r => r.error) || [];
    
    return {
      total: results.data?.length || 0,
      successful: successful.length,
      failed: failed.length,
      results: results.data || []
    };
  }

  /**
   * Search cards by name across all series
   */
  static async searchCards(query: string, seriesId?: string, locale: string = 'en') {
    if (seriesId) {
      const seriesData = await PtcgpService.getAllCardsForSeriesGrouped(seriesId, locale);
      const allCards = seriesData.data?.flatMap(set => set.cards) || [];
      return allCards.filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // If no series specified, would need a dedicated search endpoint
    throw new Error('Global card search not implemented - please specify a seriesId');
  }

  /**
   * Get cards by rarity for a series
   */
  static async getCardsByRarity(seriesId: string, rarity: string, locale: string = 'en') {
    const seriesData = await PtcgpService.getAllCardsForSeriesGrouped(seriesId, locale);
    const allCards = seriesData.data?.flatMap(set => set.cards) || [];
    return allCards.filter(card => card.rarity === rarity);
  }

  /**
   * Get cards by category for a series
   */
  static async getCardsByCategory(seriesId: string, category: string, locale: string = 'en') {
    const seriesData = await PtcgpService.getAllCardsForSeriesGrouped(seriesId, locale);
    const allCards = seriesData.data?.flatMap(set => set.cards) || [];
    return allCards.filter(card => card.category === category);
  }

  /**
   * Get random cards from a series
   */
  static async getRandomCards(seriesId: string, count: number = 5, locale: string = 'en') {
    const seriesData = await PtcgpService.getAllCardsForSeriesGrouped(seriesId, locale);
    const allCards = seriesData.data?.flatMap(set => set.cards) || [];
    
    if (allCards.length <= count) {
      return allCards;
    }
    
    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get set statistics
   */
  static async getSetStatistics(setId: string, locale: string = 'en') {
    const cards = await PtcgpService.getCardsForSet(setId, locale);
    
    if (!cards.data) {
      return null;
    }
    
    const rarityStats = cards.data.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryStats = cards.data.reduce((acc, card) => {
      acc[card.category] = (acc[card.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      setId,
      totalCards: cards.data.length,
      rarityDistribution: rarityStats,
      categoryDistribution: categoryStats,
      hasIllustrators: cards.data.some(card => card.illustrator),
      averageHp: cards.data
        .filter(card => card.hp)
        .reduce((sum, card) => sum + (card.hp || 0), 0) / cards.data.filter(card => card.hp).length || 0
    };
  }

  // ==================== USER COLLECTION CONVENIENCE METHODS ====================

  /**
   * Get user's complete collection with card details
   */
  static async getUserCollectionWithDetails(userId: string, locale: string = 'en') {
    const userCards = await PtcgpService.getUserCards(userId);
    
    if (!userCards.data?.length) {
      return [];
    }

    const cardDetails = await Promise.all(
      userCards.data.map(async (userCard) => {
        try {
          const cardDetail = await PtcgpService.getCardById(userCard.cardId, locale);
          return {
            ...userCard,
            cardDetail: cardDetail.data
          };
        } catch (error) {
          console.warn(`Failed to get details for card ${userCard.cardId}:`, error);
          return {
            ...userCard,
            cardDetail: null
          };
        }
      })
    );

    return cardDetails;
  }

  /**
   * Add multiple cards to user collection
   */
  static async addMultipleUserCards(cards: AddUserCardDto[]) {
    const results = await Promise.allSettled(
      cards.map(card => PtcgpService.addUserCard(card))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: cards.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Get user's collection statistics
   */
  static async getUserCollectionStats(userId: string, locale: string = 'en') {
    const userCards = await PtcgpService.getUserCards(userId);
    
    if (!userCards.data?.length) {
      return {
        totalCards: 0,
        uniqueCards: 0,
        totalQuantity: 0,
        rarityDistribution: {},
        categoryDistribution: {}
      };
    }

    const totalQuantity = userCards.data.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = userCards.data.length;

    // Get card details for statistics
    const cardDetails = await Promise.all(
      userCards.data.map(async (userCard) => {
        try {
          const cardDetail = await PtcgpService.getCardById(userCard.cardId, locale);
          return {
            userCard,
            cardDetail: cardDetail.data
          };
        } catch {
          return {
            userCard,
            cardDetail: null
          };
        }
      })
    );

    const rarityDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};

    cardDetails.forEach(({ userCard, cardDetail }) => {
      if (cardDetail) {
        rarityDistribution[cardDetail.rarity] = (rarityDistribution[cardDetail.rarity] || 0) + userCard.quantity;
        categoryDistribution[cardDetail.category] = (categoryDistribution[cardDetail.category] || 0) + userCard.quantity;
      }
    });

    return {
      totalCards: uniqueCards,
      uniqueCards,
      totalQuantity,
      rarityDistribution,
      categoryDistribution
    };
  }
}

// Export types for use in other files
export type {
  AddUserCardDto,
  UpdateUserCardQuantityDto,
  UserCardEntity,
  UserCardHistoryEntity
};