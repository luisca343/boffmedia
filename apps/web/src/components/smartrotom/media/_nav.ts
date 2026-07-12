import type { IconName } from "./ui/icons"
import type { MediaAppId } from "./_theme"

export interface NavItem {
  key: string
  icon: IconName
  label: string
  /** real destination; omitted items render gated ("próximamente") — no dead links */
  href?: string
  deferred?: boolean
}

export interface NavConfig {
  main: NavItem[]
  library: NavItem[]
  /** section title for the subscriptions/channels group (auth-gated → deferred) */
  subsTitle: string
}

/**
 * Sidebar nav per app. Only Inicio + Historial have real routes today; the rest
 * of the designed nav is rendered but gated (`deferred`) rather than faked —
 * see the deferred register in docs/MEWTUBE_MEWTWITCH_V3.md §13.
 */
export function navFor(app: MediaAppId, basePath: string): NavConfig {
  const isTube = app === "mewtube"
  return {
    main: [
      { key: "home", icon: "home", label: "Inicio", href: basePath },
      { key: "browse", icon: "compass", label: "Explorar", deferred: true },
      isTube
        ? { key: "shorts", icon: "film", label: "Shorts", deferred: true }
        : { key: "following", icon: "heart", label: "Siguiendo", deferred: true },
      isTube
        ? { key: "trending", icon: "trending", label: "Tendencias", deferred: true }
        : { key: "categories", icon: "gamepad", label: "Categorías", deferred: true },
    ],
    library: [
      { key: "history", icon: "clock", label: "Historial", href: `${basePath}/history` },
      isTube
        ? { key: "watchlater", icon: "save", label: "Ver más tarde", deferred: true }
        : { key: "watchparty", icon: "users", label: "Watch Party", deferred: true },
      { key: "liked", icon: "thumbUp", label: isTube ? "Me gusta" : "Clips guardados", deferred: true },
    ],
    subsTitle: isTube ? "Suscripciones" : "Canales que sigues",
  }
}
