"use client";

/**
 * MapHud — the readouts that sit on top of the map.
 *
 * Deliberately not Leaflet controls. A Leaflet control lives inside Leaflet's
 * DOM and would have to be styled against Leaflet's stylesheet rather than the
 * design system; these are ordinary absolutely-positioned children of the map's
 * wrapper, so they use the same tokens as the rest of the tool and cost React
 * nothing to keep in sync.
 *
 * `pointer-events: none` throughout. Everything here is a readout, and a
 * readout that swallows a drag on the map it is reporting on is a bug.
 *
 * These sit over a map that is, by design, a dense field of saturated colour.
 * So the panels are opaque rather than tinted, the type is a size larger than
 * the tool's small print, and the numbers are `tabular-nums` in fixed-width
 * columns — a coordinate readout that reflows as the cursor moves is unreadable
 * no matter how good the contrast is.
 */

import type { HoverInfo } from "./SeedMap";
import type { BiomeStyler } from "../_lib/biomeColors";

export interface MapHudProps {
  hover: HoverInfo | null;
  styler: BiomeStyler | null;
  blocksPerPixel: number;
  /** Sea level of the loaded stack, shown as the reference for surface Y. */
  seaLevel: number | null;
  labels: {
    hint: string;
    water: string;
    land: string;
    surface: string;
    sea: string;
    /** Already formatted — interpolation belongs where the translator lives. */
    scale: string;
  };
}

/**
 * The scale bar is drawn at whichever power-of-two block distance lands closest
 * to 90px, so its label is always a round Minecraft number (a chunk is 16, a
 * region is 512) rather than an arbitrary one.
 */
const BAR_TARGET_PX = 90;

function scaleBar(blocksPerPixel: number): { px: number; blocks: number } {
  const wanted = blocksPerPixel * BAR_TARGET_PX;
  const blocks = 2 ** Math.round(Math.log2(wanted));
  return { px: Math.round(blocks / blocksPerPixel), blocks };
}

/**
 * Opaque, not tinted: these sit over saturated colour and have to stay legible.
 *
 * A solid token, and deliberately not `bg-base/95`. Tailwind 3.4 cannot apply
 * an opacity modifier to a colour that is a bare `var()` — and every colour in
 * this design system is one (`base` is `var(--bg)`) — so the modifier silently
 * produced the wrong colour rather than a translucent one. That is how these
 * panels ended up rendering light-on-light over the map.
 */
const PANEL = "border border-line-2 bg-panel shadow-lg";

export function MapHud({ hover, styler, blocksPerPixel, seaLevel, labels }: MapHudProps) {
  const bar = scaleBar(blocksPerPixel);
  const style = hover && styler && hover.biome ? styler.styleOf(hover.biome) : null;

  return (
    <>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500]">
        {hover ? (
          <div className={`${PANEL} min-w-[248px] px-3 py-2`}>
            {style ? (
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="inline-block size-3.5 shrink-0 rounded-[2px] border border-line-2"
                  style={{ backgroundColor: `rgb(${style.color.join(",")})` }}
                />
                <span className="truncate text-[13px] font-semibold leading-tight text-txt">{style.label}</span>
              </div>
            ) : null}

            <div className="flex items-baseline gap-4 font-mono text-[12px] leading-tight tabular-nums">
              <span className="text-txt">
                <span className="text-txt-dim">X</span>{" "}
                <span className="inline-block min-w-[5ch] text-right">{hover.x}</span>
              </span>
              <span className="text-txt">
                <span className="text-txt-dim">Z</span>{" "}
                <span className="inline-block min-w-[5ch] text-right">{hover.z}</span>
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-2 font-mono text-[12px] leading-tight tabular-nums">
              <span className="text-txt">
                <span className="text-txt-dim">{labels.surface}</span>{" "}
                <span className="inline-block min-w-[3ch] text-right">{hover.surfaceY}</span>
              </span>
              <span className={hover.isWater ? "font-semibold text-accent" : "text-txt-dim"}>
                {hover.isWater ? labels.water : labels.land}
              </span>
              {/* Sea level is a constant, so it earns no permanent chrome — but
                  it is the only thing that makes a surface Y mean anything. */}
              {seaLevel !== null ? (
                <span className="ml-auto text-txt-dim">
                  {labels.sea} {seaLevel}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={`${PANEL} px-3 py-2 text-[12px] leading-tight text-txt-dim`}>{labels.hint}</div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] flex flex-col items-end gap-1.5">
        <div className={`${PANEL} px-3 py-1.5 font-mono text-[12px] leading-tight text-txt-dim`}>{labels.scale}</div>
        <div className={`${PANEL} flex items-center gap-2 px-3 py-1.5`}>
          <span className="font-mono text-[12px] leading-tight tabular-nums text-txt">{bar.blocks}</span>
          <span className="relative block h-[8px] border-x-2 border-b-2 border-txt" style={{ width: bar.px }} />
        </div>
      </div>
    </>
  );
}
