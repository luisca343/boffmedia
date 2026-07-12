"use client"

import { useEffect, useState } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_THEME, resolveMode, themeClass, type RotomMode, type RotomThemeId } from "./rotomTheme"

interface RotomThemeState {
  theme: RotomThemeId
  setTheme: (theme: RotomThemeId) => void
}

/**
 * The one SmartRotom theme choice. Persisted, so it survives a reload — the old
 * picker held it in `useState` on AppWrapper and lost it on every navigation.
 */
export const useRotomThemeStore = create<RotomThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    { name: "sr-theme" },
  ),
)

/** Live OS colour-scheme preference — only `auto` cares. */
function useSystemDark(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setDark(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return dark
}

/**
 * The light/dark a themeable app should render, derived from the global theme.
 *
 * Apps do NOT own their light/dark any more — this is the single input. An app with no
 * variant for the active theme (nobody ships a Tulipán skin) gets that theme's declared
 * fallback mode, so the choice still means something everywhere.
 */
export function useRotomMode(): RotomMode {
  const theme = useRotomThemeStore((s) => s.theme)
  const systemDark = useSystemDark()
  return resolveMode(theme, systemDark)
}

/** The class the SmartRotom root wears, for AppWrapper. */
export function useRotomThemeClass(): string {
  const theme = useRotomThemeStore((s) => s.theme)
  return themeClass(theme)
}
