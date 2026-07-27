"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type GobiernoAccent = "civic" | "navy" | "burgundy" | "gold"
export type GobiernoDensity = "comfortable" | "compact"

// Gobierno is light-only — the paper IS the design — so it does NOT keep a light/dark
// preference and ignores the platform theme picker's mode (SMARTROTOM_V3 §2b). What it
// does own is its institutional identity: the accent colour and the table rhythm.
type GobiernoPrefs = {
  accent: GobiernoAccent
  density: GobiernoDensity
  setAccent: (a: GobiernoAccent) => void
  setDensity: (d: GobiernoDensity) => void
}

export const useGobiernoPrefs = create<GobiernoPrefs>()(
  persist(
    (set) => ({
      accent: "civic",
      density: "comfortable",
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
    }),
    { name: "gobierno-prefs" },
  ),
)

export const ACCENTS: { value: GobiernoAccent; labelKey: string; css: string }[] = [
  { value: "civic", labelKey: "accents.civic", css: "#1f6f4a" },
  { value: "navy", labelKey: "accents.navy", css: "#2f5a9e" },
  { value: "burgundy", labelKey: "accents.burgundy", css: "#8a3a55" },
  { value: "gold", labelKey: "accents.gold", css: "#a9842f" },
]
