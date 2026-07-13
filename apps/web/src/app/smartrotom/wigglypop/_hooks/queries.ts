"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useBoffSession } from "@/services/useBoffSession"
import { usePokemonStore } from "@/stores/pokemonStore"
import { WigglypopService, type ListingQuery } from "@/services/api/smartrotom/wigglypopService"
import { rotomGETOrThrow, userMessageFrom } from "@/services/boffAPI"
import type { Pokemon } from "@/types/Pokemon"
import type {
  WpBid,
  WpListing,
  WpMon,
  WpOffer,
  WpOrder,
  WpSeller,
  WpTradeOffer,
} from "../_types/market.types"
import { ivPct } from "../_utils/rarity"
import { toast } from "../_components/ui"

/** The SmartRotom uuid every Wigglypop endpoint is keyed by. `null` until signed in. */
export function useWpUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}

export const wpKeys = {
  listings: (q: ListingQuery) => ["wigglypop", "listings", q] as const,
  listing: (id: number) => ["wigglypop", "listing", id] as const,
  bids: (id: number) => ["wigglypop", "bids", id] as const,
  priceHistory: (dex: number) => ["wigglypop", "price-history", dex] as const,
  watchlist: (uuid: string) => ["wigglypop", "watchlist", uuid] as const,
  orders: (uuid: string) => ["wigglypop", "orders", uuid] as const,
  offers: (uuid: string) => ["wigglypop", "offers", uuid] as const,
  trades: (uuid: string) => ["wigglypop", "trades", uuid] as const,
  seller: (uuid: string) => ["wigglypop", "seller", uuid] as const,
  balance: (uuid: string) => ["wigglypop", "balance", uuid] as const,
}

// ── server → view-model ───────────────────────────────────────────────────────
// Mapped in exactly ONE place. Components never touch a server entity.

/**
 * Types are NOT on the listing's mon snapshot — the game payload does not always
 * carry them, so like the PC we look them up on the species' form in the Pokédex
 * store, which is real data we already fetch. Never guessed; a species we have not
 * loaded yet yields `[]` and the card simply shows no type pills.
 */
function typesOf(dex: number, form: string | null, byDex: Record<number, Pokemon>): string[] {
  const species = byDex[dex]
  if (!species?.forms?.length) return []
  const f =
    species.forms.find((x) => x.name?.toLowerCase() === (form ?? "").toLowerCase()) ??
    species.forms[0]
  return (f?.types ?? []).map((t) => t.toLowerCase())
}

function toMon(raw: any, byDex: Record<number, Pokemon>): WpMon {
  const ivs: number[] = Array.isArray(raw.ivs) ? raw.ivs : []
  return {
    pokemonKey: raw.pokemonKey,
    dex: raw.dex,
    species: raw.species,
    name: raw.name || raw.species,
    form: raw.form ?? undefined,
    palette: raw.palette ?? undefined,
    level: raw.level,
    nature: raw.nature ?? "—",
    ability: raw.ability ?? "—",
    gender: (raw.gender ?? "genderless") as WpMon["gender"],
    heldItem: raw.heldItem,
    ball: raw.ball ?? undefined,
    ot: raw.ot ?? undefined,
    caughtIn: raw.caughtIn ?? undefined,
    shiny: !!raw.shiny,
    legendary: !!raw.legendary,
    types: typesOf(raw.dex, raw.form ?? null, byDex),
    ivs,
    evs: Array.isArray(raw.evs) ? raw.evs : [],
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    moves: Array.isArray(raw.moves) ? raw.moves.filter(Boolean) : [],
    rarity: raw.rarity,
    ivPct: ivPct(ivs),
    value: raw.value,
  }
}

function toSeller(raw: any): WpSeller {
  return {
    uuid: raw?.uuid ?? "",
    username: raw?.username ?? "Entrenador",
    rating: raw?.rating ?? null,
    reviews: raw?.reviews ?? 0,
    sales: raw?.sales ?? 0,
    joinedAt: raw?.joinedAt,
  }
}

function toListing(raw: any, byDex: Record<number, Pokemon>): WpListing {
  const mons: WpMon[] = (raw.mons ?? []).map((m: any) => toMon(m, byDex))
  return {
    id: raw.id,
    code: raw.code,
    kind: raw.kind,
    format: raw.format,
    status: raw.status,
    title: raw.title,
    note: raw.note ?? undefined,
    price: raw.price,
    value: raw.value,
    // A bundle's rarity is the rarity of its best Pokémon; an item listing has none,
    // so it falls back to común rather than crashing the rarity maps.
    rarity: mons[0]?.rarity ?? "comun",
    seller: toSeller(raw.seller),
    escrow: !!raw.escrow,
    views: raw.views ?? 0,
    watchers: raw.watchers ?? 0,
    createdAt: raw.createdAt,
    mons,
    items: (raw.items ?? []).map((i: any) => ({
      itemId: i.itemId,
      name: i.itemName,
      category: i.category ?? "Objetos",
      qty: i.qty,
      unitPrice: i.unitPrice,
    })),
    currentBid: raw.currentBid || undefined,
    bids: raw.bids ?? 0,
    minIncrement: raw.minIncrement || undefined,
    buyNow: raw.buyNow ?? null,
    endsAt: raw.endsAt ?? undefined,
    offers: raw.offers ?? 0,
    wants: raw.wants ?? undefined,
    tradePlus: !!raw.tradePlus,
  }
}

function toOrder(raw: any, byDex: Record<number, Pokemon>): WpOrder {
  return {
    id: raw.id,
    code: raw.code,
    status: raw.status,
    subtotal: raw.subtotal,
    fee: raw.fee,
    total: raw.total,
    createdAt: raw.createdAt,
    lines: (raw.lines ?? []).map((l: any) => ({
      id: l.id,
      listingId: l.listingId,
      kind: l.kind,
      title: l.listing?.title ?? l.title ?? "Artículo",
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      deliveryStatus: l.deliveryStatus,
      seller: toSeller(l.seller ?? l.listing?.seller),
      mons: (l.listing?.mons ?? []).map((m: any) => toMon(m, byDex)),
      items: (l.listing?.items ?? []).map((i: any) => ({
        itemId: i.itemId,
        name: i.itemName,
        category: i.category ?? "Objetos",
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
    })),
  }
}

/** The species index every mapper needs. Fetched once by the layout. */
function useSpeciesByDex(): Record<number, Pokemon> {
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  return useMemo(() => {
    const byDex: Record<number, Pokemon> = {}
    for (const p of allPokemon) byDex[p.dex] = p
    return byDex
  }, [allPokemon])
}

// ── reads ────────────────────────────────────────────────────────────────────

export function useListings(q: ListingQuery) {
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.listings(q),
    queryFn: () => WigglypopService.getListings<any>(q),
    select: (data): { total: number; items: WpListing[] } => ({
      total: data.total as number,
      items: (data.items ?? []).map((l: any) => toListing(l, byDex)),
    }),
  })
}

export function useListing(id: number | null) {
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.listing(id ?? 0),
    queryFn: () => WigglypopService.getListing<any>(id!),
    select: (raw) => toListing(raw, byDex),
    enabled: id !== null,
  })
}

export function useBids(listingId: number | null) {
  return useQuery({
    queryKey: wpKeys.bids(listingId ?? 0),
    queryFn: () => WigglypopService.getBids<any[]>(listingId!),
    select: (rows): WpBid[] =>
      rows.map((b) => ({
        id: b.id,
        bidderUuid: b.bidder?.uuid ?? "",
        bidderName: b.bidder?.username ?? "Entrenador",
        amount: b.amount,
        createdAt: b.createdAt,
      })),
    enabled: listingId !== null,
  })
}

/** Derived from real completed sales. `[]` until a species has genuinely sold twice. */
export function usePriceHistory(dex: number | null) {
  return useQuery({
    queryKey: wpKeys.priceHistory(dex ?? 0),
    queryFn: () => WigglypopService.getPriceHistory<number[]>(dex!),
    enabled: dex !== null,
    staleTime: 5 * 60_000,
  })
}

export function useWatchlist() {
  const uuid = useWpUuid()
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.watchlist(uuid ?? ""),
    queryFn: () => WigglypopService.getWatchlist<any>(uuid!),
    select: (data) => (data.items ?? []).map((l: any) => toListing(l, byDex)) as WpListing[],
    enabled: Boolean(uuid),
  })
}

export function useOrders() {
  const uuid = useWpUuid()
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.orders(uuid ?? ""),
    queryFn: () => WigglypopService.getOrders<any[]>(uuid!),
    select: (rows): WpOrder[] => rows.map((o) => toOrder(o, byDex)),
    enabled: Boolean(uuid),
  })
}

export function useSellerOffers() {
  const uuid = useWpUuid()
  return useQuery({
    queryKey: wpKeys.offers(uuid ?? ""),
    queryFn: () => WigglypopService.getSellerOffers<any[]>(uuid!),
    select: (rows): WpOffer[] =>
      rows.map((o) => ({
        id: o.id,
        listingId: o.listingId,
        listingTitle: o.listing?.title ?? "Anuncio",
        buyerUuid: o.buyer?.uuid ?? "",
        buyerName: o.buyer?.username ?? "Entrenador",
        amount: o.amount,
        qty: o.qty ?? 1,
        status: o.status,
        createdAt: o.createdAt,
      })),
    enabled: Boolean(uuid),
  })
}

export function useSellerTrades() {
  const uuid = useWpUuid()
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.trades(uuid ?? ""),
    queryFn: () => WigglypopService.getSellerTrades<any[]>(uuid!),
    select: (rows): WpTradeOffer[] =>
      rows.map((t) => ({
        id: t.id,
        listingId: t.listingId,
        listingTitle: t.listing?.title ?? "Anuncio",
        proposerUuid: t.proposer?.uuid ?? "",
        proposerName: t.proposer?.username ?? "Entrenador",
        offered: toMon(t.offeredSnapshot ?? {}, byDex),
        status: t.status,
        createdAt: t.createdAt,
      })),
    enabled: Boolean(uuid),
  })
}

export function useSeller(uuid: string | null) {
  const byDex = useSpeciesByDex()
  return useQuery({
    queryKey: wpKeys.seller(uuid ?? ""),
    queryFn: () => WigglypopService.getSeller<any>(uuid!),
    select: (raw) => ({
      seller: toSeller(raw),
      activeListings: raw.activeListings ?? 0,
      reviews: raw.reviews ?? [],
    }),
    enabled: Boolean(uuid),
  })
}

/**
 * The wallet. This is the player's REAL StarBank balance — Wigglypop has no
 * currency of its own, and every price in the app is money that actually moves.
 */
export function useBalance() {
  const uuid = useWpUuid()
  return useQuery({
    queryKey: wpKeys.balance(uuid ?? ""),
    queryFn: () => rotomGETOrThrow<{ balance: number }>(`/starbank/balance/${uuid}`),
    select: (d) => d.balance,
    enabled: Boolean(uuid),
  })
}

// ── writes ───────────────────────────────────────────────────────────────────

/** Everything a purchase touches: the balance, the ledger, and the listing's status. */
function useInvalidateAfterMoney() {
  const qc = useQueryClient()
  const uuid = useWpUuid()
  return () => {
    if (!uuid) return
    void qc.invalidateQueries({ queryKey: ["wigglypop", "listings"] })
    void qc.invalidateQueries({ queryKey: wpKeys.orders(uuid) })
    void qc.invalidateQueries({ queryKey: wpKeys.balance(uuid) })
  }
}

export function useToggleWatch() {
  const uuid = useWpUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (listingId: number) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.toggleWatch<{ watching: boolean }>(uuid, listingId)
    },
    onSuccess: (res) => {
      toast(res.watching ? "Añadido a seguimiento" : "Quitado de seguimiento", "success")
      if (uuid) void qc.invalidateQueries({ queryKey: wpKeys.watchlist(uuid) })
      void qc.invalidateQueries({ queryKey: ["wigglypop", "listings"] })
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo actualizar el seguimiento"), "error"),
  })
}

/** THE buy. One escrow payment for the whole basket. */
export function useCreateOrder() {
  const uuid = useWpUuid()
  const invalidate = useInvalidateAfterMoney()
  const byDex = useSpeciesByDex()
  return useMutation({
    mutationFn: (lines: Array<{ listingId: number; qty: number }>) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.createOrder<any>({ buyerUuid: uuid, lines })
    },
    onSuccess: (raw) => {
      invalidate()
      return toOrder(raw, byDex)
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo completar la compra"), "error"),
  })
}

/** Buyer confirms receipt — this is what actually releases the money to the seller. */
export function useConfirmOrder() {
  const uuid = useWpUuid()
  const invalidate = useInvalidateAfterMoney()
  return useMutation({
    mutationFn: (orderId: number) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.confirmOrder(orderId, uuid)
    },
    onSuccess: () => {
      toast("Pago liberado · ¡gracias por confirmar!", "success")
      invalidate()
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo confirmar el pedido"), "error"),
  })
}

/** Seller says they handed it over in-game. Manual-custody path only. */
export function useMarkTransferred() {
  const uuid = useWpUuid()
  const invalidate = useInvalidateAfterMoney()
  return useMutation({
    mutationFn: (orderId: number) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.markTransferred(orderId, uuid)
    },
    onSuccess: () => {
      toast("Marcado como transferido", "success")
      invalidate()
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo marcar como transferido"), "error"),
  })
}

export function useCancelOrder() {
  const uuid = useWpUuid()
  const invalidate = useInvalidateAfterMoney()
  return useMutation({
    mutationFn: (orderId: number) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.cancelOrder(orderId, uuid)
    },
    onSuccess: () => {
      toast("Depósito reembolsado a tu monedero", "success")
      invalidate()
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo cancelar el pedido"), "error"),
  })
}

export function usePlaceBid() {
  const uuid = useWpUuid()
  const invalidate = useInvalidateAfterMoney()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listingId, amount }: { listingId: number; amount: number }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.placeBid({ listingId, bidderUuid: uuid, amount })
    },
    onSuccess: (_d, { listingId }) => {
      toast("Puja registrada", "success")
      invalidate()
      void qc.invalidateQueries({ queryKey: wpKeys.listing(listingId) })
      void qc.invalidateQueries({ queryKey: wpKeys.bids(listingId) })
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo registrar la puja"), "error"),
  })
}

export function useCreateOffer() {
  const uuid = useWpUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      listingId,
      amount,
      qty,
    }: {
      listingId: number
      amount: number
      qty?: number
    }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.createOffer({ listingId, buyerUuid: uuid, amount, qty })
    },
    onSuccess: (_d, { listingId }) => {
      toast("Oferta enviada", "success")
      void qc.invalidateQueries({ queryKey: wpKeys.listing(listingId) })
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo enviar la oferta"), "error"),
  })
}

export function useCreateListing() {
  const qc = useQueryClient()
  const uuid = useWpUuid()
  return useMutation({
    mutationFn: (body: unknown) => WigglypopService.createListing<any>(body),
    onSuccess: () => {
      toast("¡Anuncio publicado!", "success")
      void qc.invalidateQueries({ queryKey: ["wigglypop", "listings"] })
      if (uuid) void qc.invalidateQueries({ queryKey: wpKeys.seller(uuid) })
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo publicar el anuncio"), "error"),
  })
}

export function useUpdateListing() {
  const qc = useQueryClient()
  const uuid = useWpUuid()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Record<string, unknown> }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return WigglypopService.updateListing<any>(id, { ...patch, actorUuid: uuid })
    },
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: ["wigglypop", "listings"] })
      void qc.invalidateQueries({ queryKey: wpKeys.listing(id) })
      if (uuid) void qc.invalidateQueries({ queryKey: wpKeys.seller(uuid) })
    },
    onError: (e: unknown) => toast(userMessageFrom(e, "No se pudo actualizar el anuncio"), "error"),
  })
}
