/**
 * THREE.Texture cache for the 3D viewer.
 *
 * Reuses the diff list's texture resolution (see {@link blockTextureUrls}) but
 * produces GPU-ready {@link THREE.Texture} objects instead of `<img>` sources:
 *
 *  - Vanilla blocks walk the ordered CDN candidate URLs (first that loads wins).
 *  - Modded blocks fetch their scan-time data URL from the worker via the same
 *    loader the diff list uses, then decode it into a texture.
 *  - A miss resolves to `null`; the caller falls back to a flat placeholder color.
 *
 * Textures are nearest-filtered (Minecraft's crisp pixel look) and cached by a
 * `version|registryId|blockId` key so each block type crosses the network /
 * worker boundary at most once for the lifetime of the page.
 */

import * as THREE from "three";
import { blockTextureUrls } from "../textures/blockTexture";

import type { TextureLoader } from "./assetLoaders";

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

const cache = new Map<string, Promise<THREE.Texture | null>>();

function configure(tex: THREE.Texture): THREE.Texture {
  // Crisp, un-blurred texels — the Minecraft aesthetic.
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadUrl(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    loader.load(
      url,
      (tex) => resolve(configure(tex)),
      undefined,
      () => resolve(null),
    );
  });
}

/** Try each candidate URL in order; the first that loads wins, else null. */
async function loadFromCandidates(urls: string[]): Promise<THREE.Texture | null> {
  for (const url of urls) {
    const tex = await loadUrl(url);
    if (tex) return tex;
  }
  return null;
}

function isVanillaId(blockId: string): boolean {
  return blockId.startsWith("minecraft:") || !blockId.includes(":");
}

// Per-source-URL texture cache, shared by the model renderer (many blocks point
// at the same texture file, e.g. every wooden block → oak_planks.png).
const srcCache = new Map<string, Promise<THREE.Texture | null>>();

/** Load a single texture by its resolved src (CDN URL or data: URL), memoized. */
export function getTextureBySrc(src: string): Promise<THREE.Texture | null> {
  let pending = srcCache.get(src);
  if (!pending) {
    pending = loadUrl(src);
    srcCache.set(src, pending);
  }
  return pending;
}

/** Load the first texture that resolves from an ordered candidate list, memoized. */
export function getTextureByCandidates(urls: string[]): Promise<THREE.Texture | null> {
  if (urls.length === 0) return Promise.resolve(null);
  if (urls.length === 1) return getTextureBySrc(urls[0]);
  const key = urls.join("|");
  let pending = srcCache.get(key);
  if (!pending) {
    pending = loadFromCandidates(urls);
    srcCache.set(key, pending);
  }
  return pending;
}

/**
 * Resolve a block's texture as a {@link THREE.Texture}, or `null` if none is
 * available. Results are memoized across calls.
 */
export function getBlockTexture(
  blockId: string,
  version: string | undefined,
  registryId: string | undefined,
  modLoader: TextureLoader | null,
): Promise<THREE.Texture | null> {
  const key = `${version ?? ""}|${registryId ?? ""}|${blockId}`;
  let pending = cache.get(key);
  if (pending) return pending;

  if (isVanillaId(blockId)) {
    pending = loadFromCandidates(blockTextureUrls(blockId, version));
  } else if (registryId && modLoader) {
    pending = modLoader(registryId, blockId)
      .then((dataUrl) => (dataUrl ? loadUrl(dataUrl) : null))
      .catch(() => null);
  } else {
    pending = Promise.resolve(null);
  }

  cache.set(key, pending);
  return pending;
}
