/**
 * The in-package replacement for next-intl's `useTranslations(ns)` and
 * `useLocale()`.
 *
 * Tools must not import `next-intl` (they run inside Vite in the launcher too),
 * so translation goes through `@boffmedia/ui`'s host-configured runtime. That
 * runtime hands back an UNBOUND translator taking full dotted keys, while every
 * call site here was written against a namespace-BOUND one — this binds it, so
 * the ~350 `t("bestiary.title")` call sites stay byte-identical and only the
 * namespace string at the top of each component changes.
 *
 * Same shim as `@boffmedia/tools-minecraft`'s; kept per-package rather than
 * hoisted into tool-kit so the kit stays free of a React/UI dependency.
 */

import { useMemo } from "react";
import { useRootT, useUiLocale, type Translate } from "@boffmedia/ui/i18n";

export function useToolT(namespace: string): Translate {
  // `useRootT`, not `useT`: the latter is bound to `common.primitives`, which
  // is where the design-system strings live, not the tools' `tools.*` keys.
  const t = useRootT();
  // Memoised, and this is load-bearing rather than an optimisation. A fresh
  // closure every render makes `t` an unstable dependency, and any `useCallback`
  // that lists it — then any effect that lists THAT — re-runs on every render.
  // In the VGC tracker that chain ended at the sign-in effect, which pulls the
  // whole account from the server: an unbounded loop of network calls from one
  // missing `useMemo`.
  return useMemo(
    () =>
      (key: string, values?: Record<string, string | number | Date>) =>
        t(`${namespace}.${key}`, values),
    [t, namespace],
  );
}

/** The host's active locale (`"es"` / `"en"`), used as an API query param. */
export function useLocale(): string {
  return useUiLocale();
}

/** Message-key namespace owned by this package. */
export const MHWILDS_NS = "tools.mhwilds";
