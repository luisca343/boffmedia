import type { IconName } from "../_components/ui/Icon"
import type { Department } from "./tones"

export type NavItem = {
  /** Route segment under /smartrotom/gobierno. `""` is the index. */
  slug: string
  /** Key under the `gobierno` namespace — resolved with `t()` at the call site. */
  labelKey: string
  icon: IconName
  /** Which pending-count feeds this item's badge, if any. */
  counter?: "denuncias" | "buscados" | "multas" | "apelaciones"
}

export type NavGroup = {
  dep: Department
  /** Key under the `gobierno` namespace — resolved with `t()` at the call site. */
  labelKey: string
  /** Administración additionally requires ROTOM_ADMIN — the GOBIERNO role is not enough. */
  restricted?: boolean
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    dep: "resumen",
    labelKey: "dep.resumen",
    items: [
      { slug: "", labelKey: "nav.inicio", icon: "home" },
      { slug: "mapa", labelKey: "nav.mapa", icon: "map" },
    ],
  },
  {
    dep: "urbanismo",
    labelKey: "dep.urbanismo",
    items: [
      { slug: "parcelas", labelKey: "nav.parcelas", icon: "mapPin" },
      { slug: "zonas", labelKey: "nav.zonas", icon: "layers" },
      { slug: "subastas", labelKey: "nav.subastas", icon: "gavel" },
      { slug: "historial", labelKey: "nav.historial", icon: "history" },
    ],
  },
  {
    dep: "seguridad",
    labelKey: "dep.seguridad",
    items: [
      { slug: "denuncias", labelKey: "nav.denuncias", icon: "fileText", counter: "denuncias" },
      { slug: "buscados", labelKey: "nav.buscados", icon: "alert", counter: "buscados" },
      { slug: "patrullas", labelKey: "nav.patrullas", icon: "shield" },
      { slug: "recompensas", labelKey: "nav.recompensas", icon: "star" },
    ],
  },
  {
    dep: "hacienda",
    labelKey: "dep.hacienda",
    items: [
      { slug: "multas", labelKey: "nav.multas", icon: "gavel", counter: "multas" },
      { slug: "tesoreria", labelKey: "nav.tesoreria", icon: "coins" },
    ],
  },
  {
    dep: "justicia",
    labelKey: "dep.justicia",
    items: [
      { slug: "expedientes", labelKey: "nav.expedientes", icon: "folder" },
      { slug: "apelaciones", labelKey: "nav.apelaciones", icon: "scale", counter: "apelaciones" },
    ],
  },
  {
    dep: "poblacion",
    labelKey: "dep.poblacion",
    items: [
      { slug: "censo", labelKey: "nav.censo", icon: "users" },
      { slug: "oficiales", labelKey: "nav.oficiales", icon: "badge" },
    ],
  },
  {
    dep: "gobierno",
    labelKey: "dep.gobierno",
    items: [
      { slug: "eventos", labelKey: "nav.eventos", icon: "star" },
      { slug: "anuncios", labelKey: "nav.anuncios", icon: "megaphone" },
      { slug: "auditoria", labelKey: "nav.auditoria", icon: "list" },
    ],
  },
  {
    dep: "admin",
    labelKey: "dep.admin",
    restricted: true,
    items: [
      { slug: "admin/jugadores", labelKey: "nav.jugadores", icon: "users" },
      { slug: "admin/megafonia", labelKey: "nav.megafonia", icon: "megaphone" },
      { slug: "admin/notificaciones", labelKey: "nav.notificaciones", icon: "bell" },
      { slug: "admin/senalizacion", labelKey: "nav.senalizacion", icon: "signal" },
      { slug: "admin/skins", labelKey: "nav.skinsNpc", icon: "eye" },
      { slug: "admin/apps", labelKey: "nav.appsJugador", icon: "command" },
      { slug: "admin/rendimiento", labelKey: "nav.rendimiento", icon: "zap" },
      { slug: "admin/actividad", labelKey: "nav.actividad", icon: "list" },
    ],
  },
]

export const GOBIERNO_ROOT = "/smartrotom/gobierno"

export const hrefOf = (slug: string): string => (slug ? `${GOBIERNO_ROOT}/${slug}` : GOBIERNO_ROOT)

/** Every module as one flat list — what the command palette searches. */
export const FLAT_MODULES = NAV_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, dep: g.dep, groupKey: g.labelKey, restricted: g.restricted ?? false })),
)
