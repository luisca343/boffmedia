"use client"

import { create } from "zustand"

// Chrome-level UI state that any module can reach: the citizen dossier drawer (opened by
// clicking any name, anywhere in the app) and the ⌘K command palette.
type GobiernoUi = {
  /** The uuid of the citizen whose dossier is open, or null. */
  dossier: string | null
  openDossier: (uuid: string) => void
  closeDossier: () => void
  cmdOpen: boolean
  setCmdOpen: (open: boolean) => void
}

export const useGobiernoUi = create<GobiernoUi>((set) => ({
  dossier: null,
  openDossier: (uuid) => set({ dossier: uuid }),
  closeDossier: () => set({ dossier: null }),
  cmdOpen: false,
  setCmdOpen: (cmdOpen) => set({ cmdOpen }),
}))
