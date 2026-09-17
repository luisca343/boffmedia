import * as React from "react"
import type { IconType } from "react-icons"
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowDownTray,
  HiOutlineArrowDown,
  HiOutlineArrowDownRight,
  HiOutlineArrowLeft,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineArrowUp,
  HiOutlineArrowUpRight,
  HiOutlineArrowUpTray,
  HiOutlineArchiveBox,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsRightLeft,
  HiOutlineArrowsUpDown,
  HiOutlineAtSymbol,
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineBellAlert,
  HiOutlineBellSlash,
  HiOutlineBookOpen,
  HiOutlineBookmark,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineBugAnt,
  HiOutlineBuildingLibrary,
  HiOutlineBuildingOffice,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingStorefront,
  HiOutlineCalculator,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineCalendarDays,
  HiOutlineCamera,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeft,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronUpDown,
  HiOutlineCircleStack,
  HiOutlineCodeBracket,
  HiOutlineCodeBracketSquare,
  HiOutlineCommandLine,
  HiOutlineComputerDesktop,
  HiOutlineCog6Tooth,
  HiOutlineCloud,
  HiOutlineCreditCard,
  HiOutlineCpuChip,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineDevicePhoneMobile,
  HiOutlineDocument,
  HiOutlineDocumentText,
  HiOutlineDocumentDuplicate,
  HiOutlineEllipsisVertical,
  HiOutlineEnvelope,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineFire,
  HiOutlineFaceSmile,
  HiOutlineFlag,
  HiOutlineFilm,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineForward,
  HiOutlineGift,
  HiOutlineFunnel,
  HiOutlineGlobeAlt,
  HiOutlineHandThumbUp,
  HiOutlineHashtag,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineInbox,
  HiOutlineInformationCircle,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineLockClosed,
  HiOutlineMap,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlineMicrophone,
  HiOutlineNewspaper,
  HiOutlineMagnifyingGlass,
  HiOutlineMinus,
  HiOutlineMoon,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlinePause,
  HiOutlinePencil,
  HiOutlinePhone,
  HiOutlinePhoneArrowDownLeft,
  HiOutlinePhoneArrowUpRight,
  HiOutlinePhoto,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlinePlusCircle,
  HiOutlinePrinter,
  HiOutlinePuzzlePiece,
  HiOutlineQrCode,
  HiOutlineQuestionMarkCircle,
  HiOutlineQueueList,
  HiOutlineRadio,
  HiOutlineReceiptPercent,
  HiOutlineRectangleGroup,
  HiOutlineRectangleStack,
  HiOutlineScale,
  HiOutlineShare,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSignal,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineSquare3Stack3D,
  HiOutlineStar,
  HiOutlineSun,
  HiOutlineTableCells,
  HiOutlineTag,
  HiOutlineSwatch,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineTrophy,
  HiOutlineUnderline,
  HiOutlineUserPlus,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineVideoCamera,
  HiOutlineVideoCameraSlash,
  HiOutlineViewColumns,
  HiOutlineViewfinderCircle,
  HiOutlineWallet,
  HiOutlineWifi,
  HiOutlineWrench,
  HiOutlineXMark,
} from "react-icons/hi2"
import {
  TbAccessible,
  TbAxe,
  TbAnchor,
  TbArchive,
  TbBold,
  TbBox,
  TbBoxMultiple,
  TbChartLine,
  TbCloud,
  TbCloudRain,
  TbCloudStorm,
  TbCompass,
  TbConfetti,
  TbCoins,
  TbColumns2,
  TbCrown,
  TbCurrencyDollar,
  TbDeviceFloppy,
  TbDeviceGamepad,
  TbDeviceGamepad2,
  TbDice,
  TbDots,
  TbDotsVertical,
  TbDroplet,
  TbDualScreen,
  TbEgg,
  TbFeather,
  TbFile,
  TbFileText,
  TbFilterX,
  TbGavel,
  TbGripVertical,
  TbHammer,
  TbH1,
  TbH2,
  TbHeartHandshake,
  TbHeartRateMonitor,
  TbHistory,
  TbId,
  TbItalic,
  TbKeyboard,
  TbLibrary,
  TbMedal,
  TbMicrophoneOff,
  TbNavigation,
  TbNetwork,
  TbPackage,
  TbParkingMeter,
  TbPaw,
  TbPlant,
  TbPencil,
  TbPhoneIncoming,
  TbPhoneOutgoing,
  TbPhotoPlus,
  TbPlane,
  TbPoint,
  TbQuote,
  TbReceipt,
  TbRepeat,
  TbRepeatOnce,
  TbRotate,
  TbRoute,
  TbRoulette,
  TbScan,
  TbShoe,
  TbShield,
  TbShieldCheck,
  TbShieldExclamation,
  TbSortDescending,
  TbSticker,
  TbStrikethrough,
  TbSkull,
  TbSunMoon,
  TbSunrise,
  TbSunset,
  TbSword,
  TbSwords,
  TbTable,
  TbTree,
  TbTrash,
  TbTypography,
  TbUnderline,
  TbVideoOff,
  TbVolume,
  TbVolumeOff,
  TbWalk,
  TbWand,
  TbBuildingWarehouse,
  TbWifiOff,
} from "react-icons/tb"
import { SiDiscord, SiGoogle, SiSteam, SiTwitch } from "react-icons/si"
import { cn } from "../cn"

function makeCustomIcon(content: (key: string) => React.ReactNode): IconType {
  return ({
    color = "currentColor",
    size = "1em",
    title,
    fill = "none",
    stroke = "currentColor",
    strokeWidth = 2,
    ...props
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      color={color}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {content(title ?? "icon")}
    </svg>
  )
}

const GifIcon = makeCustomIcon((key) => (
  <>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" key={`${key}-rect`} />
    <path d="M8.6 9.9H6.9a1.9 1.9 0 0 0-1.9 1.9v.4a1.9 1.9 0 0 0 1.9 1.9h1.7v-2.3H7.4" key={`${key}-g`} />
    <path d="M11.9 9.9v4.2" key={`${key}-i`} />
    <path d="M15 14.1V9.9h3.1M15 11.9h2.5" key={`${key}-f`} />
  </>
))

const MarsIcon = makeCustomIcon((key) => (
  <>
    <circle cx="9" cy="15" r="6" key={`${key}-circle`} />
    <line x1="13.4" y1="10.6" x2="20" y2="4" key={`${key}-line`} />
    <polyline points="14 4 20 4 20 10" key={`${key}-polyline`} />
  </>
))

const VenusIcon = makeCustomIcon((key) => (
  <>
    <circle cx="12" cy="9" r="6" key={`${key}-circle`} />
    <line x1="12" y1="15" x2="12" y2="21" key={`${key}-line`} />
    <line x1="8" y1="18" x2="16" y2="18" key={`${key}-cross`} />
  </>
))

const NeuterIcon = makeCustomIcon((key) => (
  <>
    <circle cx="12" cy="10" r="6" key={`${key}-circle`} />
    <line x1="12" y1="16" x2="12" y2="20" key={`${key}-line`} />
  </>
))

const RotomIcon = makeCustomIcon((key) => (
  <>
    <circle cx="12" cy="9.6" r="4.2" key={`${key}-head`} />
    <path d="M11.1 5.8C10.6 4 11 2.2 12.2 1.5C13.2 2.6 13.3 4.4 12.8 5.9" key={`${key}-spark`} />
    <path d="M11.1 13.7L12 17L12.9 13.7" key={`${key}-tail`} />
    <polyline points="7.7 10.6 3.4 10.4 6.6 13.4 2.6 17.6" key={`${key}-arm-left`} />
    <polyline points="16.3 10.6 20.6 10.4 17.4 13.4 21.4 17.6" key={`${key}-arm-right`} />
    <circle cx="10.4" cy="8.9" r="0.95" key={`${key}-eye-left`} />
    <circle cx="13.6" cy="8.9" r="0.95" key={`${key}-eye-right`} />
    <path d="M11 11.6Q12 12.3 13 11.6" key={`${key}-mouth`} />
  </>
))

const ICONS = {
  arrow: HiOutlineArrowRight,
  back: HiOutlineArrowLeft,
  home: HiOutlineHome,
  search: HiOutlineMagnifyingGlass,
  bell: HiOutlineBell,
  user: HiOutlineUser,
  users: HiOutlineUsers,
  sun: HiOutlineSun,
  moon: HiOutlineMoon,
  gamepad: TbDeviceGamepad,
  handheld: TbDeviceGamepad2,
  dualscreen: TbDualScreen,
  trophy: HiOutlineTrophy,
  calc: HiOutlineCalculator,
  sword: TbSword,
  tree: TbTree,
  chart: HiOutlineChartBar,
  trending: HiOutlineArrowTrendingUp,
  cards: HiOutlineRectangleStack,
  mail: HiOutlineEnvelope,
  calendar: HiOutlineCalendarDays,
  wrench: HiOutlineWrench,
  shield: TbShield,
  settings: HiOutlineCog6Tooth,
  bolt: HiOutlineBolt,
  flame: HiOutlineFire,
  target: HiOutlineViewfinderCircle,
  star: HiOutlineStar,
  check: HiOutlineCheck,
  x: HiOutlineXMark,
  plus: HiOutlinePlus,
  minus: HiOutlineMinus,
  edit: HiOutlinePencil,
  trash: HiOutlineTrash,
  eye: HiOutlineEye,
  link: HiOutlineLink,
  copy: HiOutlineDocumentDuplicate,
  chevronDown: HiOutlineChevronDown,
  chevronRight: HiOutlineChevronRight,
  collapse: HiOutlineArrowsPointingIn,
  list: HiOutlineQueueList,
  menu: HiOutlineBars3,
  grid: HiOutlineSquares2X2,
  filter: HiOutlineFunnel,
  clock: HiOutlineClock,
  info: HiOutlineInformationCircle,
  alert: HiOutlineExclamationTriangle,
  flag: HiOutlineFlag,
  tag: HiOutlineTag,
  axe: TbAxe,
  puzzle: HiOutlinePuzzlePiece,
  play: HiOutlinePlay,
  download: HiOutlineArrowDownTray,
  external: HiOutlineArrowTopRightOnSquare,
  key: HiOutlineKey,
  gift: HiOutlineGift,
  hammer: TbHammer,
  zap: HiOutlineBolt,
  database: HiOutlineCircleStack,
  layers: HiOutlineSquare3Stack3D,
  sliders: HiOutlineAdjustmentsHorizontal,
  cog: HiOutlineCog6Tooth,
  refresh: HiOutlineArrowPath,
  book: HiOutlineBookOpen,
  globe: HiOutlineGlobeAlt,
  message: HiOutlineChatBubbleLeft,
  swatch: HiOutlineSwatch,
  sparkles: HiOutlineSparkles,
  inbox: HiOutlineInbox,
  code: HiOutlineCodeBracket,
  bookmark: HiOutlineBookmark,
  chevron: HiOutlineChevronDown,
  lock: HiOutlineLockClosed,
  heart: HiOutlineHeart,
  reply: HiOutlineArrowUturnLeft,
  paw: TbPaw,
  drop: TbDroplet,
  crosshair: HiOutlineViewfinderCircle,
  map: HiOutlineMap,
  skull: TbSkull,
  chain: HiOutlineLink,
  compass: TbCompass,
  dice: TbDice,
  discord: SiDiscord,
  google: SiGoogle,
  wheel: TbRoulette,
  steam: SiSteam,
  twitch: SiTwitch,
  camera: HiOutlineCamera,
  logout: HiOutlineArrowRightOnRectangle,
  fullscreen: HiOutlineArrowsPointingOut,
  exitFullscreen: HiOutlineArrowsPointingIn,
  pause: HiOutlinePause,
  swap: HiOutlineArrowsRightLeft,
  cube: HiOutlineCube,
  folder: HiOutlineFolder,
  folderOpen: HiOutlineFolderOpen,
  upload: HiOutlineArrowUpTray,
  server: HiOutlineServer,
  more: HiOutlineEllipsisVertical,
  volume: HiOutlineSpeakerWave,
  mute: HiOutlineSpeakerXMark,
  skip: HiOutlineForward,

  // Extended shared vocabulary. Heroicons 2 is preferred whenever it has a
  // semantic match; Tabler fills the small domain/editor gaps.
  accessibility: TbAccessible,
  alertCircle: HiOutlineExclamationCircle,
  alertTriangle: HiOutlineExclamationTriangle,
  anchor: TbAnchor,
  archive: HiOutlineArchiveBox,
  arrowDown: HiOutlineArrowDown,
  arrowDownRight: HiOutlineArrowDownRight,
  arrowDownWideNarrow: TbSortDescending,
  arrowLeft: HiOutlineArrowLeft,
  arrowLeftRight: HiOutlineArrowsRightLeft,
  arrowRight: HiOutlineArrowRight,
  arrowUp: HiOutlineArrowUp,
  arrowUpDown: HiOutlineArrowsUpDown,
  arrowUpRight: HiOutlineArrowUpRight,
  atSign: HiOutlineAtSymbol,
  award: TbMedal,
  badgeCheck: HiOutlineCheckBadge,
  barChart2: HiOutlineChartBar,
  barChart3: HiOutlineChartBar,
  bellOff: HiOutlineBellSlash,
  bellRing: HiOutlineBellAlert,
  bold: TbBold,
  bot: HiOutlineCpuChip,
  box: TbBox,
  boxes: TbBoxMultiple,
  briefcase: HiOutlineBriefcase,
  bug: HiOutlineBugAnt,
  building: HiOutlineBuildingOffice,
  building2: HiOutlineBuildingOffice2,
  calendarDays: HiOutlineCalendarDays,
  checkCheck: HiOutlineCheck,
  chevronLeft: HiOutlineChevronLeft,
  chevronsUpDown: HiOutlineChevronUpDown,
  circleCheck: HiOutlineCheckCircle,
  circlePlus: HiOutlinePlusCircle,
  cloud: HiOutlineCloud,
  cloudLightning: TbCloudStorm,
  cloudRain: TbCloudRain,
  codeBracketSquare: HiOutlineCodeBracketSquare,
  coins: TbCoins,
  columns2: TbColumns2,
  command: HiOutlineCommandLine,
  computerDesktop: HiOutlineComputerDesktop,
  cpu: HiOutlineCpuChip,
  creditCard: HiOutlineCreditCard,
  crown: TbCrown,
  dollarSign: HiOutlineCurrencyDollar,
  dot: TbPoint,
  egg: TbEgg,
  eyeOff: HiOutlineEyeSlash,
  feather: TbFeather,
  file: HiOutlineDocument,
  fileText: HiOutlineDocumentText,
  film: HiOutlineFilm,
  filterX: TbFilterX,
  flashlight: HiOutlineBolt,
  flashlightOff: HiOutlineBolt,
  footprints: TbShoe,
  gamepad2: TbDeviceGamepad2,
  gavel: TbGavel,
  grip: TbGripVertical,
  handshake: TbHeartHandshake,
  hash: HiOutlineHashtag,
  heading1: TbH1,
  heading2: TbH2,
  heartPulse: TbHeartRateMonitor,
  helpCircle: HiOutlineQuestionMarkCircle,
  history: TbHistory,
  idCard: HiOutlineIdentification,
  image: HiOutlinePhoto,
  imagePlus: TbPhotoPlus,
  italic: TbItalic,
  joystick: TbDeviceGamepad,
  keyboard: TbKeyboard,
  landmark: HiOutlineBuildingLibrary,
  layersIcon: HiOutlineSquare3Stack3D,
  layoutGrid: HiOutlineSquares2X2,
  library: TbLibrary,
  lineChart: TbChartLine,
  link2: HiOutlineLink,
  listChecks: HiOutlineQueueList,
  listFilter: HiOutlineFunnel,
  listOrdered: HiOutlineQueueList,
  loader: HiOutlineArrowPath,
  login: HiOutlineArrowLeftOnRectangle,
  mapPin: HiOutlineMapPin,
  medal: TbMedal,
  megaphone: HiOutlineMegaphone,
  messageCircle: HiOutlineChatBubbleLeft,
  mic: HiOutlineMicrophone,
  micOff: TbMicrophoneOff,
  minimize: HiOutlineArrowsPointingIn,
  maximize: HiOutlineArrowsPointingOut,
  monitor: HiOutlineComputerDesktop,
  moreHorizontal: TbDots,
  moreVertical: TbDotsVertical,
  navigation: TbNavigation,
  network: TbNetwork,
  newspaper: HiOutlineNewspaper,
  package: TbPackage,
  palette: HiOutlineSwatch,
  panelsTopLeft: HiOutlineRectangleGroup,
  paperclip: HiOutlinePaperClip,
  parkingMeter: TbParkingMeter,
  partyPopper: TbConfetti,
  penLine: HiOutlinePencil,
  personStanding: TbWalk,
  phone: HiOutlinePhone,
  phoneIncoming: TbPhoneIncoming,
  phoneOutgoing: TbPhoneOutgoing,
  pin: HiOutlineMapPin,
  plane: TbPlane,
  printer: HiOutlinePrinter,
  qrCode: HiOutlineQrCode,
  quote: TbQuote,
  radio: HiOutlineRadio,
  receipt: HiOutlineReceiptPercent,
  redo: HiOutlineArrowUturnRight,
  repeat: TbRepeat,
  repeat2: TbRepeatOnce,
  rotate: TbRotate,
  route: TbRoute,
  save: TbDeviceFloppy,
  scale: HiOutlineScale,
  scanLine: TbScan,
  scroll: TbFileText,
  send: HiOutlinePaperAirplane,
  share2: HiOutlineShare,
  shieldAlert: HiOutlineShieldExclamation,
  shieldCheck: HiOutlineShieldCheck,
  shoppingBag: HiOutlineShoppingBag,
  shoppingCart: HiOutlineShoppingCart,
  signal: HiOutlineSignal,
  slidersVertical: HiOutlineAdjustmentsHorizontal,
  smartphone: HiOutlineDevicePhoneMobile,
  smile: HiOutlineFaceSmile,
  sparkle: HiOutlineSparkles,
  squareCode: HiOutlineCodeBracketSquare,
  squarePen: HiOutlinePencil,
  sticker: TbSticker,
  store: HiOutlineBuildingStorefront,
  strikethrough: TbStrikethrough,
  sunMoon: TbSunMoon,
  sunrise: TbSunrise,
  sunset: TbSunset,
  swords: TbSwords,
  table: HiOutlineTableCells,
  thumbsUp: HiOutlineHandThumbUp,
  trash2: HiOutlineTrash,
  trendingDown: HiOutlineArrowTrendingDown,
  triangleAlert: HiOutlineExclamationTriangle,
  typography: TbTypography,
  underline: HiOutlineUnderline,
  userPlus: HiOutlineUserPlus,
  video: HiOutlineVideoCamera,
  videoOff: HiOutlineVideoCameraSlash,
  volume2: HiOutlineSpeakerWave,
  volumeX: HiOutlineSpeakerXMark,
  wallet: HiOutlineWallet,
  wand: TbWand,
  warehouse: TbBuildingWarehouse,
  wifi: HiOutlineWifi,
  wifiOff: TbWifiOff,
  sprout: TbPlant,
  gif: GifIcon,
  mars: MarsIcon,
  venus: VenusIcon,
  neuter: NeuterIcon,
  rotom: RotomIcon,
} satisfies Record<string, IconType>

/** Every valid icon name — use this to type icon fields so typos fail at compile time. */
export type IconName = keyof typeof ICONS

/** Runtime check for names that only exist as strings at compile time. */
export function isIconName(value: string): value is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, value)
}

export interface IconProps
  extends Omit<
    React.SVGProps<SVGSVGElement>,
    "fill" | "name" | "stroke" | "strokeWidth" | "width" | "height"
  > {
  name: IconName
  size?: number | string
  color?: string
  fill?: boolean | string
  filled?: boolean
  stroke?: string
  strokeWidth?: number | string
  title?: string
}

export function Icon({
  name,
  size = 18,
  className,
  style,
  color,
  fill,
  filled,
  stroke,
  strokeWidth,
  title,
  ...rest
}: IconProps) {
  const Glyph = ICONS[name] || ICONS.info
  const resolvedFill = filled ?? fill
  const fillAttribute = typeof resolvedFill === "boolean"
    ? resolvedFill ? "currentColor" : "none"
    : resolvedFill
  const strokeAttribute = typeof resolvedFill === "boolean"
    ? resolvedFill ? "none" : "currentColor"
    : stroke

  const glyphProps = {
    size,
    color,
    className: cn("shrink-0", className),
    style,
    focusable: "false" as const,
    title,
    ...rest,
    ...(fillAttribute !== undefined ? { fill: fillAttribute } : {}),
    ...(strokeAttribute !== undefined ? { stroke: strokeAttribute } : {}),
    ...(strokeWidth !== undefined ? { strokeWidth } : {}),
  }

  return <Glyph {...glyphProps} aria-hidden={title ? undefined : "true"} />
}

export const ICON_NAMES = Object.keys(ICONS) as IconName[]

/**
 * Compatibility factory for consumers that used to import individual Lucide
 * components. The component still resolves through the registry above, so the
 * source library can be changed once without touching feature code again.
 */
export type IconGlyph = IconType

export function makeRegistryIcon(name: IconName): IconType {
  return (props) => <Icon {...props} name={name} />
}

export const Accessibility = makeRegistryIcon("accessibility")
export const AlertCircle = makeRegistryIcon("alertCircle")
export const AlertTriangle = makeRegistryIcon("alertTriangle")
export const Anchor = makeRegistryIcon("anchor")
export const Archive = makeRegistryIcon("archive")
export const ArrowDown = makeRegistryIcon("arrowDown")
export const ArrowDownRight = makeRegistryIcon("arrowDownRight")
export const ArrowDownWideNarrow = makeRegistryIcon("arrowDownWideNarrow")
export const ArrowLeft = makeRegistryIcon("arrowLeft")
export const ArrowLeftIcon = makeRegistryIcon("arrowLeft")
export const ArrowLeftRight = makeRegistryIcon("arrowLeftRight")
export const ArrowRight = makeRegistryIcon("arrowRight")
export const ArrowRightIcon = makeRegistryIcon("arrowRight")
export const ArrowUp = makeRegistryIcon("arrowUp")
export const ArrowUpDown = makeRegistryIcon("arrowUpDown")
export const ArrowUpRight = makeRegistryIcon("arrowUpRight")
export const ArrowUpRightIcon = makeRegistryIcon("arrowUpRight")
export const AtSign = makeRegistryIcon("atSign")
export const Award = makeRegistryIcon("award")
export const BadgeCheck = makeRegistryIcon("badgeCheck")
export const BarChart2 = makeRegistryIcon("barChart2")
export const BarChart3 = makeRegistryIcon("barChart3")
export const Bell = makeRegistryIcon("bell")
export const BellOff = makeRegistryIcon("bellOff")
export const BellRing = makeRegistryIcon("bellRing")
export const Bold = makeRegistryIcon("bold")
export const Book = makeRegistryIcon("book")
export const Bookmark = makeRegistryIcon("bookmark")
export const BookmarkIcon = makeRegistryIcon("bookmark")
export const BookOpen = makeRegistryIcon("book")
export const BookOpenIcon = makeRegistryIcon("book")
export const Bot = makeRegistryIcon("bot")
export const Box = makeRegistryIcon("box")
export const Boxes = makeRegistryIcon("boxes")
export const Briefcase = makeRegistryIcon("briefcase")
export const Bug = makeRegistryIcon("bug")
export const Building = makeRegistryIcon("building")
export const Building2 = makeRegistryIcon("building2")
export const Calendar = makeRegistryIcon("calendar")
export const CalendarDays = makeRegistryIcon("calendarDays")
export const Camera = makeRegistryIcon("camera")
export const Check = makeRegistryIcon("check")
export const CheckCheck = makeRegistryIcon("checkCheck")
export const ChevronDown = makeRegistryIcon("chevronDown")
export const ChevronDownIcon = makeRegistryIcon("chevronDown")
export const ChevronLeft = makeRegistryIcon("chevronLeft")
export const ChevronLeftIcon = makeRegistryIcon("chevronLeft")
export const ChevronRight = makeRegistryIcon("chevronRight")
export const ChevronRightIcon = makeRegistryIcon("chevronRight")
export const ChevronsUpDown = makeRegistryIcon("chevronsUpDown")
export const CircleCheck = makeRegistryIcon("circleCheck")
export const CirclePlus = makeRegistryIcon("circlePlus")
export const ClockIcon = makeRegistryIcon("clock")
export const Cloud = makeRegistryIcon("cloud")
export const CloudLightning = makeRegistryIcon("cloudLightning")
export const CloudRain = makeRegistryIcon("cloudRain")
export const Code = makeRegistryIcon("code")
export const Cog = makeRegistryIcon("cog")
export const Coins = makeRegistryIcon("coins")
export const Columns2 = makeRegistryIcon("columns2")
export const Command = makeRegistryIcon("command")
export const Compass = makeRegistryIcon("compass")
export const CompassIcon = makeRegistryIcon("compass")
export const Copy = makeRegistryIcon("copy")
export const Cpu = makeRegistryIcon("cpu")
export const CreditCard = makeRegistryIcon("creditCard")
export const Crosshair = makeRegistryIcon("crosshair")
export const Crown = makeRegistryIcon("crown")
export const DollarSign = makeRegistryIcon("dollarSign")
export const Dot = makeRegistryIcon("dot")
export const Download = makeRegistryIcon("download")
export const Egg = makeRegistryIcon("egg")
export const Eye = makeRegistryIcon("eye")
export const EyeOff = makeRegistryIcon("eyeOff")
export const ExternalLink = makeRegistryIcon("external")
export const Feather = makeRegistryIcon("feather")
export const File = makeRegistryIcon("file")
export const FileText = makeRegistryIcon("fileText")
export const Film = makeRegistryIcon("film")
export const Filter = makeRegistryIcon("filter")
export const FilterIcon = makeRegistryIcon("filter")
export const FilterX = makeRegistryIcon("filterX")
export const Flag = makeRegistryIcon("flag")
export const Flame = makeRegistryIcon("flame")
export const Flashlight = makeRegistryIcon("flashlight")
export const FlashlightOff = makeRegistryIcon("flashlightOff")
export const Folder = makeRegistryIcon("folder")
export const FolderOpen = makeRegistryIcon("folderOpen")
export const Footprints = makeRegistryIcon("footprints")
export const Forward = makeRegistryIcon("skip")
export const Gamepad2 = makeRegistryIcon("gamepad2")
export const Gif = makeRegistryIcon("gif")
export const Gavel = makeRegistryIcon("gavel")
export const Gift = makeRegistryIcon("gift")
export const Globe = makeRegistryIcon("globe")
export const Grid2x2 = makeRegistryIcon("grid")
export const Grip = makeRegistryIcon("grip")
export const Hammer = makeRegistryIcon("hammer")
export const Handshake = makeRegistryIcon("handshake")
export const Hash = makeRegistryIcon("hash")
export const Heading1 = makeRegistryIcon("heading1")
export const Heading2 = makeRegistryIcon("heading2")
export const Heart = makeRegistryIcon("heart")
export const HeartPulse = makeRegistryIcon("heartPulse")
export const HelpCircle = makeRegistryIcon("helpCircle")
export const History = makeRegistryIcon("history")
export const Home = makeRegistryIcon("home")
export const HomeIcon = makeRegistryIcon("home")
export const House = makeRegistryIcon("home")
export const IdCard = makeRegistryIcon("idCard")
export const Image = makeRegistryIcon("image")
export const ImagePlus = makeRegistryIcon("imagePlus")
export const Inbox = makeRegistryIcon("inbox")
export const Info = makeRegistryIcon("info")
export const InfoIcon = makeRegistryIcon("info")
export const Italic = makeRegistryIcon("italic")
export const Joystick = makeRegistryIcon("joystick")
export const Key = makeRegistryIcon("key")
export const Keyboard = makeRegistryIcon("keyboard")
export const Landmark = makeRegistryIcon("landmark")
export const Layers = makeRegistryIcon("layers")
export const LayersIcon = makeRegistryIcon("layersIcon")
export const LayoutGrid = makeRegistryIcon("layoutGrid")
export const Library = makeRegistryIcon("library")
export const LineChart = makeRegistryIcon("lineChart")
export const Link = makeRegistryIcon("link")
export const Link2 = makeRegistryIcon("link2")
export const List = makeRegistryIcon("list")
export const ListChecks = makeRegistryIcon("listChecks")
export const ListFilter = makeRegistryIcon("listFilter")
export const ListOrdered = makeRegistryIcon("listOrdered")
export const Loader2 = makeRegistryIcon("loader")
export const Lock = makeRegistryIcon("lock")
export const LockIcon = makeRegistryIcon("lock")
export const LogIn = makeRegistryIcon("login")
export const LogOut = makeRegistryIcon("logout")
export const Mail = makeRegistryIcon("mail")
export const Mars = makeRegistryIcon("mars")
export const Map = makeRegistryIcon("map")
export const MapIcon = makeRegistryIcon("map")
export const MapPin = makeRegistryIcon("mapPin")
export const MapPinIcon = makeRegistryIcon("mapPin")
export const Maximize2 = makeRegistryIcon("maximize")
export const Maximize2Icon = makeRegistryIcon("maximize")
export const Medal = makeRegistryIcon("medal")
export const Megaphone = makeRegistryIcon("megaphone")
export const MenuIcon = makeRegistryIcon("menu")
export const MessageCircle = makeRegistryIcon("messageCircle")
export const Mic = makeRegistryIcon("mic")
export const MicIcon = makeRegistryIcon("mic")
export const MicOff = makeRegistryIcon("micOff")
export const Minimize2 = makeRegistryIcon("minimize")
export const Minimize2Icon = makeRegistryIcon("minimize")
export const Minus = makeRegistryIcon("minus")
export const Monitor = makeRegistryIcon("monitor")
export const Moon = makeRegistryIcon("moon")
export const MoreHorizontal = makeRegistryIcon("moreHorizontal")
export const MoreVertical = makeRegistryIcon("moreVertical")
export const Navigation = makeRegistryIcon("navigation")
export const Network = makeRegistryIcon("network")
export const Newspaper = makeRegistryIcon("newspaper")
export const Package = makeRegistryIcon("package")
export const Palette = makeRegistryIcon("palette")
export const PanelsTopLeft = makeRegistryIcon("panelsTopLeft")
export const Paperclip = makeRegistryIcon("paperclip")
export const ParkingMeter = makeRegistryIcon("parkingMeter")
export const PartyPopper = makeRegistryIcon("partyPopper")
export const Pencil = makeRegistryIcon("edit")
export const PenLine = makeRegistryIcon("penLine")
export const PersonStanding = makeRegistryIcon("personStanding")
export const Phone = makeRegistryIcon("phone")
export const PhoneIcon = makeRegistryIcon("phone")
export const PhoneIncoming = makeRegistryIcon("phoneIncoming")
export const PhoneOutgoing = makeRegistryIcon("phoneOutgoing")
export const Pin = makeRegistryIcon("pin")
export const Plane = makeRegistryIcon("plane")
export const Play = makeRegistryIcon("play")
export const Plus = makeRegistryIcon("plus")
export const Printer = makeRegistryIcon("printer")
export const QrCode = makeRegistryIcon("qrCode")
export const Quote = makeRegistryIcon("quote")
export const Radio = makeRegistryIcon("radio")
export const Receipt = makeRegistryIcon("receipt")
export const Redo2 = makeRegistryIcon("redo")
export const RefreshCcw = makeRegistryIcon("refresh")
export const RefreshCw = makeRegistryIcon("refresh")
export const RefreshCwIcon = makeRegistryIcon("refresh")
export const Repeat = makeRegistryIcon("repeat")
export const Repeat2 = makeRegistryIcon("repeat2")
export const Reply = makeRegistryIcon("reply")
export const ReplyAll = makeRegistryIcon("reply")
export const RotateCcw = makeRegistryIcon("rotate")
export const Rotom = makeRegistryIcon("rotom")
export const Route = makeRegistryIcon("route")
export const Save = makeRegistryIcon("save")
export const Scale = makeRegistryIcon("scale")
export const ScaleIcon = makeRegistryIcon("scale")
export const ScanLine = makeRegistryIcon("scanLine")
export const Scroll = makeRegistryIcon("scroll")
export const Skull = makeRegistryIcon("skull")
export const Search = makeRegistryIcon("search")
export const SearchIcon = makeRegistryIcon("search")
export const Send = makeRegistryIcon("send")
export const Server = makeRegistryIcon("server")
export const Settings = makeRegistryIcon("settings")
export const SettingsIcon = makeRegistryIcon("settings")
export const Share2 = makeRegistryIcon("share2")
export const Shield = makeRegistryIcon("shield")
export const ShieldAlert = makeRegistryIcon("shieldAlert")
export const ShieldCheck = makeRegistryIcon("shieldCheck")
export const ShieldOff = makeRegistryIcon("shield")
export const ShoppingBag = makeRegistryIcon("shoppingBag")
export const ShoppingCart = makeRegistryIcon("shoppingCart")
export const Signal = makeRegistryIcon("signal")
export const SlidersVertical = makeRegistryIcon("slidersVertical")
export const Smartphone = makeRegistryIcon("smartphone")
export const Smile = makeRegistryIcon("smile")
export const Sparkle = makeRegistryIcon("sparkle")
export const Sparkles = makeRegistryIcon("sparkles")
export const SparklesIcon = makeRegistryIcon("sparkles")
export const SquareCode = makeRegistryIcon("squareCode")
export const SquarePen = makeRegistryIcon("edit")
export const Star = makeRegistryIcon("star")
export const StarIcon = makeRegistryIcon("star")
export const Sticker = makeRegistryIcon("sticker")
export const Store = makeRegistryIcon("store")
export const Sprout = makeRegistryIcon("sprout")
export const Strikethrough = makeRegistryIcon("strikethrough")
export const Sun = makeRegistryIcon("sun")
export const SunMoon = makeRegistryIcon("sunMoon")
export const Sunrise = makeRegistryIcon("sunrise")
export const Sunset = makeRegistryIcon("sunset")
export const Sword = makeRegistryIcon("sword")
export const Swords = makeRegistryIcon("swords")
export const TableIcon = makeRegistryIcon("table")
export const Tag = makeRegistryIcon("tag")
export const Target = makeRegistryIcon("target")
export const ThumbsUp = makeRegistryIcon("thumbsUp")
export const Trash2 = makeRegistryIcon("trash2")
export const TrendingDown = makeRegistryIcon("trendingDown")
export const TrendingUp = makeRegistryIcon("trending")
export const TriangleAlert = makeRegistryIcon("triangleAlert")
export const Trophy = makeRegistryIcon("trophy")
export const TrophyIcon = makeRegistryIcon("trophy")
export const Type = makeRegistryIcon("typography")
export const Underline = makeRegistryIcon("underline")
export const Undo2 = makeRegistryIcon("reply")
export const User = makeRegistryIcon("user")
export const UserPlus = makeRegistryIcon("userPlus")
export const Users = makeRegistryIcon("users")
export const Video = makeRegistryIcon("video")
export const VideoIcon = makeRegistryIcon("video")
export const VideoOff = makeRegistryIcon("videoOff")
export const Venus = makeRegistryIcon("venus")
export const Volume2 = makeRegistryIcon("volume2")
export const Volume2Icon = makeRegistryIcon("volume2")
export const VolumeX = makeRegistryIcon("volumeX")
export const Wallet = makeRegistryIcon("wallet")
export const Wand2 = makeRegistryIcon("wand")
export const Warehouse = makeRegistryIcon("warehouse")
export const Wifi = makeRegistryIcon("wifi")
export const WifiOff = makeRegistryIcon("wifiOff")
export const Neuter = makeRegistryIcon("neuter")
export const X = makeRegistryIcon("x")
export const Zap = makeRegistryIcon("zap")
export const ZapIcon = makeRegistryIcon("zap")
