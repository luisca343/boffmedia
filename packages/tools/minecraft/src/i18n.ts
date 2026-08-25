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

import { useRootT, type Translate } from "@boffmedia/ui/i18n";

export function useToolT(namespace: string): Translate {
  // `useRootT`, not `useT`: the latter is bound to `common.primitives`, which
  // is where the design-system strings live, not the tools' `tools.*` keys.
  const t = useRootT();
  return (key: string, values?: Record<string, string | number | Date>) =>
    t(`${namespace}.${key}`, values);
}

/** Message-key namespaces owned by this package. */
export const SCHEMATIC_COMPAT_NS = "tools.schematicCompat";
export const SCHEMATIC_VIEWER_NS = "tools.schematicViewer";
export const SEED_FINDER_NS = "tools.seedFinder";
