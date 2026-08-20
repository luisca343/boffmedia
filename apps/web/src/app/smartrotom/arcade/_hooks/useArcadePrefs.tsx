"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ScanlineIntensity = "off" | "subtle" | "strong"

export interface ArcadePrefs {
  /** Gates the loot reel's sound. */
  sound: boolean
  /** Writes `data-motion` on the `.ar-app` root, which kills every ar-* animation. */
  motion: boolean
  scanlines: ScanlineIntensity
}

const DEFAULTS: ArcadePrefs = { sound: true, motion: true, scanlines: "subtle" }

const STORAGE_KEY = "smartrotom.arcade.prefs"

interface PrefsContext extends ArcadePrefs {
  setPref: <K extends keyof ArcadePrefs>(key: K, value: ArcadePrefs[K]) => void
}

const Ctx = createContext<PrefsContext>({ ...DEFAULTS, setPref: () => {} })

/**
 * Cabinet preferences — local to this browser, never on the server (there is no
 * arcade-settings endpoint, and these are display choices, not player state).
 * `useRotomMode` is deliberately not consulted: the arcade is dark-only and
 * ships a single mode, so it ignores the platform light/dark axis entirely.
 */
export function ArcadePrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ArcadePrefs>(DEFAULTS)

  // localStorage is read after mount so the server and first client render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<ArcadePrefs>) })
    } catch {
      // A corrupt or blocked store just means defaults — never a crash.
    }
  }, [])

  const setPref = useCallback<PrefsContext["setPref"]>((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore: a full or blocked store must not break the toggle.
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ ...prefs, setPref }), [prefs, setPref])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useArcadePrefs = () => useContext(Ctx)
