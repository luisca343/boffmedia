import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ACCENT, type ThemePref } from "../_utils/theme";

interface ChatSettingsState {
  theme: ThemePref;
  accent: string;
  setTheme: (theme: ThemePref) => void;
  setAccent: (accent: string) => void;
}

/** User-facing appearance prefs for the ChatApp (real, persisted). */
export const useChatSettings = create<ChatSettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      accent: DEFAULT_ACCENT,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
    }),
    { name: "sr-chatapp-settings" },
  ),
);
