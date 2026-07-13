import type { CSSProperties } from "react"
import {
  Home,
  Search,
  Bell,
  Mail,
  SquarePen,
  Feather,
  Reply,
  Repeat2,
  Heart,
  Share2,
  BarChart2,
  MoreHorizontal,
  BadgeCheck,
  Check,
  Zap,
  Trophy,
  Sword,
  Sparkles,
  Pin,
  MapPin,
  Calendar,
  Users,
  Flame,
  Image,
  BarChart3,
  Smile,
  Globe,
  Settings,
  ArrowLeft,
  X,
  Plus,
  Link2,
  Play,
  Shield,
  Star,
  Grid2x2,
  Hash,
  TrendingUp,
  Bookmark,
  ChevronRight,
  Clock,
  type LucideIcon,
} from "lucide-react"

/**
 * Rooker's icon set — lucide-react placeholders standing in for the hand-drawn
 * glyphs this replaced. See the migration ledger for fidelity notes (`gif` in
 * particular has no lucide equivalent and reuses `image`).
 */
const MAP = {
  home: Home,
  search: Search,
  bell: Bell,
  mail: Mail,
  compose: SquarePen,
  feather: Feather,
  reply: Reply,
  retrino: Repeat2,
  heart: Heart,
  share: Share2,
  views: BarChart2,
  more: MoreHorizontal,
  verified: BadgeCheck,
  check: Check,
  bolt: Zap,
  trophy: Trophy,
  sword: Sword,
  sparkle: Sparkles,
  pin: Pin,
  location: MapPin,
  calendar: Calendar,
  users: Users,
  flame: Flame,
  image: Image,
  poll: BarChart3,
  gif: Image,
  smile: Smile,
  globe: Globe,
  settings: Settings,
  back: ArrowLeft,
  close: X,
  plus: Plus,
  link: Link2,
  play: Play,
  shield: Shield,
  star: Star,
  grid: Grid2x2,
  fire: Flame,
  hash: Hash,
  trending: TrendingUp,
  bookmark: Bookmark,
  chevron: ChevronRight,
  clock: Clock,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

export interface IconProps {
  name: IconName
  size?: number
  /** Ignored when `fill` is set — a filled glyph has no stroke. */
  stroke?: number
  fill?: boolean
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 20, stroke = 1.9, fill = false, className = "", style }: IconProps) {
  const Glyph = MAP[name]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      strokeWidth={stroke}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  )
}
