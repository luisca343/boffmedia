import type { IconName } from "../ui"

/**
 * Shapes for the handoff surfaces the API cannot feed yet.
 *
 * Everything in `deferred/` is BUILT to the handoff but rendered nowhere in the live app
 * — it appears only in the component showcase, marked as deferred. The moment an
 * endpoint exists these components drop straight into the app; until then, showing them
 * would mean inventing events, discounts and player counts that do not exist
 * (SMARTROTOM_V3 §9). Registered in `docs/smartrotom/deferred/README.md`.
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

/** Event hues are data, not theme: they live as a JS map and are applied inline (§4). */
export const EVENT_META: Record<EventType, { label: string; icon: IconName; color: string }> = {
  gym: { label: "Gimnasio", icon: "swords", color: "#a78bfa" },
  market: { label: "Mercado", icon: "tag", color: "#fbbf24" },
  raid: { label: "Incursión", icon: "flame", color: "#fb7185" },
  social: { label: "Social", icon: "partyPop", color: "#22d3ee" },
  boss: { label: "Jefe", icon: "skull", color: "#f472b6" },
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
