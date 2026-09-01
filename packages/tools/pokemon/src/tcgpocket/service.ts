/**
 * TCG Pocket data, through `@boffmedia/tool-kit`'s `api` capability.
 *
 * The write surface is deliberately ONE call — `setUserCardQuantity` — where
 * the web service had three (add / update / remove, chosen by what the row
 * looked like a moment ago). That choice cannot be made correctly by a client
 * that may be replaying an edit made an hour earlier on a train, so the API's
 * `PUT` became a real upsert and this is the only shape the tool queues.
 *
 * The `ApiResponse` envelope and the NON-throwing contract are kept as
 * `@/services/boffAPI` had them, so the call sites moved across unchanged.
 */

import { toolApi, ToolApiError } from "@boffmedia/tool-kit";
import type { TcgCard } from "@boffmedia/shared";

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message?: string;
  userMessage?: string;
  code?: string;
  data?: T;
  error?: string;
  success: boolean;
}

async function request<T>(
  path: string,
  init?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    query?: Record<string, string | number | undefined>;
    auth?: "optional" | "required";
  },
): Promise<ApiResponse<T>> {
  try {
    return await toolApi().request<ApiResponse<T>>(path, init);
  } catch (err) {
    if (err instanceof ToolApiError) {
      return {
        success: false,
        statusCode: err.status,
        error: err.message,
        userMessage: err.message,
        code: err.code,
      };
    }
    throw err;
  }
}

/** One set's worth of cards, as `series/:id/cards/grouped` returns them. */
export interface SeriesCardsGroup {
  setId: string;
  setName: string;
  cardCount: number;
  cards: TcgCard[];
}

/**
 * The card shape, straight from the API's generated models.
 *
 * Re-exported here so every view imports it from one place, and so the tool
 * cannot drift from what the API actually sends — a hand-rolled copy would
 * have to be re-verified against `generate:shared` every time the DTO moved.
 * Types only, so nothing survives the build and the launcher's bundler never
 * sees this package at all.
 */
export type { TcgCard } from "@boffmedia/shared";

/** A row of the player's collection. Snake-cased by the API. */
export interface UserCardRow {
  card_id?: string;
  cardId?: string;
  quantity?: number;
}

export interface RecentUpdateRow {
  id?: string | number;
  card_id?: string;
  cardId?: string;
  count?: number;
  change?: number;
  updatedAt?: string;
  updated_at?: string;
  at?: string;
  cardName?: string;
  card_name?: string;
}

export interface PackProbabilities {
  newCardProbabilities: number[];
  aggregateProbability: number;
}

export interface BestPackResult {
  bestPack?: { name?: string };
  allPackProbabilities: Record<string, PackProbabilities>;
}

export class TcgpService {
  /** Public: the card database is the same for everyone. */
  static getGroupedCards(seriesId: string, locale: string) {
    return request<SeriesCardsGroup[]>(`/tools/ptcgp/series/${seriesId}/cards/grouped`, {
      // `en` is the API's own default and it rejects an explicit empty value,
      // so it is left off rather than sent.
      query: locale && locale !== "en" ? { locale } : undefined,
    });
  }

  /** Another player's collection is public (the gallery), so `optional`. */
  static getUserCards(userId: string) {
    return request<UserCardRow[]>(`/tools/ptcgp/users/${userId}/cards`);
  }

  /**
   * Set one card's quantity. 0 removes it.
   *
   * `userId` is in the path because the route has it, but the API ignores it
   * and uses the session's own id — which is what makes a queued write safe to
   * replay: it lands on the player who queued it, whatever the path says.
   */
  static setUserCardQuantity(userId: string, cardId: string, quantity: number) {
    return request<{ success: boolean }>(`/tools/ptcgp/users/${userId}/cards/${cardId}`, {
      method: "PUT",
      body: { quantity },
      auth: "required",
    });
  }

  static getRecentUpdates(username: string, limit = 10) {
    return request<RecentUpdateRow[]>("/herramientas/ptcgp/recent-updates", {
      query: { username, limit, offset: 0 },
    });
  }

  static getBestPack(username: string) {
    return request<BestPackResult>("/herramientas/ptcgp/best-pack", {
      method: "POST",
      body: { username },
    });
  }
}

/** The path a queued quantity change replays against. One place, so the queue
 *  and the direct call can never drift apart. */
export function userCardPath(userId: string, cardId: string): string {
  return `/tools/ptcgp/users/${userId}/cards/${cardId}`;
}
