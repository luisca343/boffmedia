import { getGameEntry, getLandingItems } from "@/data/games"
import { hubConfig } from "@/data/hub"
import { hueColorOf, hueStyle, type ToolCardData as UiToolCardData } from "@boffmedia/ui"

// The card, the grid, the seal and the hue formula now live in `@boffmedia/ui`
// so the launcher renders the same hub. Re-exported so the site's existing
// imports keep working.
export { hueColorOf, hueStyle }

/** Games shown in the v3 tools hub, in order. */
export const HUB_SLUGS = ["pokemon", "mhwilds", "otros", "minecraft"] as const

export type HubSlug = (typeof HUB_SLUGS)[number]

/** The shared card data plus the fields only the site's landings use — the
 *  featured hero and its feature chips have no counterpart in the launcher. */
export interface ToolCardData extends UiToolCardData {
  href: string
  features: string[]
  featured?: boolean
  heroImage?: string
  iconSrc?: string
}

export interface HubGame {
  slug: string
  name: string
  short: string
  tagline: string
  hue: number
  hueColor: string
  logoLabel: string
  iconImg?: string
  href: string
  tools: ToolCardData[]
}

const normHref = (href: string) => (href.startsWith("/") ? href : `/${href}`)

type T = (key: string, values?: Record<string, string | number | Date>) => string

/** Build one hub game (metadata + landing tools), translated via a root `t`. */
export function buildHubGame(slug: string, t: T): HubGame | null {
  const game = getGameEntry(slug)
  const hub = hubConfig[slug]
  if (!game || !hub) return null

  const hueColor = hueColorOf(hub.hue)
  const tools: ToolCardData[] = getLandingItems(slug).map((item) => {
    const base = `${hub.toolNs}.${item.key}`
    return {
      key: item.key,
      title: t(`${base}.title`),
      desc: t(`${base}.description`),
      features: (item.features ?? []).map((f) => t(`${base}.features.${f}`)),
      icon: item.fallbackIcon,
      href: normHref(item.href),
      isNew: item.isNew ?? false,
      popularity: item.popularity,
      hueColor,
      featured: item.featured ?? false,
      heroImage: item.heroImage,
      iconSrc: item.icon,
    }
  })

  return {
    slug,
    name: t(game.nameKey),
    short: hub.short,
    tagline: t(hub.taglineKey),
    hue: hub.hue,
    hueColor,
    logoLabel: hub.logoLabel,
    iconImg: game.icon || game.logo,
    href: `/${slug}`,
    tools,
  }
}

export function buildHubGames(t: T): HubGame[] {
  return HUB_SLUGS.map((s) => buildHubGame(s, t)).filter((g): g is HubGame => g !== null)
}

export interface ExtLinkData {
  title: string
  desc?: string
  href: string
}

export interface CategoryData extends HubGame {
  banner: { prefix: string; highlight: string; subtitle: string; image?: string }
  featuredTool: ToolCardData | null
  otherTools: ToolCardData[]
  ext: ExtLinkData[]
  bannerImage?: string
}

/** Build a game/category landing page's data (banner · featured · tools · external links). */
export function buildCategory(slug: string, t: T): CategoryData | null {
  const g = buildHubGame(slug, t)
  const game = getGameEntry(slug)
  const hub = hubConfig[slug]
  if (!g || !game || !hub) return null

  const banner = hub.headerNs
    ? {
        prefix: t(`${hub.headerNs}.title.prefix`),
        highlight: t(`${hub.headerNs}.title.highlight`),
        subtitle: t(`${hub.headerNs}.subtitle`),
        image: game.bannerImage,
      }
    : { prefix: t("toolsUi.category.bannerPrefix"), highlight: g.name, subtitle: g.tagline, image: game.bannerImage }

  const ext: ExtLinkData[] = game.externalLinks.map((l) => ({
    title: t(`${hub.extNs}.${l.key}`),
    desc: l.desc,
    href: l.href,
  }))

  // show the first featured tool as the hero; keep every other tool in the grid
  // (including any additional featured ones) so none disappear.
  const featuredTool = g.tools.find((x) => x.featured) ?? null
  return {
    ...g,
    banner,
    bannerImage: game.bannerImage,
    featuredTool,
    otherTools: g.tools.filter((x) => x !== featuredTool),
    ext,
  }
}
