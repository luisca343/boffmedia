import type { CSSProperties } from "react"
import {
  Home,
  Map,
  MapPin,
  Landmark,
  Layers,
  Gavel,
  History,
  FileText,
  TriangleAlert,
  Shield,
  ShieldAlert,
  Star,
  DollarSign,
  Coins,
  Scale,
  Folder,
  Users,
  BadgeCheck,
  Megaphone,
  Calendar,
  List,
  Command,
  Search,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Check,
  CircleCheck,
  Bell,
  Clock,
  Trash2,
  Filter,
  Crosshair,
  Eye,
  Zap,
  Flame,
  Pin,
  Send,
  Building2,
  Signal,
  TrendingUp,
  TrendingDown,
  Download,
  ExternalLink,
  Printer,
  Hammer,
  Scroll,
  Lock,
  Award,
  Briefcase,
  Receipt,
  Server,
  Smartphone,
  Store,
  Sprout,
  type LucideIcon,
} from "lucide-react"

// The whole icon set — lucide-react placeholders standing in for the hand-drawn path
// map this replaced. See the migration ledger for fidelity notes.
const MAP = {
  // nav + civic
  home: Home,
  map: Map,
  mapPin: MapPin,
  landmark: Landmark,
  layers: Layers,
  gavel: Gavel,
  history: History,
  fileText: FileText,
  alert: TriangleAlert,
  shield: Shield,
  shieldAlert: ShieldAlert,
  star: Star,
  dollar: DollarSign,
  coins: Coins,
  scale: Scale,
  folder: Folder,
  users: Users,
  badge: BadgeCheck,
  megaphone: Megaphone,
  calendar: Calendar,
  list: List,
  command: Command,

  // ui
  search: Search,
  x: X,
  plus: Plus,
  minus: Minus,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  refresh: RefreshCw,
  check: Check,
  checkCircle: CircleCheck,
  bell: Bell,
  clock: Clock,
  trash: Trash2,
  filter: Filter,
  crosshair: Crosshair,
  eye: Eye,
  zap: Zap,
  flame: Flame,
  pin: Pin,
  send: Send,
  building: Building2,
  signal: Signal,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  download: Download,
  external: ExternalLink,
  printer: Printer,
  hammer: Hammer,
  scroll: Scroll,
  lock: Lock,
  award: Award,
  briefcase: Briefcase,
  receipt: Receipt,
  server: Server,
  smartphone: Smartphone,
  store: Store,
  sprout: Sprout,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

export function Icon({
  name,
  size = 18,
  stroke = 1.9,
  className,
  style,
  fill = "none",
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
  style?: CSSProperties
  fill?: string
}) {
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
