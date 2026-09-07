/**
 * VGC's slice of the package's message namespace.
 *
 * The web tree bound its translators to `vgc.*` (from `locales/*​/tools/vgc.json`).
 * That whole subtree moved into this package's catalog under `tools.vgc.*`, so
 * the prefix is spelled once here and every call site says only which section
 * it is in — `useVgcT("tracker")` where it used to name the full namespace. The
 * keys inside each `t("…")` are unchanged.
 */

import type { RichTranslate, Translate } from "@boffmedia/ui/i18n";

import { useToolRichT, useToolT } from "../i18n";

/** This tool family's root namespace. Four registry entries share it. */
export const VGC_NS = "tools.vgc";

/** A translator bound to `tools.vgc.<section>`. */
export function useVgcT(section: string): Translate {
  return useToolT(`${VGC_NS}.${section}`);
}

/** A rich translator bound to `tools.vgc.<section>`. */
export function useVgcRichT(section: string): RichTranslate {
  return useToolRichT(`${VGC_NS}.${section}`);
}
