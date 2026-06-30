"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveBlockModel } from "../../_lib/model/resolve";
import { createCdnProvider } from "../../_lib/model/providers/cdn-provider";
import { buildBlockModel, type BuiltModel } from "./blockModelCache";

function isVanillaId(blockId: string): boolean {
  return blockId.startsWith("minecraft:") || !blockId.includes(":");
}

function statesKeyOf(states: Record<string, string>): string {
  return Object.keys(states)
    .sort()
    .map((k) => `${k}=${states[k]}`)
    .join(",");
}

/**
 * Resolve a block's Minecraft model into a {@link BuiltModel} (geometry + per-group
 * textures), or `null` while it loads / when there's no model (modded blocks,
 * empty block entities) — the viewer then renders the cube fallback.
 *
 * Vanilla only for now: modded namespaces resolve to `null` and keep the existing
 * single-texture cube path (no regression). Results are cached, so a block type
 * compiles + downloads once.
 */
export function useBlockModel(
  blockId: string,
  states: Record<string, string>,
  version: string | undefined,
): BuiltModel | null {
  const provider = useMemo(() => createCdnProvider(version), [version]);
  const statesKey = useMemo(() => statesKeyOf(states), [states]);
  const [model, setModel] = useState<BuiltModel | null>(null);

  useEffect(() => {
    if (!isVanillaId(blockId)) {
      setModel(null);
      return;
    }
    let cancelled = false;
    setModel(null);
    const key = `${version ?? ""}|${blockId}|${statesKey}`;
    resolveBlockModel(blockId, states, version, provider)
      .then((compiled) => buildBlockModel(key, compiled, provider.textureCandidates))
      .then((built) => {
        if (!cancelled) setModel(built);
      })
      .catch(() => {
        if (!cancelled) setModel(null);
      });
    return () => {
      cancelled = true;
    };
    // `states` is keyed by `statesKey`; `provider` is memoized on `version`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, statesKey, version, provider]);

  return model;
}
