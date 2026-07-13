import type { IconName } from "../_components/ui/Icon"
import type { Department } from "./tones"

export type NavItem = {
  /** Route segment under /smartrotom/gobierno. `""` is the index. */
  slug: string
  label: string
  icon: IconName
  /** Which pending-count feeds this item's badge, if any. */
  counter?: "denuncias" | "buscados" | "multas" | "apelaciones"
}

export type NavGroup = {
  dep: Department
  label: string
  /** Administración additionally requires ROTOM_ADMIN — the GOBIERNO role is not enough. */
  restricted?: boolean
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    dep: "resumen",
    label: "Resumen",
    items: [
      { slug: "", label: "Inicio", icon: "home" },
      { slug: "mapa", label: "Mapa", icon: "map" },
    ],
  },
  {
    dep: "urbanismo",
    label: "Urbanismo",
    items: [
      { slug: "parcelas", label: "Parcelas", icon: "mapPin" },
      { slug: "zonas", label: "Zonas", icon: "layers" },
      { slug: "subastas", label: "Subastas", icon: "gavel" },
      { slug: "historial", label: "Historial", icon: "history" },
    ],
  },
  {
    dep: "seguridad",
    label: "Seguridad",
    items: [
      { slug: "denuncias", label: "Denuncias", icon: "fileText", counter: "denuncias" },
      { slug: "buscados", label: "Buscados", icon: "alert", counter: "buscados" },
      { slug: "patrullas", label: "Patrullas", icon: "shield" },
      { slug: "recompensas", label: "Recompensas", icon: "star" },
    ],
  },
  {
    dep: "hacienda",
    label: "Hacienda",
    items: [
      { slug: "multas", label: "Multas", icon: "gavel", counter: "multas" },
      { slug: "tesoreria", label: "Tesorería", icon: "coins" },
    ],
  },
  {
    dep: "justicia",
    label: "Justicia",
    items: [
      { slug: "expedientes", label: "Expedientes", icon: "folder" },
      { slug: "apelaciones", label: "Apelaciones", icon: "scale", counter: "apelaciones" },
    ],
  },
  {
    dep: "poblacion",
    label: "Población",
    items: [
      { slug: "censo", label: "Censo", icon: "users" },
      { slug: "oficiales", label: "Oficiales", icon: "badge" },
    ],
  },
  {
    dep: "gobierno",
    label: "Gobierno",
    items: [
      { slug: "eventos", label: "Eventos", icon: "star" },
      { slug: "anuncios", label: "Anuncios", icon: "megaphone" },
      { slug: "auditoria", label: "Auditoría", icon: "list" },
    ],
  },
  {
    dep: "admin",
    label: "Administración",
    restricted: true,
    items: [
      { slug: "admin/jugadores", label: "Jugadores", icon: "users" },
      { slug: "admin/megafonia", label: "Megafonía", icon: "megaphone" },
      { slug: "admin/notificaciones", label: "Notificaciones", icon: "bell" },
      { slug: "admin/senalizacion", label: "Señalización", icon: "signal" },
      { slug: "admin/skins", label: "Skins NPC", icon: "eye" },
      { slug: "admin/apps", label: "Apps de jugador", icon: "command" },
      { slug: "admin/rendimiento", label: "Rendimiento", icon: "zap" },
      { slug: "admin/actividad", label: "Actividad", icon: "list" },
    ],
  },
]

export const GOBIERNO_ROOT = "/smartrotom/gobierno"

export const hrefOf = (slug: string): string => (slug ? `${GOBIERNO_ROOT}/${slug}` : GOBIERNO_ROOT)

/** Every module as one flat list — what the command palette searches. */
export const FLAT_MODULES = NAV_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, dep: g.dep, group: g.label, restricted: g.restricted ?? false })),
)
