/**
 * Top-level entry point: a block id + states + version → a cached
 * {@link CompiledModel}. Ties together blockstate resolution, model-chain
 * flattening, the block-entity shape fallback, and compilation.
 */

import { resolveModelRefs } from "./blockstate";
import { resolveModelInstance } from "./model-resolver";
import { compileModel } from "./compiler";
import { blockEntityModel } from "./block-entity-shapes";
import type { AssetProvider, CompiledModel, ModelInstance } from "./types";

const cache = new Map<string, Promise<CompiledModel>>();

function statesKey(states: Record<string, string>): string {
  return Object.keys(states)
    .sort()
    .map((k) => `${k}=${states[k]}`)
    .join(",");
}

async function build(
  rawId: string,
  rawStates: Record<string, string>,
  provider: AssetProvider,
): Promise<CompiledModel> {
  // The asset tree may name this block differently than the loader does (a 1.12
  // double slab is its own block, a 1.12 slab keys `half` not `type`).
  const { blockId, states } = provider.adaptStates?.(rawId, rawStates) ?? {
    blockId: rawId,
    states: rawStates,
  };
  const blockstate = await provider.getBlockstate(blockId);
  let instances: ModelInstance[] = [];

  if (blockstate) {
    const refs = resolveModelRefs(blockstate, states);
    const resolved = await Promise.all(refs.map((r) => resolveModelInstance(provider, r)));
    instances = resolved.filter((m): m is ModelInstance => m !== null);
  }

  // Empty JSON model (block entity, parse miss) → curated shape if we have one.
  if (instances.length === 0) {
    const synthetic = blockEntityModel(rawId, rawStates);
    if (synthetic) instances = synthetic;
  }

  // Tint and curated shapes key off the block the schematic actually holds, not
  // the asset-tree alias it was resolved through.
  return compileModel(instances, rawId, rawStates);
}

/**
 * Resolve and compile a block's model, memoized by `version|blockId|states`. A
 * returned `empty` model means the caller should fall back to a plain cube.
 */
export function resolveBlockModel(
  blockId: string,
  states: Record<string, string>,
  version: string | undefined,
  provider: AssetProvider,
): Promise<CompiledModel> {
  const key = `${version ?? ""}|${blockId}|${statesKey(states)}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = build(blockId, states, provider).catch(
      (): CompiledModel => ({
        positions: new Float32Array(0),
        normals: new Float32Array(0),
        uvs: new Float32Array(0),
        indices: new Uint32Array(0),
        groups: [],
        empty: true,
      }),
    );
    cache.set(key, pending);
  }
  return pending;
}
