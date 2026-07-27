import type { ComponentProps } from "react"
import { makeIconComponent } from "@/components/smartrotom/behavior/makeIconComponent"
import {
  MapPin,
  Search,
  ArrowUpDown,
  Clock,
  Coins,
  Navigation,
  X,
  Crosshair,
  Plus,
  Minus,
  Check,
  Wallet,
  Route,
  ArrowRight,
  ArrowDown,
  Sparkle,
  Star,
  PersonStanding,
  Users,
  Trophy,
  Flame,
  Gift,
  Globe,
  Map,
  Lock,
  Bell,
  Calendar,
  CirclePlus,
  Swords,
  Tag,
  PartyPopper,
  Skull,
  Anchor,
  type LucideIcon,
} from "lucide-react"

/**
 * The taxi's icon set — lucide-react placeholders standing in for the hand-drawn
 * glyphs this replaced. See the migration ledger for fidelity notes.
 */
const MAP = {
  pin: MapPin,
  search: Search,
  sort: ArrowUpDown,
  clock: Clock,
  coins: Coins,
  nav: Navigation,
  x: X,
  crosshair: Crosshair,
  plus: Plus,
  minus: Minus,
  check: Check,
  wallet: Wallet,
  route: Route,
  arrowR: ArrowRight,
  arrowDown: ArrowDown,
  spark: Sparkle,
  star: Star,
  walking: PersonStanding,
  users: Users,
  trophy: Trophy,
  flame: Flame,
  gift: Gift,
  globe: Globe,
  map: Map,
  lock: Lock,
  bell: Bell,
  calendar: Calendar,
  plusCircle: CirclePlus,
  swords: Swords,
  tag: Tag,
  partyPop: PartyPopper,
  skull: Skull,
  anchor: Anchor,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

/** `stroke` is a WIDTH, not a colour. */
export const Icon = makeIconComponent(MAP, { size: 22, strokeWidth: 2 })

export type IconProps = ComponentProps<typeof Icon>
