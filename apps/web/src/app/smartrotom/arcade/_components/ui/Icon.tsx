import type { SVGProps } from "react"

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  /** Pixel size — both axes. The set is drawn on a 24×24 grid and scales cleanly. */
  s?: number
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

function Svg({ s = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden focusable="false" {...rest}>
      {children}
    </svg>
  )
}

const Joystick = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M12 9v8" />
    <path d="M5 21h14l-2-4H7l-2 4z" />
  </Svg>
)

const CHEVRON_ROTATION = { right: 0, down: 90, left: 180, up: 270 } as const

const Chevron = ({ s, dir = "right", ...p }: IconProps & { dir?: keyof typeof CHEVRON_ROTATION }) => (
  <Svg
    s={s}
    {...stroke}
    strokeWidth={2}
    style={{ transform: `rotate(${CHEVRON_ROTATION[dir]}deg)` }}
    {...p}
  >
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

// The only icon in the set with its own palette: a coin has to read as gold even
// on an amber panel, so it does not take `currentColor`.
const Coin = ({ s = 18, ...p }: IconProps) => {
  const gradientId = "ar-coin-gradient"
  return (
    <Svg s={s} {...p}>
      <defs>
        <radialGradient id={gradientId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6c4" />
          <stop offset="55%" stopColor="#ffb845" />
          <stop offset="100%" stopColor="#9c5b00" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${gradientId})`} stroke="#7a4400" strokeWidth="1.2" />
      <text x="12" y="16" textAnchor="middle" fontSize="9" fill="#5e3a00">
        ★
      </text>
    </Svg>
  )
}

const Heart = ({ s, ...p }: IconProps) => (
  <Svg s={s} fill="currentColor" {...p}>
    <path d="M12 21s-7-4.35-9.5-9C1.1 9.55 2.6 6 6 6c2 0 3.5 1.2 4 2.5C10.5 7.2 12 6 14 6c3.4 0 4.9 3.55 3.5 6-2.5 4.65-9.5 9-9.5 9z" />
  </Svg>
)

const Trophy = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a3 3 0 0 0 3 3" />
    <path d="M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 13l1 4h4l1-4" />
    <path d="M8 20h8" />
  </Svg>
)

const Box = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <path d="M3 8l9-4 9 4-9 4-9-4z" />
    <path d="M3 8v9l9 4 9-4V8" />
    <path d="M12 12v9" />
  </Svg>
)

const Info = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.8" fill="currentColor" />
  </Svg>
)

const Search = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

const Filter = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2} {...p}>
    <path d="M3 5h18" />
    <path d="M6 12h12" />
    <path d="M10 19h4" />
  </Svg>
)

const Reset = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v6h6" />
  </Svg>
)

const Gear = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.17 16.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9 1.7 1.7 0 0 0 4.3 7.1l-.06-.06A2 2 0 1 1 7.07 4.2l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.83 7.1l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </Svg>
)

const Plus = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

const X = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={2.4} {...p}>
    <path d="M6 6l12 12M6 18L18 6" />
  </Svg>
)

const Sparkle = ({ s, ...p }: IconProps) => (
  <Svg s={s} fill="currentColor" {...p}>
    <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
  </Svg>
)

const Bell = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Svg>
)

const Target = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </Svg>
)

const Calendar = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </Svg>
)

const Crown = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <path d="M3 7l4 4 5-7 5 7 4-4-2 13H5L3 7z" />
  </Svg>
)

const Grid = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
)

const Shield = ({ s, ...p }: IconProps) => (
  <Svg s={s} {...stroke} strokeWidth={1.8} {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
)

/**
 * The arcade's icon set. Inline SVG on a shared 24×24 grid, `currentColor`
 * throughout (except `Coin`) — never `lucide-react`: mixing stroke weights is
 * exactly what the migration removed (SMARTROTOM_V3.md §10).
 */
export const Icon = {
  Joystick,
  Chevron,
  Coin,
  Heart,
  Trophy,
  Box,
  Info,
  Search,
  Filter,
  Reset,
  Gear,
  Plus,
  X,
  Sparkle,
  Bell,
  Target,
  Calendar,
  Crown,
  Grid,
  Shield,
}

export type IconName = keyof typeof Icon
