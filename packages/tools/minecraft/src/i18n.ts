/**
 * The in-package replacement for next-intl's `useTranslations(ns)`.
 *
 * Tools must not import `next-intl` (they run inside Vite in the launcher too),
 * so translation goes through `@boffmedia/ui`'s host-configured runtime. That
 * runtime hands back an UNBOUND translator taking full dotted keys, while every
 * call site here was written against a namespace-BOUND one — this binds it, so
 * the ~200 `t("setup.title")` call sites stay byte-identical and only the
 * namespace string at the top of each component changes.
 */

import { useMemo } from "react";
import { useRootT, type Translate } from "@boffmedia/ui/i18n";

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

/** Message-key namespaces owned by this package. */
export const SCHEMATIC_COMPAT_NS = "tools.schematicCompat";
export const SCHEMATIC_VIEWER_NS = "tools.schematicViewer";
export const SEED_FINDER_NS = "tools.seedFinder";
