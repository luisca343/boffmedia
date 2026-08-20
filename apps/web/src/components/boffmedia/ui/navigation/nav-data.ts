import { getGameEntry, getToolHref } from "@/data/games"
import { hubConfig } from "@/data/hub"
import { HUB_SLUGS } from "@/components/boffmedia/ui/tools/tools-data"
import type { IconName } from "@boffmedia/ui"

export interface NavItem {
  label: string
  href: string
  icon?: IconName
}

export interface NavGroup {
  name: string
  href?: string
  items: NavItem[]
}

export interface NavSection {
  title: string
  href: string
  hue?: number
  groups?: NavGroup[]
  items: NavItem[]
}

export interface NavEntry {
  labelKey: string
  route: string
  menu?: "tools" | "comunidad"
}

type T = (key: string) => string

export const PRIMARY_NAV: NavEntry[] = [
  { labelKey: "home", route: "/" },
  { labelKey: "tools", route: "/herramientas", menu: "tools" },
  { labelKey: "community", route: "/community", menu: "comunidad" },
]

/**
 * Tools menu derived from the games registry (single source of truth for
 * routes and names) — adding a game/tool there updates this menu, the hub,
 * the category landings and the shell sidebar together.
 */
export function buildToolsSections(t: T): NavSection[] {
  return HUB_SLUGS.flatMap((slug) => {
    const game = getGameEntry(slug)
    const hub = hubConfig[slug]
    if (!game || !hub) return []
    return [
      {
        title: t(game.nameKey),
        href: `/${slug}`,
        hue: hub.hue,
        groups: game.categories
          .map((c) => ({
            name: t(c.nameKey),
            href: c.href,
            items: c.tools
              .filter((tool) => tool.showInSidebar !== false)
              .map((tool) => ({ label: t(tool.nameKey), href: tool.href, icon: tool.sidebarIcon })),
          }))
          .filter((g) => g.items.length > 0),
        items: [],
      },
    ]
  })
}

export function buildComunidadSections(t: T): NavSection[] {
  return [
    {
      title: t("nav.v3.sections.competition"),
      href: "/clasificacion",
      items: [
        { label: t("nav.v3.items.games"), href: "/juegos", icon: "gamepad" },
        { label: t("nav.v3.items.tournaments"), href: "/torneos", icon: "trophy" },
        { label: t("nav.v3.items.ranking"), href: "/clasificacion", icon: "chart" },
      ],
    },
    {
      title: t("nav.v3.sections.participate"),
      href: "/eventos",
      items: [
        { label: t("nav.v3.items.events"), href: "/eventos", icon: "trophy" },
        { label: t("nav.v3.items.raffles"), href: getToolHref("otros", "sorteos"), icon: "gift" },
      ],
    },
    {
      title: t("nav.v3.sections.play"),
      href: "/app",
      items: [{ label: t("nav.v3.items.app"), href: "/app", icon: "download" }],
    },
  ]
}

export interface FooterLink {
  route?: string
  href?: string
  labelKey: string
  external?: boolean
}

export const FOOTER_COLS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "explore",
    links: [
      { route: "/eventos", labelKey: "events" },
      { route: "/juegos", labelKey: "games" },
      { route: "/herramientas", labelKey: "tools" },
      { route: "/clasificacion", labelKey: "ranking" },
      { route: "/app", labelKey: "app" },
    ],
  },
  {
    titleKey: "community",
    links: [
      { href: "https://discord.gg/TWqjNHQz7d", labelKey: "discord", external: true },
      { route: getToolHref("otros", "sorteos"), labelKey: "raffles" },
    ],
  },
  {
    titleKey: "system",
    links: [
      { route: "/styles/components", labelKey: "components" },
      { route: "/perfil", labelKey: "profile" },
      { route: "/admin", labelKey: "admin" },
      { route: "/privacidad", labelKey: "privacy" },
    ],
  },
]

export const FOOTER_SOCIAL: { icon: IconName; labelKey: string; href: string }[] = [
  { icon: "discord", labelKey: "discord", href: "https://discord.gg/TWqjNHQz7d" },
  { icon: "globe", labelKey: "web", href: "/" },
]
