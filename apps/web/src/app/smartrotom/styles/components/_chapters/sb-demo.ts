import type { SBAccount, SBTransaction } from "@/app/smartrotom/starbank/_types"
import { CATEGORIES } from "@/app/smartrotom/starbank/_utils/categories"

// Deterministic fixtures for the Starbank specimens. No `Math.random()` and no
// `Date.now()`: the showcase must paint the same pixels on every render.

/** The account the transaction specimens are seen from (drives in/out sign). */
export const SB_ACCOUNT_ID = 1

export const SB_ACCOUNTS: SBAccount[] = [
  { id: SB_ACCOUNT_ID, name: "Rotom_Dex", balance: 128_400, type: "MAIN" },
  { id: 2, name: "Teras", balance: 42_150, type: "SECONDARY" },
]

export const SB_TXS: SBTransaction[] = [
  {
    from: 9,
    to: SB_ACCOUNT_ID,
    amount: 12_500,
    reason: "Premio torneo Wingull",
    date: "2026-07-12T09:14:00.000Z",
    fromBalance: 310_000,
    toBalance: 128_400,
    displayName: "Liga_Pokemon",
    displayAccountType: "MAIN",
  },
  {
    from: SB_ACCOUNT_ID,
    to: 4,
    amount: 3_200,
    reason: "Compra de Ultra Balls",
    date: "2026-07-11T17:40:00.000Z",
    fromBalance: 115_900,
    toBalance: 88_400,
    displayName: "Tienda_Ciudad_Verde",
    displayAccountType: "SECONDARY",
  },
  {
    from: SB_ACCOUNT_ID,
    to: 6,
    amount: 990,
    reason: "Suscripción mensual PC+",
    date: "2026-07-09T08:00:00.000Z",
    fromBalance: 119_100,
    toBalance: 51_000,
    displayName: "Almacen_Bill",
    displayAccountType: "SECONDARY",
  },
  {
    from: SB_ACCOUNT_ID,
    to: 7,
    amount: 1_500,
    reason: "Cuota de gimnasio",
    date: "2026-07-06T19:25:00.000Z",
    fromBalance: 120_090,
    toBalance: 76_300,
    displayName: "Gimnasio_Celeste",
    displayAccountType: "SECONDARY",
  },
  {
    from: 2,
    to: SB_ACCOUNT_ID,
    amount: 8_000,
    reason: "Transferencia desde Teras",
    date: "2026-07-02T11:05:00.000Z",
    fromBalance: 42_150,
    toBalance: 121_590,
    displayName: "Teras",
    displayAccountType: "SECONDARY",
  },
]

/** 30-day balance curve — smooth trend + a fixed wave, so it reads like real data. */
export const SB_BALANCE_SERIES = Array.from({ length: 30 }, (_, i) => ({
  day: 29 - i,
  balance: Math.round(96_000 + i * 1_150 + Math.sin(i / 2.4) * 4_400 + Math.cos(i / 5) * 1_800),
}))

export const SB_SPARK = [18, 22, 19, 27, 24, 31, 29, 36, 33, 41, 38, 47]

export const SB_BARS = [
  { label: "Feb", income: 14_200, expense: 9_400 },
  { label: "Mar", income: 16_800, expense: 11_200 },
  { label: "Abr", income: 12_400, expense: 13_600 },
  { label: "May", income: 19_500, expense: 10_800 },
  { label: "Jun", income: 21_300, expense: 15_100 },
  { label: "Jul", income: 24_600, expense: 12_900 },
]

/** Donut slices + their legend share one source, so colours can never drift apart. */
export const SB_SPEND_BY_CATEGORY = [
  { category: CATEGORIES.shop, value: 18_400 },
  { category: CATEGORIES.league, value: 12_000 },
  { category: CATEGORIES.heal, value: 7_600 },
  { category: CATEGORIES.subscription, value: 5_940 },
  { category: CATEGORIES.transfer, value: 4_200 },
  { category: CATEGORIES.other, value: 2_100 },
]

export const SB_DONUT = SB_SPEND_BY_CATEGORY.map(({ category, value }) => ({ value, hex: category.hex }))
