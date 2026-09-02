/**
 * The in-package replacement for next-intl's `useTranslations(ns)`.
 *
 * The giveaways kit moved into `@boffmedia/ui` to ship inside the desktop app,
 * where `next-intl` does not exist, so translation goes through the host's
 * configured runtime instead. That runtime hands back an UNBOUND translator
 * taking full dotted keys, while every call site here was written against a
 * namespace-BOUND one — this binds it, so the `t("…")` calls stay
 * byte-identical and only the line that obtains `t` changed.
 *
 * Same shim as `useNsT` one level up and as each `@boffmedia/tools-*` package's
 * own copy; kept here so the kit's two namespaces are named in one place.
 */

import { useMemo } from "react";
import { useRootT, type Translate } from "../i18n";

export function useGiveawaysT(namespace: string = GIVEAWAYS_NS): Translate {
  // `useRootT`, not `useT`: the latter is bound to `common.primitives`, where
  // the design-system strings live — not the kit's `common.giveaways` keys.
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

/** Message-key namespaces owned by this package. */
export const GIVEAWAYS_NS = "common.giveaways";
export const GIVEAWAYS_REEL_NS = "common.giveaways.reel";
