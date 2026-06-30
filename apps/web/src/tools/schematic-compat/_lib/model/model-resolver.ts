/**
 * Resolve a model reference into a flattened, ready-to-compile {@link ModelInstance}:
 * walk the `parent` chain, merge `textures` (child wins), locate the nearest
 * `elements`, and resolve `#variable` indirection in the texture map.
 */

import type { AssetProvider, ModelElement, ModelInstance, ModelRef, RawModel } from "./types";

const MAX_DEPTH = 8;

/** Load a model and its ancestors, child-first. Stops at the depth cap or a miss. */
async function loadChain(provider: AssetProvider, ref: string): Promise<RawModel[]> {
  const chain: RawModel[] = [];
  let current: string | undefined = ref;
  for (let depth = 0; current && depth < MAX_DEPTH; depth++) {
    const model: RawModel | null = await provider.getModel(current);
    if (!model) break;
    chain.push(model);
    current = model.parent;
  }
  return chain;
}

/** Merge a child-first chain's `textures` maps (child overrides parent). */
function mergeTextures(chain: RawModel[]): Record<string, string> {
  const merged: Record<string, string> = {};
  for (let i = chain.length - 1; i >= 0; i--) {
    Object.assign(merged, chain[i].textures ?? {});
  }
  return merged;
}

/** The nearest (child-most) `elements` in the chain wins outright. */
function findElements(chain: RawModel[]): ModelElement[] | undefined {
  for (const model of chain) {
    if (model.elements) return model.elements;
  }
  return undefined;
}

/** Flatten `#ref` indirection so every texture variable maps to a concrete ref. */
function resolveTextureRefs(textures: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(textures)) {
    let value: string | undefined = textures[key];
    for (let i = 0; value && value.startsWith("#") && i < MAX_DEPTH; i++) {
      value = textures[value.slice(1)];
    }
    if (value && !value.startsWith("#")) out[key] = value;
  }
  return out;
}

/**
 * Resolve one {@link ModelRef} into a {@link ModelInstance}, or null when the
 * model chain yields no geometry (e.g. an empty block-entity model).
 */
export async function resolveModelInstance(
  provider: AssetProvider,
  ref: ModelRef,
): Promise<ModelInstance | null> {
  const chain = await loadChain(provider, ref.model);
  if (chain.length === 0) return null;

  const elements = findElements(chain);
  if (!elements || elements.length === 0) return null;

  return {
    model: { elements },
    textures: resolveTextureRefs(mergeTextures(chain)),
    x: ref.x ?? 0,
    y: ref.y ?? 0,
    uvlock: ref.uvlock ?? false,
  };
}
