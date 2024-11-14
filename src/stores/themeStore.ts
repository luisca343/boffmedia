import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'theme-light' | 'theme-dark' | 'theme-tulipan' | 'theme-mizu' | 'theme-oasis'
const boffThemes = [
  "theme-light",
  "theme-dark",
]

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'theme-dark',
      setTheme: async (theme) => {
        set({ theme: theme });
        const root = document.documentElement;
        try {
          const response = await fetch(`/styles/${theme}.json`);
          const themeVariables = await response.json();
          /*
          Object.entries(themeVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value as string);
          });
          */
        } catch (error) {
          console.error(`Failed to load theme ${theme}:`, error);
        }
      },
    }),
    {
      name: 'rotom-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { theme: theme, setTheme: setTheme } = state;
          setTheme(theme);
        }
      },
    }
  )
)