// Surface-agnostic: every glyph paints in `currentColor`, so it is the desk or the paper
// ink of whatever it is placed in.

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { makeIconComponent } from "@/components/smartrotom/behavior/makeIconComponent"
import {
  Clock,
  Trophy,
  Skull,
  Footprints,
  Swords,
  Zap,
  Heart,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Book,
  Bookmark,
  Play,
  X,
  Lock,
  Sparkle,
  ShieldCheck,
  ScanLine,
  Type,
  FileText,
  Sun,
  Egg,
  Crown,
  Flag,
  Globe,
  Route,
  IdCard,
  Plane,
  Medal,
  Star,
  type LucideIcon,
} from "lucide-react"
import { Rotom } from "@/lib/smartrotom/customIcons"

/**
 * Pasaporte's icon set — lucide-react placeholders standing in for the hand-drawn
 * engraved glyphs this replaced, plus the hand-drawn `rotom` mascot (lucide has no
 * equivalent); see the migration ledger for fidelity notes on every entry.
 */
const MAP = {
  clock: Clock,
  trophy: Trophy,
  skull: Skull,
  foot: Footprints,
  swords: Swords,
  zap: Zap,
  heart: Heart,
  cal: Calendar,
  pin: MapPin,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  book: Book,
  bookmark: Bookmark,
  play: Play,
  x: X,
  lock: Lock,
  sparkle: Sparkle,
  shield: ShieldCheck,
  scan: ScanLine,
  rotom: Rotom,
  type: Type,
  contract: FileText,
  sun: Sun,
  egg: Egg,
  crown: Crown,
  flag: Flag,
  globe: Globe,
  route: Route,
  idcard: IdCard,
  plane: Plane,
  medal: Medal,
  star: Star,
} as const satisfies Record<string, LucideIcon>

/** Drawn as a solid, not a stroke. */
const FILLED = new Set<IconName>(["star"])

export type IconName = keyof typeof MAP

/** Sized by class (`h-4 w-4`, `h-[17px] w-[17px]`) — `size` is ignored here. */
export const Icon = makeIconComponent(MAP, {
  sizeless: true,
  strokeWidth: 2,
  fill: false,
  filled: FILLED,
  className: (cls) => cn("h-4 w-4 flex-none", cls),
})

export type IconProps = ComponentProps<typeof Icon>
