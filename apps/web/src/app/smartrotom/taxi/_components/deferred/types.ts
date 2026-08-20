import type { IconName } from "../ui"

/**
 * Shapes for surfaces the API cannot feed yet.
 *
 * Everything in `deferred/` is fully built but rendered nowhere in the live app — it
 * appears only in the component showcase, marked as deferred. The moment an endpoint
 * exists these components drop straight into the app; until then, showing them would
 * mean inventing events, discounts and player counts that do not exist. Registered in
 * `docs/smartrotom/deferred/README.md`.
 */

export type EventType = "gym" | "market" | "raid" | "social" | "boss"

export interface TaxiEvent {
  id: string
  stopId: string
  type: EventType
  title: string
  sub: string
  /** Minutes until it ends — drives the countdown. */
  endsInMin: number
  hot?: boolean
}

/**
 * Event hues are data, not theme: they live as a JS map and are applied inline.
 * `labelKey` is a key id under `taxi.eventTypes` — never copy.
 */
export const EVENT_META: Record<EventType, { labelKey: EventType; icon: IconName; color: string }> = {
  gym: { labelKey: "gym", icon: "swords", color: "#a78bfa" },
  market: { labelKey: "market", icon: "tag", color: "#fbbf24" },
  raid: { labelKey: "raid", icon: "flame", color: "#fb7185" },
  social: { labelKey: "social", icon: "partyPop", color: "#22d3ee" },
  boss: { labelKey: "boss", icon: "skull", color: "#f472b6" },
}

export interface PartyMember {
  id: string
  name: string
  initials: string
  online: boolean
}

export interface RiderTier {
  id: string
  name: string
  min: number
  discount: number
  color: string
}

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: IconName
  done?: boolean
  progress?: number
  goal?: number
}

export interface CoinPackage {
  id: string
  coins: number
  bonus: number
  price: string
  tag?: string
}
