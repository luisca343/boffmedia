import type { StarBankTransaction } from "@boffmedia/shared"
import type { EnrichedStop } from "../../../taxi/_types"
import type {
  Achievement,
  CoinPackage,
  PartyMember,
  RiderTier,
  TaxiEvent,
} from "../../../taxi/_components/deferred/types"

// Demo fixtures for the Taxi chapter. Specimens need something to render, and the
// showcase is the one place invented content is legitimate — it documents the component,
// it is not the app. Nothing here is imported by the taxi itself.

export const TX_STOPS: EnrichedStop[] = [
  {
    id: "Spawn Central",
    x: 0,
    y: 70,
    z: 0,
    world: "world",
    region: "Ciudad Teras",
    dist: 324,
    price: 262,
    bearing: 202,
  },
  {
    id: "Puerto Wingull",
    x: 1840,
    y: 64,
    z: -2210,
    world: "world",
    region: "Costa",
    dist: 2764,
    price: 1482,
    bearing: 38,
  },
  {
    id: "Liga Teras",
    x: 4200,
    y: 92,
    z: -4100,
    world: "world",
    dist: 5711,
    price: 2956,
    bearing: 47,
  },
]

/** A debit (from the player's account #1) and a credit (into it) — the two shapes
 *  the wallet renders. Direction is read from `from`/`to`, never from `isPayer`. */
export const TX_TRANSACTIONS: StarBankTransaction[] = [
  {
    from: 1,
    to: 0,
    isPayer: true,
    amount: 1482,
    reason: "Taxi a Puerto Wingull",
    fromBalance: 9240,
    toBalance: 0,
    type: "TRANSFERENCIA" as StarBankTransaction["type"],
    date: new Date(Date.now() - 38 * 60_000).toISOString(),
  },
  {
    from: 0,
    to: 1,
    isPayer: false,
    amount: 5300,
    reason: "Nómina semanal",
    fromBalance: 0,
    toBalance: 9240,
    type: "TRANSFERENCIA" as StarBankTransaction["type"],
    date: new Date(Date.now() - 30 * 3_600_000).toISOString(),
  },
]

export const TX_EVENTS: TaxiEvent[] = [
  {
    id: "e1",
    stopId: "Bosque Esmeralda",
    type: "raid",
    title: "Incursión: Snorlax Tera",
    sub: "Faltan 4 entrenadores · recompensa garantizada",
    endsInMin: 22,
    hot: true,
  },
  {
    id: "e2",
    stopId: "Mercado Bidkea",
    type: "market",
    title: "Subasta relámpago",
    sub: "Objetos legendarios hasta −50%",
    endsInMin: 40,
  },
  {
    id: "e3",
    stopId: "Cumbre Helada",
    type: "boss",
    title: "Jefe del mundo: Avalugg",
    sub: "Aparece a medianoche del servidor",
    endsInMin: 264,
  },
]

export const TX_PARTY: PartyMember[] = [
  { id: "p1", name: "MistyAqua", initials: "MA", online: true },
  { id: "p2", name: "BrockRock", initials: "BR", online: true },
  { id: "p3", name: "GreenLeaf", initials: "GL", online: false },
]

export const TX_TIERS: RiderTier[] = [
  { id: "bronce", name: "Bronce", min: 0, discount: 0, color: "#c08a4e" },
  { id: "plata", name: "Plata", min: 10, discount: 0.05, color: "#9fb2c8" },
  { id: "oro", name: "Oro", min: 25, discount: 0.1, color: "#f5c542" },
  { id: "platino", name: "Platino", min: 50, discount: 0.15, color: "#7dd3fc" },
]

export const TX_ACHIEVEMENTS: Achievement[] = [
  { id: "a1", name: "Primer viaje", desc: "Completa tu primer teletransporte", icon: "nav", done: true },
  { id: "a2", name: "Trotamundos", desc: "Visita 10 destinos distintos", icon: "globe", progress: 7, goal: 10 },
  { id: "a3", name: "Gran gastador", desc: "Gasta 25 000 ¥ en taxis", icon: "coins", progress: 6722, goal: 25000 },
]

export const TX_PACKAGES: CoinPackage[] = [
  { id: "pk1", coins: 1000, bonus: 0, price: "0,99 €" },
  { id: "pk2", coins: 5000, bonus: 300, price: "3,99 €", tag: "Popular" },
]
