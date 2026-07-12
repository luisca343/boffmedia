"use client"

import { createContext, useContext, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * The media domain is ONE design system with TWO accents. Everything that
 * differs between Mewtube and Mewtwitch is data on this theme object — never a
 * `platform` enum branch or a dynamic class fragment (that was the audit's
 * G7/OCP + G2 debt). Add a third surface later by adding a record entry.
 */
export type MediaAppId = "mewtube" | "mewtwitch"

export interface MediaTheme {
  id: MediaAppId
  /** wordmark shown in the topbar */
  label: string
  /** route root, e.g. "/smartrotom/mewtube" */
  basePath: string
  /** the other app — drives the topbar app-switch */
  sibling: MediaAppId
  /** rare inline/SVG cases; prefer the `mw-accent` utility everywhere else */
  accentHex: string
  searchPlaceholder: string
  /** primary follow/subscribe CTA copy */
  primaryCta: string
}

export const MEDIA_THEMES: Record<MediaAppId, MediaTheme> = {
  mewtube: {
    id: "mewtube",
    label: "Mewtube",
    basePath: "/smartrotom/mewtube",
    sibling: "mewtwitch",
    accentHex: "#ec4899",
    searchPlaceholder: "Buscar vídeos, creadores…",
    primaryCta: "Suscribirse",
  },
  mewtwitch: {
    id: "mewtwitch",
    label: "Mewtwitch",
    basePath: "/smartrotom/mewtwitch",
    sibling: "mewtube",
    accentHex: "#a855f7",
    searchPlaceholder: "Buscar directos, canales, categorías…",
    primaryCta: "Seguir",
  },
}

const MediaAppContext = createContext<MediaTheme | null>(null)

/** Theme for the current app; throws if used outside a `MediaAppProvider`. */
export function useMediaTheme(): MediaTheme {
  const t = useContext(MediaAppContext)
  if (!t) throw new Error("useMediaTheme must be used inside <MediaAppProvider>")
  return t
}

/**
 * Roots the media design system: sets `.mw-app` + `data-app` (which the
 * tailwind `mw` base-layer keys the accent/surface ramp off) and provides the
 * resolved theme to every descendant primitive.
 */
export function MediaAppProvider({
  app,
  children,
  className,
}: {
  app: MediaAppId
  children: ReactNode
  className?: string
}) {
  return (
    <MediaAppContext.Provider value={MEDIA_THEMES[app]}>
      <div className={cn("mw-app font-mw text-mw-fg", className)} data-app={app}>
        {children}
      </div>
    </MediaAppContext.Provider>
  )
}
