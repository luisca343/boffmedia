import { useEffect, useState } from "react";
import { useChatSettings } from "../_stores/useChatSettings";
import { hexToTriplet, resolveTheme, type ResolvedTheme } from "../_utils/theme";

/** Resolves the persisted appearance prefs into the values the `.ca-app` root applies. */
export function useResolvedTheme(): { theme: ResolvedTheme; accentTriplet: string } {
  const { theme: pref, accent } = useChatSettings();
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return { theme: resolveTheme(pref, systemDark), accentTriplet: hexToTriplet(accent) };
}
