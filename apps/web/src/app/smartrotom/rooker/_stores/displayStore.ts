"use client"

import { create } from "zustand"
import {
  DISPLAY_DEFAULTS,
  type RookerAccent,
  type RookerCardStyle,
  type RookerDarkness,
  type RookerDensity,
  type RookerDisplay,
  type RookerFont,
  type RookerReactions,
} from "../_utils/display"

const KEY = "rooker.display"

interface DisplayState extends RookerDisplay {
  setDarkness: (v: RookerDarkness) => void
  setAccent: (v: RookerAccent) => void
  setFont: (v: RookerFont) => void
  setDensity: (v: RookerDensity) => void
  setCardStyle: (v: RookerCardStyle) => void
  setReactions: (v: RookerReactions) => void
}

function persist(state: RookerDisplay) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // A blocked or full localStorage must not take the timeline down with it.
  }
}

export const useDisplayStore = create<DisplayState>((set, get) => {
  const write = (patch: Partial<RookerDisplay>) => {
    set(patch as DisplayState)
    const { setDarkness, setAccent, setFont, setDensity, setCardStyle, setReactions, ...rest } = get()
    persist(rest)
  }
  return {
    ...DISPLAY_DEFAULTS,
    setDarkness: (darkness) => write({ darkness }),
    setAccent: (accent) => write({ accent }),
    setFont: (font) => write({ font }),
    setDensity: (density) => write({ density }),
    setCardStyle: (cardStyle) => write({ cardStyle }),
    setReactions: (reactions) => write({ reactions }),
  }
})

/**
 * Preferences live in localStorage, which does not exist during SSR — reading them
 * in the store initialiser would hydrate-mismatch. The layout calls this once on
 * mount instead, exactly as the PC does.
 */
export function hydrateDisplay() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Partial<RookerDisplay>
    // Merged onto the defaults so a preference added later never lands undefined on
    // an existing reader, and a corrupted key degrades to the default rather than
    // painting an unresolved theme.
    useDisplayStore.setState({ ...DISPLAY_DEFAULTS, ...saved })
  } catch {
    // Corrupt JSON → defaults.
  }
}
