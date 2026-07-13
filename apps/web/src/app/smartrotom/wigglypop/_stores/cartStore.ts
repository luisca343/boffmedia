"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WpListing } from "../_types/market.types"

/**
 * The cart.
 *
 * It is deliberately **client-only** — there is no cart table on the server. A cart
 * is an intention, not a commitment: nothing is reserved, no money moves, and the
 * listing you added can be bought out from under you by someone else. It only
 * becomes real at checkout, when `POST /orders` takes the whole thing in one escrow
 * payment. Persisting it to localStorage is what makes it survive a refresh without
 * inventing server state we would then have to reconcile.
 *
 * Consequence to keep in mind at the call sites: a cart line holds a **snapshot** of
 * the listing as it was when added. The checkout screen re-reads the live listings
 * and refuses to pay for anything whose price moved or that is no longer `activo`.
 */

export interface CartLine {
  /** The listing id, stringified. One line per listing — a Pokémon is unique. */
  key: string
  listing: WpListing
  qty: number
}

interface CartState {
  lines: CartLine[]
  add: (listing: WpListing, qty?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (listing, qty = 1) =>
        set((s) => {
          const key = String(listing.id)
          const existing = s.lines.find((l) => l.key === key)

          // A Pokémon and a bundle are single, indivisible things — adding one
          // twice is a no-op, not a quantity of two. Only item listings stack.
          if (existing) {
            if (listing.kind !== "item") return s
            const max = listing.items[0]?.qty ?? 999
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, qty: Math.min(max, l.qty + qty) } : l,
              ),
            }
          }
          return { lines: [...s.lines, { key, listing, qty }] }
        }),

      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => {
            if (l.key !== key) return l
            const max = l.listing.kind === "item" ? (l.listing.items[0]?.qty ?? 999) : 1
            return { ...l, qty: Math.max(1, Math.min(max, qty)) }
          }),
        })),

      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "wigglypop-cart" },
  ),
)

/** Total units, counting an item line's quantity. Drives the nav badge. */
export const cartCount = (lines: CartLine[]): number =>
  lines.reduce((n, l) => n + (l.listing.kind === "item" ? l.qty : 1), 0)

export const lineTotal = (l: CartLine): number =>
  l.listing.kind === "item" ? l.listing.price * l.qty : l.listing.price

/** The protection fee. 2.5%, charged ON TOP of the subtotal — never deducted from it. */
export const FEE_RATE = 0.025
export const feeFor = (subtotal: number): number => Math.round(subtotal * FEE_RATE)
