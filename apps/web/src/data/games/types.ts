import type { IconName } from "@boffmedia/ui"
import type { UserRole } from "@boffmedia/shared/roles"

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
  /**
   * Roles a viewer must hold for this tool to be LISTED — any one of them is
   * enough; absent (the normal case) means everybody sees it.
   *
   * Listing, and only listing: the API behind the tool carries its own role
   * guard and refuses an unauthorised caller whether or not the card was ever
   * drawn. What this buys is a hub that does not advertise a door nobody can
   * open. Deliberately NOT applied to the route-shape lookups (`getToolHref`,
   * the shell's bleed resolution) — someone who reaches the page anyway should
   * still get the right layout and the API's refusal, not a broken screen.
   *
   * Mirrors `ToolManifest.requiredRoles` in `@boffmedia/tool-kit`, which is the
   * same decision for the launcher's own grid.
   */
  requiredRoles?: UserRole[];
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
