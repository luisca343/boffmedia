import { makeGlyphIcon, type GlyphIconProps } from "@/components/smartrotom/behavior/makeIconComponent";
import {
  Home,
  CreditCard,
  List,
  Send,
  Receipt,
  LineChart,
  Calendar,
  Search,
  Bell,
  Settings,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  QrCode,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  X,
  Check,
  Shield,
  Sparkles,
  Zap,
  ShoppingBag,
  Heart,
  Trophy,
  Gift,
  User,
  ShieldCheck,
  Info,
  TriangleAlert,
  Copy,
  Eye,
  EyeOff,
  Bot,
  Download,
  ScanLine,
  Menu,
  Pencil,
  ImagePlus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

/** `stroke` is a WIDTH, not a colour. */
export type IconProps = GlyphIconProps;

function make(Glyph: LucideIcon) {
  return makeGlyphIcon(Glyph, {
    size: 18,
    strokeWidth: 1.6,
    className: (cls) => "ico " + (cls ?? ""),
  });
}

/**
 * StarBank's icon set — lucide-react placeholders standing in for the hand-drawn
 * glyphs this replaced. See the migration ledger for fidelity notes.
 */
export const I = {
  home: make(Home),
  card: make(CreditCard),
  list: make(List),
  send: make(Send),
  bill: make(Receipt),
  chart: make(LineChart),
  cal: make(Calendar),
  search: make(Search),
  bell: make(Bell),
  gear: make(Settings),
  plus: make(Plus),
  arrL: make(ArrowLeft),
  arrR: make(ArrowRight),
  arrD: make(ArrowDown),
  arrU: make(ArrowUp),
  arrUR: make(ArrowUpRight),
  arrDR: make(ArrowDownRight),
  arrows: make(ArrowLeftRight),
  qrcode: make(QrCode),
  filter: make(Filter),
  sort: make(ArrowUpDown),
  more: make(MoreHorizontal),
  x: make(X),
  check: make(Check),
  shield: make(Shield),
  sparkles: make(Sparkles),
  zap: make(Zap),
  bag: make(ShoppingBag),
  heart: make(Heart),
  trophy: make(Trophy),
  gift: make(Gift),
  receipt: make(Receipt),
  user: make(User),
  shieldOk: make(ShieldCheck),
  info: make(Info),
  alert: make(TriangleAlert),
  copy: make(Copy),
  eye: make(Eye),
  eyeOff: make(EyeOff),
  bot: make(Bot),
  download: make(Download),
  scan: make(ScanLine),
  menu: make(Menu),
  pencil: make(Pencil),
  imagePlus: make(ImagePlus),
  trash: make(Trash2),
};

export type IconName = keyof typeof I;

/** Render an icon by name (compile-checked — a typo is a type error). */
export function Ico({ name, ...p }: IconProps & { name: IconName }) {
  const C = I[name];
  return <C {...p} />;
}
