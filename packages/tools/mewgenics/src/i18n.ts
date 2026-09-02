/**
 * The in-package replacement for next-intl's `useTranslations(ns)` and
 * `useLocale()`.
 *
 * Tools must not import `next-intl` (they run inside Vite in the launcher too),
 * so translation goes through `@boffmedia/ui`'s host-configured runtime. That
 * runtime hands back an UNBOUND translator taking full dotted keys, while every
 * call site here was written against a namespace-BOUND one — this binds it, so
 * the ~500 `t("fiche.title")` call sites stay byte-identical and only the
 * namespace string at the top of each component changes.
 *
 * Same shim as the other tool packages'; kept per-package rather than hoisted
 * into tool-kit so the kit stays free of a React/UI dependency.
 */

import { useMemo } from "react";
import { useRootT, useUiLocale, type Translate } from "@boffmedia/ui/i18n";

export function useToolT(namespace: string): Translate {
  // `useRootT`, not `useT`: the latter is bound to `common.primitives`, which
  // is where the design-system strings live, not the tools' `tools.*` keys.
  const t = useRootT();
  // Memoised, and this is load-bearing rather than an optimisation — see the
  // note in `@boffmedia/tools-mhwilds`' copy: an unstable `t` propagates through
  // every `useCallback` that lists it and can turn one render into a loop.
  return useMemo(
    () =>
      (key: string, values?: Record<string, string | number | Date>) =>
        t(`${namespace}.${key}`, values),
    [t, namespace],
  );
}

/**
 * The host's active locale. Mewgenics uses it twice: for `toLocaleString`
 * number formatting, and — unlike the other tool packages — to pick the
 * DATASET's own string table (`strings/{es,en}.json`), which is shipped with
 * the game data and is not next-intl's concern. See `mew-store`.
 */
export function useLocale(): string {
  return useUiLocale();
}

/** The dataset ships exactly these two string tables. */
export type MewLang = "es" | "en";

export function asMewLang(locale: string): MewLang {
  return locale === "en" ? "en" : "es";
}

/** Message-key namespace owned by this package. */
export const MEWGENICS_NS = "tools.mewgenics";
