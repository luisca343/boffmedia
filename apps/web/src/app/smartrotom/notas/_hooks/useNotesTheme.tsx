"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRotomMode, useRotomThemeStore } from "@/components/smartrotom/theme/useRotomTheme";

export type Theme = "dark" | "light";
export type Reading = "sans" | "serif";
export type Width = "normal" | "wide";

const DEFAULT_ACCENT = "#f97316"; // brand orange → use theme default, no override

interface Tweaks {
  theme: Theme;
  accent: string;
  reading: Reading;
  width: Width;
}

interface ThemeCtx extends Tweaks {
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (hex: string) => void;
  setReading: (r: Reading) => void;
  setWidth: (w: Width) => void;
  /** Inline style carrying the runtime accent override (empty for default). */
  accentStyle: CSSProperties;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "nt-tweaks";

function hexToTriplet(hex: string): string | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const n = parseInt(m, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Everything Notas still owns. Light/dark left — it is now a platform choice. */
type LocalTweaks = Omit<Tweaks, "theme">;

export function NotesThemeProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<LocalTweaks>({
    accent: DEFAULT_ACCENT,
    reading: "sans",
    width: "normal",
  });

  // Light/dark comes from the one SmartRotom theme picker (Ajustes → Temas), so a theme
  // Notas has no skin for still resolves to a sensible mode. The toggle below writes
  // back to that same picker rather than keeping a second, divergent preference.
  const theme = useRotomMode();
  const setRotomTheme = useRotomThemeStore((s) => s.setTheme);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { theme: _drop, ...rest } = JSON.parse(raw) as Partial<Tweaks>;
        setTweaks((t) => ({ ...t, ...rest }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const patch = (p: Partial<LocalTweaks>) =>
    setTweaks((t) => {
      const next = { ...t, ...p };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const accentStyle = useMemo<CSSProperties>(() => {
    if (tweaks.accent === DEFAULT_ACCENT) return {};
    const trip = hexToTriplet(tweaks.accent);
    if (!trip) return {};
    return { ["--nt-accent" as string]: trip, ["--nt-accent-fg" as string]: trip };
  }, [tweaks.accent]);

  const value: ThemeCtx = {
    ...tweaks,
    theme,
    setTheme: (t) => setRotomTheme(t),
    toggleTheme: () => setRotomTheme(theme === "dark" ? "light" : "dark"),
    setAccent: (accent) => patch({ accent }),
    setReading: (reading) => patch({ reading }),
    setWidth: (width) => patch({ width }),
    accentStyle,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotesTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotesTheme must be used within NotesThemeProvider");
  return ctx;
}

export const ACCENT_OPTIONS = ["#f97316", "#3b82f6", "#d946ef", "#10b981"];
