/**
 * The in-package replacement for next-intl's `useTranslations(ns)`.
 *
 * Tools must not import `next-intl` (they run inside Vite in the launcher too),
 * so translation goes through `@boffmedia/ui`'s host-configured runtime. That
 * runtime hands back an UNBOUND translator taking full dotted keys, while every
 * call site here was written against a namespace-BOUND one — this binds it, so
 * the `t("…")` calls stay byte-identical and only the namespace string at the
 * top of each component changes.
 *
 * Same shim as the other tool packages'; kept per-package rather than hoisted
 * into tool-kit so the kit stays free of a React/UI dependency.
 */

import { useMemo } from "react";
import {
  useRootRichT,
  useRootT,
  useUiLocale,
  type RichTranslate,
  type RichValues,
  type Translate,
} from "@boffmedia/ui/i18n";

export function useToolT(namespace: string): Translate {
  // `useRootT`, not `useT`: the latter is bound to `common.primitives`, which
  // is where the design-system strings live, not the tools' `tools.*` keys.
  const t = useRootT();
  // Memoised, and this is load-bearing rather than an optimisation: an unstable
  // `t` propagates through every `useCallback` that lists it and can turn one
  // render into a loop.
  return useMemo(
    () =>
      (key: string, values?: Record<string, string | number | Date>) =>
        t(`${namespace}.${key}`, values),
    [t, namespace],
  );
}

/** The host's active locale — number/date formatting, and Steam Free's `lang`
 *  query parameter, which is part of the REQUEST rather than of the rendering. */
export function useLocale(): string {
  return useUiLocale();
}

/** Message-key namespace owned by this package. */
export const MISC_NS = "tools.misc";

/** One per tool, so no component builds its namespace out of string pieces. */
export const BIBLIOTECA_NS = `${MISC_NS}.biblioteca`;
export const KEYS_NS = `${MISC_NS}.keys`;
export const MYRIENT_NS = `${MISC_NS}.myrient`;
export const SORTEOS_NS = `${MISC_NS}.sorteos`;
export const STEAMFREE_NS = `${MISC_NS}.steamfree`;

/**
 * The rich counterpart of {@link useToolT}, for the handful of messages that
 * carry emphasis spans (`Probabilidad <b>{pct}%</b> · …`).
 *
 * Deliberately a SECOND hook rather than a method on the translator: `Translate`
 * is a plain callable that both hosts and four other tool packages already
 * produce, and requiring a `rich` on it would break every one of them for the
 * sake of three call sites.
 */
export function useToolRichT(namespace: string): RichTranslate {
  const t = useRootRichT();
  return useMemo(
    () =>
      (key: string, values?: RichValues) =>
        t(`${namespace}.${key}`, values),
    [t, namespace],
  );
}
