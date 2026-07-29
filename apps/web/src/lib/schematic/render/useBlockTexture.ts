"use client";

import { useEffect, useState } from "react";
import type * as THREE from "three";
import { getBlockTexture } from "./blockTextureCache";
import type { TextureLoader } from "./assetLoaders";

/** Resolves a block's THREE texture (vanilla CDN / mod JAR), or null on a miss. */
export function useBlockTexture(
  blockId: string,
  version: string | undefined,
  registryId: string | undefined,
  modLoader: TextureLoader | null,
  meta?: number,
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    setTex(null);
    getBlockTexture(blockId, version, registryId, modLoader, meta).then((t) => {
      if (!cancelled) setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [blockId, version, registryId, modLoader, meta]);
  return tex;
}
