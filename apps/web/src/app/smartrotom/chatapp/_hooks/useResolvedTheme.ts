import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme";
import { useChatSettings } from "../_stores/useChatSettings";
import { hexToTriplet, type ResolvedTheme } from "../_utils/theme";

/**
 * Resolves what the `.ca-app` root applies.
 *
 * Light/dark is NOT a ChatApp preference any more — it comes from the one SmartRotom
 * theme picker (Ajustes → Temas), so a theme with no ChatApp skin (Tulipán, Oasis…)
 * still lands on a sensible mode. The accent stays a ChatApp preference: it is the
 * app's own identity, not the platform's.
 */
export function useResolvedTheme(): { theme: ResolvedTheme; accentTriplet: string } {
  const theme = useRotomMode();
  const accent = useChatSettings((s) => s.accent);
  return { theme, accentTriplet: hexToTriplet(accent) };
}
