"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveBlockModel } from "../model/resolve";
import { createCdnProvider } from "../model/providers/cdn-provider";
import type { ModelLoader } from "./assetLoaders";
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

/** A worker-compiled model's texture refs are already loadable srcs (data URLs). */
const selfCandidates = (ref: string): string[] => [ref];

/**
 * Resolve a block's model into a {@link BuiltModel} (geometry + per-group
 * textures), or `null` while it loads / when there's no model (block has only a
 * cube form) — the viewer then renders the cube fallback.
 *
 * Two sources, picked by namespace:
 *  - vanilla Minecraft ids → the CDN asset chain (blockstate → model → textures).
 *  - other ids (Hytale) → the worker's `getBlockModel`, which compiles the
 *    block's `.blockymodel` from Assets.zip. Modded Minecraft ids have no model
 *    source and keep the single-texture cube path (no regression).
 *
 * Results are cached, so a block type compiles + downloads once.
 */
export function useBlockModel(
  blockId: string,
  states: Record<string, string>,
  version: string | undefined,
  registryId: string | undefined,
  modelLoader: ModelLoader | null,
): BuiltModel | null {
  const provider = useMemo(() => createCdnProvider(version), [version]);
  const statesKey = useMemo(() => statesKeyOf(states), [states]);
  const [model, setModel] = useState<BuiltModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    const apply = (built: BuiltModel | null) => {
      if (!cancelled) setModel(built);
    };

    if (isVanillaId(blockId)) {
      const key = `${version ?? ""}|${blockId}|${statesKey}`;
      resolveBlockModel(blockId, states, version, provider)
        .then((compiled) => buildBlockModel(key, compiled, provider.textureCandidates))
        .then(apply)
        .catch(() => apply(null));
    } else if (modelLoader && registryId) {
      // Hytale (and other asset-pack games): geometry compiled in the worker.
      // The prefab's placement `rotation` (0–11) is baked into the geometry.
      const stateLabel = states.state;
      const rotation = states.rotation ? parseInt(states.rotation, 10) || 0 : 0;
      const key = `hytale|${registryId}|${blockId}|${statesKey}`;
      modelLoader(registryId, blockId, stateLabel, rotation)
        .then((compiled) =>
          compiled && !compiled.empty ? buildBlockModel(key, compiled, selfCandidates) : null,
        )
        .then(apply)
        .catch(() => apply(null));
    } else {
      apply(null);
    }

    return () => {
      cancelled = true;
    };
    // `states` is keyed by `statesKey`; `provider` is memoized on `version`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, statesKey, version, provider, registryId, modelLoader]);

  return model;
}
