import type { IconName } from "@/components/boffmedia/primitives"

export interface LandingCardConfig {
  icon: string;
  fallbackIcon: IconName;
  fallbackIconColor: string;
  color: string;
  features: string[];
  featured?: boolean;
  isNew?: boolean;
  popularity?: "high" | "medium" | "low";
  heroImage?: string;
}

export interface ToolEntry {
  key: string;
  nameKey: string;
  href: string;
  sidebarIcon: IconName;
  /** Default true. Set false for tools shown on the landing page but not in the sidebar. */
  showInSidebar?: boolean;
  /**
   * Render this tool without the shell's content padding (full-bleed canvas).
   * `true` covers the tool's whole subtree; a number bleeds only routes at
   * least that many path segments below `href` (e.g. 2 → session/match views).
   */
  bleed?: boolean | number;
  landing?: LandingCardConfig;
}

export interface CategoryEntry {
  key: string;
  nameKey: string;
  href?: string;
  /** If the whole category appears as a single card on the game's landing page. */
  landing?: LandingCardConfig;
  tools: ToolEntry[];
}

export interface ExternalLinkEntry {
  key: string;
  href: string;
  desc?: string;
}

export interface GameEntry {
  slug: string;
  nameKey: string;
  /** Small icon used in the sidebar header. */
  icon: string;
  /** Larger logo used on the landing page. */
  logo: string;
  /** Key art banner image used in the hero banner variant. */
  bannerImage?: string;
  /** Tailwind gradient classes for the sidebar header (e.g. "from-yellow-400 to-red-500"). */
  color: string;
  /** Tailwind bg class for the sidebar (e.g. "bg-red-900"). */
  bg: string;
  /** Top-level href for this game's landing page. */
  navHref: string;
  categories: CategoryEntry[];
  externalLinks: ExternalLinkEntry[];
}
