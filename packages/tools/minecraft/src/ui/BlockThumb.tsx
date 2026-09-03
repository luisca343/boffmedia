"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  blockTextureUrls,
  placeholderColor,
  placeholderGlyph,
} from "../engine/textures/blockTexture";
import { useTextureLoader } from "../engine/render";

/** One key/value line in the hover-preview card (e.g. a blockstate or count). */
export interface PreviewRow {
  label: string;
  value: string;
}

export interface BlockThumbProps {
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
  /**
   * Show a large floating preview card on hover (block texture blown up + name +
   * data rows). On by default; pass `false` to opt out. Works in any layout — the
   * card is `position: fixed` so it escapes list/panel overflow.
   */
  preview?: boolean;
  /** Extra data rows shown under the name in the hover preview (states, count…). */
  previewRows?: PreviewRow[];
}

interface PreviewPos {
  left: number;
  top?: number;
  bottom?: number;
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
const PREVIEW_W = 232;
const PREVIEW_IMG = 132;

export function BlockThumb({
  blockId,
  version,
  registryId,
  size = 36,
  ringClassName,
  className,
  lazy = false,
  preview = true,
  previewRows,
}: BlockThumbProps) {
  const vanilla = isVanillaId(blockId);
  const loadModTexture = useTextureLoader();

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

  // Hover preview. Anchored to the tile, position:fixed so it escapes any list /
  // panel overflow; opened after a short delay so quick fly-overs don't flash it.
  const colon = blockId.indexOf(":");
  const namespace = colon === -1 ? "minecraft" : blockId.slice(0, colon);
  const name = colon === -1 ? blockId : blockId.slice(colon + 1);
  const [previewPos, setPreviewPos] = useState<PreviewPos | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openPreview() {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const openUp = window.innerHeight - r.bottom < 300;
    setPreviewPos({
      left: Math.min(Math.max(8, r.left + r.width / 2 - PREVIEW_W / 2), window.innerWidth - PREVIEW_W - 8),
      top: openUp ? undefined : r.bottom + 8,
      bottom: openUp ? window.innerHeight - r.top + 8 : undefined,
    });
  }
  function onEnter() {
    if (!preview) return;
    hoverTimer.current = setTimeout(openPreview, 110);
  }
  function onLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPreviewPos(null);
  }
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  return (
    <>
      <div
        ref={rootRef}
        className={`relative shrink-0 overflow-hidden border border-line/50 ${
          ringClassName ?? ""
        } ${className ?? ""}`}
        style={{ width: size, height: size }}
        title={preview ? undefined : blockId}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {!visible || pending ? (
          <div className="h-full w-full animate-pulse bg-panel-2/60" />
        ) : showPlaceholder ? (
          <div
            className="flex h-full w-full items-center justify-center text-[0.625rem] font-bold text-white/90"
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

      {preview && previewPos ? (
        <div
          className="pointer-events-none fixed z-[90] flex w-[14.5rem] flex-col gap-2.5 border border-line-2 bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] p-3 shadow-[0_20px_46px_-18px_var(--shadow-color)] backdrop-blur-[18px] animate-[bm-menu-in_0.12s_ease] motion-reduce:animate-none"
          style={{ left: previewPos.left, top: previewPos.top, bottom: previewPos.bottom }}
        >
          <div className="mx-auto overflow-hidden border border-line/60">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={blockId}
                style={{ width: PREVIEW_IMG, height: PREVIEW_IMG, imageRendering: "pixelated" }}
              />
            ) : (
              <div
                className="flex items-center justify-center text-3xl font-bold text-white/90"
                style={{ width: PREVIEW_IMG, height: PREVIEW_IMG, backgroundColor: placeholderColor(blockId) }}
              >
                {placeholderGlyph(blockId)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-mono text-[0.78125rem] font-semibold text-txt">{name}</div>
            <div className="truncate font-mono text-[0.625rem] text-txt-dim">{namespace}</div>
          </div>
          {previewRows && previewRows.length > 0 ? (
            <div className="flex flex-col gap-1 border-t border-line pt-2">
              {previewRows.map((r) => (
                <div key={r.label} className="flex items-baseline justify-between gap-2 text-[0.625rem]">
                  <span className="shrink-0 text-txt-dim">{r.label}</span>
                  <span className="min-w-0 truncate font-mono text-txt-muted">{r.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
