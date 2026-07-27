import * as React from "react"
import {
  Home,
  Compass,
  Radio,
  Library,
  Clock,
  Heart,
  Flame,
  Search,
  Bell,
  Plus,
  MessageCircle,
  ChevronRight,
  Check,
  Menu,
  Gamepad2,
  Users,
  TrendingUp,
  Film,
  Play,
  Dot,
  Settings,
  Share2,
  ThumbsUp,
  Download,
  Save,
  Sparkles,
  Bookmark,
  Eye,
  type LucideIcon,
} from "lucide-react"
import { Rotom } from "@/lib/smartrotom/customIcons"
import { makeGlyphIcon } from "@/components/smartrotom/behavior/makeIconComponent"

export interface IconProps {
  size?: number
  /** stroke width; 0 for solid glyphs */
  stroke?: number
  className?: string
}

function Icon({
  d,
  size = 20,
  stroke = 1.75,
  className,
}: IconProps & { d: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d}
    </svg>
  )
}

/** `filled` glyphs render solid (`fill="currentColor"`, no visible stroke). */
function make(Glyph: LucideIcon, opts: { filled?: boolean } = {}) {
  return makeGlyphIcon(Glyph, { size: 20, strokeWidth: 1.75, fill: Boolean(opts.filled) })
}

const IcRotom = makeGlyphIcon(Rotom, { size: 20, strokeWidth: 1.5 })

/**
 * Icon registry — lucide-react placeholders standing in for the hand-drawn glyphs
 * this replaced, plus the hand-drawn `rotom` mascot (lucide has no equivalent); see
 * the migration ledger for fidelity notes. Reference by literal key (`<I.home />`) or
 * drive a nav config with a string key (`const Glyph = I[item.icon]`) — never a
 * dynamic class.
 */
export const I = {
  home: make(Home),
  compass: make(Compass),
  live: make(Radio),
  lib: make(Library),
  clock: make(Clock),
  heart: make(Heart),
  flame: make(Flame),
  search: make(Search),
  bell: make(Bell),
  plus: make(Plus),
  chat: make(MessageCircle),
  chevron: make(ChevronRight),
  check: make(Check),
  menu: make(Menu),
  gamepad: make(Gamepad2),
  users: make(Users),
  trending: make(TrendingUp),
  film: make(Film),
  play: make(Play, { filled: true }),
  dot: make(Dot, { filled: true }),
  cog: make(Settings),
  share: make(Share2),
  thumbUp: make(ThumbsUp),
  download: make(Download),
  save: make(Save),
  sparkles: make(Sparkles),
  bookmark: make(Bookmark),
  eye: make(Eye),
  rotom: IcRotom,
} as const

export type IconName = keyof typeof I

export { Icon }
