import type { IconName } from "./ui/icons"
import type { MediaAppId } from "./_theme"

export interface NavItem {
  key: string
  icon: IconName
  /** key under the `common.media.sidebar` namespace — never raw copy */
  labelKey: string
  /** real destination; omitted items render gated ("próximamente") — no dead links */
  href?: string
  deferred?: boolean
}

export interface NavConfig {
  main: NavItem[]
  library: NavItem[]
  /** `common.media.sidebar` key for the subscriptions/channels group (auth-gated → deferred) */
  subsTitleKey: string
}

/**
 * Sidebar nav per app. Only Inicio + Historial have real routes today; the rest
 * of the designed nav is rendered but gated (`deferred`) rather than faked —
 * see the deferred register in docs/smartrotom/deferred/mewtube-mewtwitch.md.
 */
export function navFor(app: MediaAppId, basePath: string): NavConfig {
  const isTube = app === "mewtube"
  return {
    main: [
      { key: "home", icon: "home", labelKey: "home", href: basePath },
      { key: "browse", icon: "compass", labelKey: "browse", deferred: true },
      isTube
        ? { key: "shorts", icon: "film", labelKey: "shorts", deferred: true }
        : { key: "following", icon: "heart", labelKey: "following", deferred: true },
      isTube
        ? { key: "trending", icon: "trending", labelKey: "trending", deferred: true }
        : { key: "categories", icon: "gamepad", labelKey: "categories", deferred: true },
    ],
    library: [
      { key: "history", icon: "clock", labelKey: "history", href: `${basePath}/history` },
      isTube
        ? { key: "watchlater", icon: "save", labelKey: "watchlater", deferred: true }
        : { key: "watchparty", icon: "users", labelKey: "watchparty", deferred: true },
      { key: "liked", icon: "thumbUp", labelKey: isTube ? "liked" : "clips", deferred: true },
    ],
    subsTitleKey: isTube ? "subsTube" : "subsTwitch",
  }
}
