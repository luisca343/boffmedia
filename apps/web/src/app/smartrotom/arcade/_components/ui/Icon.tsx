import type { SVGProps } from "react"
import { makeGlyphIcon, type GlyphIconProps } from "@/components/smartrotom/behavior/makeIconComponent"
import {
  Joystick,
  ChevronRight,
  Heart,
  Trophy,
  Box,
  Info,
  Search,
  ListFilter,
  RotateCcw,
  Settings,
  Plus,
  X,
  Sparkle,
  Bell,
  Target,
  Calendar,
  Crown,
  Grid2x2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { GoldCoin } from "@/lib/smartrotom/customIcons"

/** `s` is the pixel size — both axes. */
export type IconProps = GlyphIconProps

/** The two glyphs that forward raw SVG attributes themselves. */
type RawIconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & { s?: number }

function make(Glyph: LucideIcon, strokeWidth = 1.8) {
  return makeGlyphIcon(Glyph, { size: 18, strokeWidth })
}

const CHEVRON_ROTATION = { right: 0, down: 90, left: 180, up: 270 } as const

const ChevronIcon = ({ s, dir = "right", style, ...p }: RawIconProps & { dir?: keyof typeof CHEVRON_ROTATION }) => (
  <ChevronRight
    size={s}
    strokeWidth={2}
    style={{ transform: `rotate(${CHEVRON_ROTATION[dir]}deg)`, ...style }}
    aria-hidden
    focusable="false"
    {...p}
  />
)

// The only icon in the set with its own palette: the hand-drawn gold coin
// (radial gradient + ★), shared from the custom-icon module.
const CoinIcon = ({ s = 18, ...p }: RawIconProps) => <GoldCoin size={s} {...p} />

const HeartIcon = makeGlyphIcon(Heart, { size: 18, fill: true })

const SparkleIcon = makeGlyphIcon(Sparkle, { size: 18, fill: true })

/**
 * The arcade's icon set — lucide-react placeholders standing in for the hand-drawn
 * glyphs this replaced. See the migration ledger for fidelity notes.
 */
export const Icon = {
  Joystick: make(Joystick, 1.8),
  Chevron: ChevronIcon,
  Coin: CoinIcon,
  Heart: HeartIcon,
  Trophy: make(Trophy, 1.8),
  Box: make(Box, 1.8),
  Info: make(Info, 2),
  Search: make(Search, 2),
  Filter: make(ListFilter, 2),
  Reset: make(RotateCcw, 2),
  Gear: make(Settings, 1.8),
  Plus: make(Plus, 2.4),
  X: make(X, 2.4),
  Sparkle: SparkleIcon,
  Bell: make(Bell, 1.8),
  Target: make(Target, 1.8),
  Calendar: make(Calendar, 1.8),
  Crown: make(Crown, 1.8),
  Grid: make(Grid2x2, 1.8),
  Shield: make(ShieldCheck, 1.8),
}

export type IconName = keyof typeof Icon
