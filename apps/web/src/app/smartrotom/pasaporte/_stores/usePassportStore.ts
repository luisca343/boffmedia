"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Ornament = "minimal" | "tasteful" | "maximal"
export type Motion = "on" | "off"

interface PassportState {
  /** Inspection mode — the officer's lamp. Also toggled by the `I` key. */
  inspect: boolean
  /** Drives `data-ornament` on the scope root: how much guilloche, grain and gold tooling. */
  ornament: Ornament
  /** Drives `data-motion` on the scope root. */
  motion: Motion
  /** The open spread, so the book reopens where the reader left it. */
  page: number
  /** Whether the reader has ever chosen a motion setting themselves. */
  motionChosen: boolean

  setInspect: (inspect: boolean) => void
  toggleInspect: () => void
  setOrnament: (ornament: Ornament) => void
  setMotion: (motion: Motion) => void
  setPage: (page: number) => void
  /**
   * The system's reduced-motion preference is the DEFAULT, not an override: it is applied
   * once, on mount, and only while the reader has not set motion themselves — otherwise a
   * persisted "on" would be silently reverted on every reload, and their choice would never
   * stick. Call it from an effect; `matchMedia` does not exist on the server.
   */
  initMotion: () => void
}

export const usePassportStore = create<PassportState>()(
  persist(
    (set, get) => ({
      inspect: false,
      ornament: "tasteful",
      motion: "on",
      page: 0,
      motionChosen: false,

      setInspect: (inspect) => set({ inspect }),
      toggleInspect: () => set({ inspect: !get().inspect }),
      setOrnament: (ornament) => set({ ornament }),
      setMotion: (motion) => set({ motion, motionChosen: true }),
      setPage: (page) => set({ page }),

      initMotion: () => {
        if (get().motionChosen || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        set({ motion: reduced ? "off" : "on" })
      },
    }),
    { name: "pasaporte-prefs" },
  ),
)
