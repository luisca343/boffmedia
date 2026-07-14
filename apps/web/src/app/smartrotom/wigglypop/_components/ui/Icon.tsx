import type { CSSProperties } from "react"
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  FilterX,
  X,
  Plus,
  Minus,
  Check,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Gavel,
  Handshake,
  Repeat,
  Tag,
  Layers,
  Package,
  Bookmark,
  DollarSign,
  Lock,
  ShieldCheck,
  BadgeCheck,
  History,
  TrendingUp,
  Clock,
  Sparkles,
  Crown,
  Star,
  Wand2,
  Bell,
  Eye,
  Users,
  Info,
  TriangleAlert,
  VolumeX,
  type LucideIcon,
} from "lucide-react"
import { Mars, Venus } from "@/lib/smartrotom/customIcons"

/**
 * Wigglypop's icon set — lucide-react placeholders standing in for the hand-drawn
 * glyphs this replaced. `mars`/`venus` come from the shared hand-drawn gender
 * glyphs (lucide ships none); see the migration ledger for fidelity notes.
 */
const MAP = {
  search: Search,
  grid: LayoutGrid,
  list: List,
  sort: ArrowUpDown,
  filter: Filter,
  filterX: FilterX,
  x: X,
  plus: Plus,
  minus: Minus,
  check: Check,
  trash: Trash2,
  refresh: RefreshCw,
  arrowL: ArrowLeft,
  arrowR: ArrowRight,
  chevD: ChevronDown,
  chevL: ChevronLeft,
  chevR: ChevronRight,

  cart: ShoppingCart,
  gavel: Gavel,
  handshake: Handshake,
  swap: Repeat,
  tag: Tag,
  layers: Layers,
  package: Package,
  bookmark: Bookmark,

  dollar: DollarSign,
  lock: Lock,
  shieldCheck: ShieldCheck,
  badgeCheck: BadgeCheck,
  history: History,
  trending: TrendingUp,
  clock: Clock,

  sparkles: Sparkles,
  /** Drawn to be FILLED — pass `filled`. */
  crown: Crown,
  star: Star,
  wand: Wand2,
  mars: Mars,
  venus: Venus,

  bell: Bell,
  eye: Eye,
  users: Users,
  info: Info,
  alert: TriangleAlert,
  mute: VolumeX,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

export interface IconProps {
  name: IconName
  size?: number
  /** 2 is the system's stroke. Go thinner only below ~12px. */
  stroke?: number
  /** For `crown` (and anything else drawn as a solid). */
  filled?: boolean
  className?: string
  style?: CSSProperties
}

export function Icon({
  name,
  size = 18,
  stroke = 2,
  filled = false,
  className = "",
  style,
}: IconProps) {
  const Glyph = MAP[name]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      strokeWidth={stroke}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  )
}
