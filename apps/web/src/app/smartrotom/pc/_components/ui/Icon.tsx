import type { CSSProperties } from "react"
import {
  Search,
  SlidersVertical,
  ArrowDownWideNarrow,
  LayoutGrid,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Star,
  Heart,
  RefreshCw,
  Repeat,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  Command,
  Info,
  Users,
  Sword,
  Grip,
  Check,
  Layers,
  Palette,
  ArrowRight,
  Bookmark,
  Zap,
  WifiOff,
  Package,
  Columns2,
  Keyboard,
  List,
  Copy,
  Share2,
  Book,
  Wand2,
  Target,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react"
import { Mars, Venus, Neuter } from "@/lib/smartrotom/customIcons"

/**
 * The PC's icon set — lucide-react placeholders standing in for the hand-drawn set
 * this replaced. `mars`/`venus`/`neuter` come from the shared hand-drawn gender
 * glyphs (lucide ships none); see the migration ledger for fidelity notes.
 */
const MAP = {
  search: Search,
  sliders: SlidersVertical,
  sort: ArrowDownWideNarrow,
  grid: LayoutGrid,
  box: Box,
  boxes: Boxes,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  chevD: ChevronDown,
  x: X,
  star: Star,
  heart: Heart,
  refresh: RefreshCw,
  swap: Repeat,
  plus: Plus,
  trash: Trash2,
  tag: Tag,
  sparkles: Sparkles,
  command: Command,
  info: Info,
  users: Users,
  sword: Sword,
  grip: Grip,
  check: Check,
  mars: Mars,
  venus: Venus,
  neuter: Neuter,
  layers: Layers,
  palette: Palette,
  arrowR: ArrowRight,
  bookmark: Bookmark,
  zap: Zap,
  wifiOff: WifiOff,
  package: Package,
  columns: Columns2,
  keyboard: Keyboard,
  list: List,
  copy: Copy,
  share: Share2,
  book: Book,
  wand: Wand2,
  target: Target,
  volume: Volume2,
  volumeOff: VolumeX,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

export interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  fill?: string
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 18, stroke = 2, fill = "none", className, style }: IconProps) {
  const Glyph = MAP[name]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      strokeWidth={stroke}
      fill={fill}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  )
}
