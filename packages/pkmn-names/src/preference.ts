"use client";

/**
 * WHICH LANGUAGE POKÉMON NAMES ARE SHOWN IN — deliberately not the site's.
 *
 * Competitive Pokémon is played, discussed, calculated and imported in English:
 * a Spanish player who runs the site in Spanish still reads "Flamethrower" on
 * Showdown, in every damage calculator and in every team paste they are handed.
 * So the language of the INTERFACE and the language of the DATA are two
 * different questions, and this is the second one. `auto` answers it with the
 * site's language, which is what someone who never thinks about it wants; `es`
 * and `en` are for the player who does.
 *
 * Shared on purpose. It lives here rather than inside battlesim so that the
 * damage calculator, the VGC tools and the pokédex can read the same switch —
 * one setting the user sets once, not one per tool.
 *
 * `localStorage`, synchronously, and NOT the host's async `toolStorage`: this is
 * read during the first render of every name on screen, and a promise there is a
 * frame of English before the Spanish arrives, on every navigation. The value is
 * a per-device preference of a few bytes, which is exactly what localStorage is
 * for; both hosts (browser, Tauri webview) have it, and a host that does not
 * simply gets `auto`.
 */

export type PkmnNameMode = "auto" | "es" | "en";
/** What `auto` resolves to. The set of languages the tables actually carry. */
export type PkmnNameLocale = "es" | "en";

const STORE = "bm-pkmn-names";
const MODES: readonly PkmnNameMode[] = ["auto", "es", "en"];

let mode: PkmnNameMode | null = null;
const listeners = new Set<() => void>();

export function getPkmnNameMode(): PkmnNameMode {
  if (mode) return mode;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORE);
  } catch {
    /* private mode, or no DOM: `auto` is a fine answer. */
  }
  mode = (MODES as readonly string[]).includes(stored ?? "") ? (stored as PkmnNameMode) : "auto";
  return mode;
}

export function setPkmnNameMode(next: PkmnNameMode): void {
  if (getPkmnNameMode() === next) return;
  mode = next;
  try {
    localStorage.setItem(STORE, next);
  } catch {
    /* the choice still applies to this session. */
  }
  for (const listener of listeners) listener();
}

export function subscribePkmnNameMode(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * Resolve the mode against the interface language.
 *
 * Anything that is not Spanish resolves to English, rather than to "the site's
 * language": a table exists for `es` and nothing else, so a third locale would
 * otherwise ask for names that are not there.
 */
export function resolvePkmnNameLocale(current: PkmnNameMode, uiLocale: string): PkmnNameLocale {
  if (current === "es") return "es";
  if (current === "en") return "en";
  return uiLocale.toLowerCase().startsWith("es") ? "es" : "en";
}
