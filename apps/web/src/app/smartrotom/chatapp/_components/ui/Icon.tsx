import type { CSSProperties } from "react";
import {
  Search,
  Plus,
  Phone,
  Video,
  X,
  Send,
  Paperclip,
  Smile,
  Mic,
  Image,
  File,
  Pin,
  MapPin,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  Check,
  CheckCheck,
  BellOff,
  Bell,
  Sparkles,
  Clock,
  Reply,
  Forward,
  Copy,
  Trash2,
  Star,
  Users,
  Info,
  Download,
  Play,
  Settings,
  Sticker,
  Bot,
  Zap,
  Heart,
  Archive,
  Lock,
  SquarePen,
  MessageCircle,
  Inbox,
  Volume2,
  Eye,
  Camera,
  Box,
  MicOff,
  VideoOff,
  VolumeX,
  UserPlus,
  Maximize2,
  Minimize2,
  Server,
  Sword,
  Trophy,
  Newspaper,
  Gamepad2,
  PhoneOutgoing,
  PhoneIncoming,
  Grip,
  type LucideIcon,
} from "lucide-react";

/** Lucide-react placeholders standing in for the hand-drawn path map this replaced. */
const MAP = {
  search: Search,
  plus: Plus,
  phone: Phone,
  video: Video,
  x: X,
  send: Send,
  paperclip: Paperclip,
  smile: Smile,
  mic: Mic,
  image: Image,
  file: File,
  pin: Pin,
  mappin: MapPin,
  more: MoreVertical,
  chevdown: ChevronDown,
  chevleft: ChevronLeft,
  arrowleft: ArrowLeft,
  check: Check,
  checks: CheckCheck,
  belloff: BellOff,
  bell: Bell,
  sparkles: Sparkles,
  clock: Clock,
  reply: Reply,
  forward: Forward,
  copy: Copy,
  trash: Trash2,
  star: Star,
  users: Users,
  info: Info,
  download: Download,
  play: Play,
  settings: Settings,
  sticker: Sticker,
  bot: Bot,
  zap: Zap,
  heart: Heart,
  archive: Archive,
  lock: Lock,
  edit: SquarePen,
  message: MessageCircle,
  inbox: Inbox,
  volume: Volume2,
  eye: Eye,
  camera: Camera,
  cube: Box,
  micoff: MicOff,
  videooff: VideoOff,
  volumex: VolumeX,
  userplus: UserPlus,
  maximize: Maximize2,
  minimize: Minimize2,
  server: Server,
  sword: Sword,
  trophy: Trophy,
  newspaper: Newspaper,
  gamepad: Gamepad2,
  callup: PhoneOutgoing,
  calldown: PhoneIncoming,
  grip: Grip,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  fill = "none",
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Glyph = MAP[name];
  if (!Glyph) return null;
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      fill={fill}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  );
}
