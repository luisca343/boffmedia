import type { ReactNode } from "react"

export type IconProps = {
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
}: IconProps & { d: ReactNode }) {
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

const IcHome = (p: IconProps) => <Icon {...p} d={<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>} />
const IcCompass = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="m14.5 9.5-5 2-2 5 5-2z" /></>} />
const IcLive = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M5.6 5.6a9 9 0 0 0 0 12.8" /><path d="M8.5 8.5a5 5 0 0 0 0 7" /><path d="M18.4 5.6a9 9 0 0 1 0 12.8" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></>} />
const IcLib = (p: IconProps) => <Icon {...p} d={<><rect x="3" y="4" width="6" height="16" rx="1" /><rect x="11" y="4" width="6" height="16" rx="1" /><path d="M19 4 21 20" /></>} />
const IcClock = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
const IcHeart = (p: IconProps) => <Icon {...p} d={<path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />} />
const IcFlame = (p: IconProps) => <Icon {...p} d={<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s-1 4 2 5c0-3 2-5 2-5z" />} />
const IcSearch = (p: IconProps) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />
const IcBell = (p: IconProps) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 6 2 8 2 8H4s2-2 2-8" /><path d="M10 20a2 2 0 0 0 4 0" /></>} />
const IcPlus = (p: IconProps) => <Icon {...p} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />
const IcChat = (p: IconProps) => <Icon {...p} d={<path d="M21 12a8 8 0 1 1-3-6.2L21 4l-1 4.2A8 8 0 0 1 21 12z" />} />
const IcChevron = (p: IconProps) => <Icon {...p} d={<path d="m9 6 6 6-6 6" />} />
const IcCheck = (p: IconProps) => <Icon {...p} d={<path d="m5 12 5 5L20 7" />} />
const IcMenu = (p: IconProps) => <Icon {...p} d={<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>} />
const IcGamepad = (p: IconProps) => <Icon {...p} d={<><rect x="2" y="7" width="20" height="11" rx="3" /><path d="M7 11v3" /><path d="M5.5 12.5h3" /><circle cx="16" cy="11.5" r="0.8" fill="currentColor" /><circle cx="18" cy="13.5" r="0.8" fill="currentColor" /></>} />
const IcUsers = (p: IconProps) => <Icon {...p} d={<><circle cx="9" cy="9" r="3.5" /><path d="M2 19c.7-3.4 3.7-5.5 7-5.5s6.3 2.1 7 5.5" /><circle cx="17" cy="8" r="2.5" /><path d="M16.5 13c2.5 0 4.5 1.5 5.2 4" /></>} />
const IcTrending = (p: IconProps) => <Icon {...p} d={<><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></>} />
const IcFilm = (p: IconProps) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16" /><path d="M17 4v16" /><path d="M3 9h4" /><path d="M3 15h4" /><path d="M17 9h4" /><path d="M17 15h4" /></>} />
const IcPlay = (p: IconProps) => <Icon {...p} stroke={0} d={<path d="M7 5v14l12-7z" fill="currentColor" />} />
const IcDot = (p: IconProps) => <Icon {...p} d={<circle cx="12" cy="12" r="4" fill="currentColor" />} />
const IcCog = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>} />
const IcShare = (p: IconProps) => <Icon {...p} d={<><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.5 10.5 15.5 7" /><path d="M8.5 13.5 15.5 17" /></>} />
const IcThumbUp = (p: IconProps) => <Icon {...p} d={<><path d="M7 11v9H4v-9z" /><path d="M7 11 11 3a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" /></>} />
const IcDownload = (p: IconProps) => <Icon {...p} d={<><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>} />
const IcSave = (p: IconProps) => <Icon {...p} d={<><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v6h7V4" /></>} />
const IcSparkles = (p: IconProps) => <Icon {...p} d={<><path d="M12 3v4" /><path d="M12 17v4" /><path d="M5 12H1" /><path d="M23 12h-4" /><path d="M5.6 5.6 8 8" /><path d="M16 16l2.4 2.4" /><path d="M5.6 18.4 8 16" /><path d="M16 8l2.4-2.4" /></>} />
const IcBookmark = (p: IconProps) => <Icon {...p} d={<path d="M6 4v17l6-4 6 4V4z" />} />
const IcEye = (p: IconProps) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>} />

const IcRotom = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 3 4 7v6c0 4.5 3.5 7.5 8 8 4.5-.5 8-3.5 8-8V7z" fill="currentColor" opacity="0.18" />
    <path d="M12 3 4 7v6c0 4.5 3.5 7.5 8 8 4.5-.5 8-3.5 8-8V7z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="9.5" cy="11" r="1.3" fill="currentColor" />
    <circle cx="14.5" cy="11" r="1.3" fill="currentColor" />
    <path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * Icon registry. Reference by literal key (`<I.home />`) or drive a nav config
 * with a string key (`const Glyph = I[item.icon]`) — never a dynamic class.
 */
export const I = {
  home: IcHome,
  compass: IcCompass,
  live: IcLive,
  lib: IcLib,
  clock: IcClock,
  heart: IcHeart,
  flame: IcFlame,
  search: IcSearch,
  bell: IcBell,
  plus: IcPlus,
  chat: IcChat,
  chevron: IcChevron,
  check: IcCheck,
  menu: IcMenu,
  gamepad: IcGamepad,
  users: IcUsers,
  trending: IcTrending,
  film: IcFilm,
  play: IcPlay,
  dot: IcDot,
  cog: IcCog,
  share: IcShare,
  thumbUp: IcThumbUp,
  download: IcDownload,
  save: IcSave,
  sparkles: IcSparkles,
  bookmark: IcBookmark,
  eye: IcEye,
  rotom: IcRotom,
} as const

export type IconName = keyof typeof I

export { Icon }
