import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ACCENT } from "../_utils/theme";

interface ChatSettingsState {
  accent: string;
  setAccent: (accent: string) => void;
}

/**
 * ChatApp's own appearance prefs (real, persisted).
 *
 * Light/dark deliberately does NOT live here — it is a platform-wide choice made once
 * in Ajustes → Temas and read via `useRotomMode()`. Only the accent is the app's.
 */
export const useChatSettings = create<ChatSettingsState>()(
  persist(
    (set) => ({
      accent: DEFAULT_ACCENT,
      setAccent: (accent) => set({ accent }),
    }),
    { name: "sr-chatapp-settings" },
  ),
);
