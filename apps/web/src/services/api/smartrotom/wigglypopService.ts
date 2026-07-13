import {
  rotomGET,
  rotomGETOrThrow,
  rotomPOST,
  rotomPOSTOrThrow,
  rotomPUTOrThrow,
  rotomPATCHOrThrow,
  rotomDELETE,
  type ApiResponse,
} from "@/services/boffAPI"

/**
 * Wigglypop — the marketplace transport.
 *
 * Every non-GET goes through `rotomPOST/PUT/PATCH/DELETE`, which inject
 * `body.server = MC_WORLD` for you. Without it `MinecraftMiddleware` 403s the
 * request (SMARTROTOM_V3.md §8) — so never reach for the bare `POST` here.
 *
 * Types are intentionally loose (`unknown`) at this boundary: the real models come
 * from `@boffmedia/shared` once `pnpm generate:shared` has run against the new
 * server DTOs, and `_hooks/queries.ts` is what maps them into the view-model in
 * `_types/market.types.ts`.
 */

/** `rotomGET/POST/PUT/PATCH/DELETE` already prefix `/smartrotom` — do NOT repeat it here. */
const BASE = "/wigglypop"

export interface ListingQuery {
  search?: string
  kind?: string
  format?: string
  rarities?: string[]
  types?: string[]
  shinyOnly?: boolean
  legendaryOnly?: boolean
  perfectOnly?: boolean
  priceMax?: number
  sort?: string
  page?: number
  limit?: number
}

function qs(params: ListingQuery): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue
    // Repeated keys, not a comma-joined blob: NestJS's ValidationPipe parses
    // `rarities=raro&rarities=epico` into a string[] but a joined string into one item.
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)))
    else sp.append(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

export class WigglypopService {
  // ── listings ───────────────────────────────────────────────────────────────
  static getListings<T>(q: ListingQuery = {}): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/listings${qs(q)}`)
  }
  static getListing<T>(id: number): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/listings/${id}`)
  }
  static createListing<T>(body: unknown): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/listings`, body)
  }
  static updateListing<T>(id: number, body: unknown): Promise<T> {
    return rotomPATCHOrThrow<T>(`${BASE}/listings/${id}`, body)
  }
  static deleteListing<T>(id: number, actorUuid: string): Promise<ApiResponse<T>> {
    return rotomDELETE<T>(`${BASE}/listings/${id}`, { actorUuid })
  }
  static getBids<T>(id: number): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/listings/${id}/bids`)
  }

  /** Derived from real completed sales. Comes back `[]` when there are fewer than 2. */
  static getPriceHistory<T>(dex: number): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/price-history/${dex}`)
  }

  /**
   * The item catalogue the seller declares FROM. There is no bag API on the game
   * server, so this — not the player's real inventory — is what the sell flow lists.
   */
  static getItemCatalog<T>(): Promise<ApiResponse<T>> {
    return rotomGET<T>(`${BASE}/item-catalog`)
  }
  static valuate<T>(body: unknown): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/valuate`, body)
  }

  // ── watchlist ──────────────────────────────────────────────────────────────
  static getWatchlist<T>(uuid: string): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/watchlist/${uuid}`)
  }
  static toggleWatch<T>(uuid: string, listingId: number): Promise<T> {
    return rotomPUTOrThrow<T>(`${BASE}/watchlist`, { uuid, listingId })
  }

  // ── orders (the escrow flow) ───────────────────────────────────────────────
  static createOrder<T>(body: {
    buyerUuid: string
    lines: Array<{ listingId: number; qty: number }>
  }): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/orders`, body)
  }
  static getOrders<T>(uuid: string): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/orders/user/${uuid}`)
  }
  /** Seller: "I handed it over in-game." Manual-custody path only. */
  static markTransferred<T>(id: number, actorUuid: string): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/orders/${id}/transferred`, { actorUuid })
  }
  /** Buyer: "I got it." THIS is what releases the escrow to the seller. */
  static confirmOrder<T>(id: number, actorUuid: string): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/orders/${id}/confirm`, { actorUuid })
  }
  static cancelOrder<T>(id: number, actorUuid: string): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/orders/${id}/cancel`, { actorUuid })
  }

  // ── auctions ───────────────────────────────────────────────────────────────
  static placeBid<T>(body: {
    listingId: number
    bidderUuid: string
    amount: number
  }): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/bids`, body)
  }

  // ── offers ─────────────────────────────────────────────────────────────────
  static createOffer<T>(body: {
    listingId: number
    buyerUuid: string
    amount: number
    qty?: number
  }): Promise<T> {
    return rotomPOSTOrThrow<T>(`${BASE}/offers`, body)
  }
  static getSellerOffers<T>(uuid: string): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/offers/seller/${uuid}`)
  }
  static acceptOffer<T>(id: number, actorUuid: string): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/offers/${id}/accept`, { actorUuid })
  }
  static rejectOffer<T>(id: number, actorUuid: string): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/offers/${id}/reject`, { actorUuid })
  }

  // ── trades ─────────────────────────────────────────────────────────────────
  static createTrade<T>(body: {
    listingId: number
    proposerUuid: string
    offeredPokemonKey: string
    offeredSnapshot: unknown
  }): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/trades`, body)
  }
  static getSellerTrades<T>(uuid: string): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/trades/seller/${uuid}`)
  }
  static acceptTrade<T>(id: number, actorUuid: string): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/trades/${id}/accept`, { actorUuid })
  }
  static rejectTrade<T>(id: number, actorUuid: string): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/trades/${id}/reject`, { actorUuid })
  }

  // ── sellers ────────────────────────────────────────────────────────────────
  /** Rating/sales/reviews are DERIVED server-side from real orders — never seeded. */
  static getSeller<T>(uuid: string): Promise<T> {
    return rotomGETOrThrow<T>(`${BASE}/sellers/${uuid}`)
  }
  static createReview<T>(body: {
    orderId: number
    reviewerUuid: string
    sellerUuid: string
    rating: number
    body?: string
  }): Promise<ApiResponse<T>> {
    return rotomPOST<T>(`${BASE}/reviews`, body)
  }
}
