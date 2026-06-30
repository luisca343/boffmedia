"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  blockTextureUrls,
  placeholderColor,
  placeholderGlyph,
} from "../../_lib/textures/blockTexture";
import { useModTextureLoader } from "../../_hooks/modTextureContext";

interface BlockThumbProps {
  blockId: string;
  /** Registry version the block belongs to — selects the texture mirror ref. */
  version?: string;
  /** Worker registry id holding this block — used to fetch modded textures. */
  registryId?: string;
  /** Pixel size of the (square) tile. Defaults to 36. */
  size?: number;
  /** Optional ring color class (e.g. status accent). */
  ringClassName?: string;
  className?: string;
  /**
   * Defer loading (both the `<img>` and any worker texture fetch) until the tile
   * scrolls into view. Use in long virtualised-feeling lists (e.g. the block
   * picker dropdown) so opening a registry with thousands of blocks doesn't fire
   * thousands of texture loads at once.
   */
  lazy?: boolean;
}

function isVanillaId(blockId: string): boolean {
  return blockId.startsWith("minecraft:") || !blockId.includes(":");
}

/**
 * Visual tile for a single block. Vanilla blocks try the ordered texture mirror
 * candidates (see {@link blockTextureUrls}); modded blocks fetch their texture
 * (extracted from the JAR at scan time) from the worker via the registry id. On
 * any miss — or while a mod texture is loading-then-absent — it renders a
 * deterministic colored placeholder with the block's initial.
 */
export function BlockThumb({
  blockId,
  version,
  registryId,
  size = 36,
  ringClassName,
  className,
  lazy = false,
}: BlockThumbProps) {
  const vanilla = isVanillaId(blockId);
  const loadModTexture = useModTextureLoader();

  // Visibility gate. When `lazy`, stays false until the tile scrolls into view;
  // once visible it latches true so the texture isn't dropped on scroll-away.
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);
  useEffect(() => {
    if (!lazy || visible) return;
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "64px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy, visible]);

  // Vanilla: ordered CDN candidates walked via <img> onError.
  const candidates = useMemo(
    () => (vanilla ? blockTextureUrls(blockId, version) : []),
    [vanilla, blockId, version],
  );
  const [attempt, setAttempt] = useState(0);

  // Modded: single data URL fetched from the worker. `undefined` = still loading.
  const [modUrl, setModUrl] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (vanilla || !visible || !registryId || !loadModTexture) {
      if (vanilla) setModUrl(null);
      return;
    }
    let cancelled = false;
    setModUrl(undefined);
    loadModTexture(registryId, blockId).then((url) => {
      if (!cancelled) setModUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [vanilla, visible, registryId, blockId, loadModTexture]);

  const src = !visible
    ? undefined
    : vanilla
      ? candidates[attempt]
      : (modUrl ?? undefined);
  const pending =
    !vanilla &&
    visible &&
    modUrl === undefined &&
    Boolean(registryId) &&
    Boolean(loadModTexture);
  const showPlaceholder = visible && !pending && !src;

  const imgStyle: CSSProperties = { width: size, height: size, imageRendering: "pixelated" };

  return (
    <div
      ref={rootRef}
      className={`relative shrink-0 overflow-hidden rounded border border-edge/50 ${
        ringClassName ?? ""
      } ${className ?? ""}`}
      style={{ width: size, height: size }}
      title={blockId}
    >
      {!visible || pending ? (
        <div className="h-full w-full animate-pulse bg-layer-3/60" />
      ) : showPlaceholder ? (
        <div
          className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/90"
          style={{ backgroundColor: placeholderColor(blockId) }}
        >
          {placeholderGlyph(blockId)}
        </div>
      ) : (
        // External media asset (vanilla mirror) or in-worker data URL (mod JAR);
        // plain <img>, no pixel reads.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={vanilla ? `cdn:${attempt}` : "mod"}
          src={src}
          alt={blockId}
          style={imgStyle}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (vanilla) setAttempt((a) => a + 1);
            else setModUrl(null);
          }}
        />
      )}
    </div>
  );
}
