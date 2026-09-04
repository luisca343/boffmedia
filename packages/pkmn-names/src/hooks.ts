"use client";

/**
 * The React face of the preference. One `useSyncExternalStore` here so no tool
 * writes its own, and so every screen flips in the same commit when the setting
 * changes.
 */

import { useMemo, useSyncExternalStore } from "react";
import { useUiLocale } from "@boffmedia/ui/i18n";

import { pkmnNameTable, type PkmnNameTable } from "./lookup";
import {
  getPkmnNameMode,
  resolvePkmnNameLocale,
  setPkmnNameMode,
  subscribePkmnNameMode,
  type PkmnNameLocale,
  type PkmnNameMode,
} from "./preference";

/**
 * Server render: `auto`. The stored choice lives in `localStorage`, which the
 * server cannot read, so prerendered HTML shows the site's own language and the
 * client's first commit corrects it — the same trade every per-device
 * preference on this site makes, and the only one that does not require a
 * round trip before the first name can be drawn.
 */
function serverMode(): PkmnNameMode {
  return "auto";
}

export function usePkmnNameMode(): [PkmnNameMode, (next: PkmnNameMode) => void] {
  const mode = useSyncExternalStore(subscribePkmnNameMode, getPkmnNameMode, serverMode);
  return [mode, setPkmnNameMode];
}

/** Which language names are in right now, `auto` already resolved. */
export function usePkmnNameLocale(): PkmnNameLocale {
  const mode = useSyncExternalStore(subscribePkmnNameMode, getPkmnNameMode, serverMode);
  const uiLocale = useUiLocale();
  return resolvePkmnNameLocale(mode, uiLocale);
}

/** The three lookups, memoised on the locale so a table is not rebuilt per name. */
export function usePkmnNames(): PkmnNameTable {
  const locale = usePkmnNameLocale();
  return useMemo(() => pkmnNameTable(locale), [locale]);
}
