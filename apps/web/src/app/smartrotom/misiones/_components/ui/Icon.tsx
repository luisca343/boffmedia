import type { SVGProps } from "react"
import {
  Scroll,
  Map,
  Medal,
  PenLine,
  Sword,
  MapPin,
  Lock,
  X,
  Check,
  Search,
  Target,
  Gift,
  Coins,
  ArrowRight,
  Info,
  type LucideIcon,
} from "lucide-react"

/**
 * The board's icon set — lucide-react placeholders standing in for the hand-drawn
 * ink glyphs this replaced. See the migration ledger for fidelity notes.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function make(Glyph: LucideIcon, defaultStrokeWidth = 1.5) {
  return ({ size = 14, ...rest }: IconProps) => (
    <Glyph size={size} strokeWidth={defaultStrokeWidth} aria-hidden focusable="false" {...rest} />
  )
}

export const Icon = {
  Scroll: make(Scroll),
  Map: make(Map),
  Medal: make(Medal),
  Quill: make(PenLine),
  Sword: make(Sword),
  Pin: make(MapPin),
  Lock: make(Lock),
  X: make(X),
  Check: make(Check, 1.7),
  Search: make(Search),
  Target: make(Target),
  Gift: make(Gift),
  Coin: make(Coins),
  Arrow: make(ArrowRight),
  Info: make(Info),
}
