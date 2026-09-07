"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TeamBuilderApp,
  type BsimNav,
  type BsimScreen,
} from "@boffmedia/tools-battlesim";

const BASE = "/pokemon/teambuilder";

function readParams(search: URLSearchParams): Record<string, string> {
  return Object.fromEntries(search.entries());
}

function hrefFor(params: Record<string, string>): string {
  const query = new URLSearchParams(params);
  // `tab=equipos` is legacy battlesim state. The standalone route only needs
  // the team and slot, so old callers cannot leak that implementation detail
  // into the new public URL.
  query.delete("tab");
  const value = query.toString();
  return value ? `${BASE}?${value}` : BASE;
}

/** URL adapter for the shared teambuilder implementation. */
export function TeamBuilderRouted() {
  const router = useRouter();
  const search = useSearchParams();

  const nav = useMemo<BsimNav>(() => {
    const params = readParams(new URLSearchParams(search.toString()));
    const screen: BsimScreen = params.team ? "teamEdit" : "teams";
    const go = (
      nextParams: Record<string, string> | undefined,
      replace: boolean,
    ) => {
      const href = hrefFor(nextParams ?? {});
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    };
    return {
      screen,
      params,
      replace: (_next, nextParams) => go(nextParams, true),
      push: (_next, nextParams) => go(nextParams, false),
      back: () => {
        router.back();
        return true;
      },
      restoresScroll: true,
      shareUrl: (_next, nextParams) => hrefFor(nextParams ?? {}),
    };
  }, [router, search]);

  return <TeamBuilderApp nav={nav} />;
}
