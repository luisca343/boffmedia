"use client";

import { useMemo, useRef } from "react";

/** DOM nodes the fly HUD writes into directly — no React re-render per frame. */
export interface FlyHudRefs {
  pos: React.RefObject<HTMLSpanElement | null>;
  look: React.RefObject<HTMLSpanElement | null>;
  speed: React.RefObject<HTMLSpanElement | null>;
}

export function useFlyHud(): FlyHudRefs {
  const pos = useRef<HTMLSpanElement>(null);
  const look = useRef<HTMLSpanElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  return useMemo(() => ({ pos, look, speed }), []);
}

export interface FlyHudLabels {
  clickToStart: string;
  controlsHint: string;
}

/**
 * Crosshair + F3-style readout (position / crosshair target / flight speed), and
 * the "click to take control" prompt shown while the pointer is unlocked.
 * Labels come from the host so this layer owns no translation namespace.
 */
export function FlyHud({
  hud,
  locked,
  labels,
}: {
  hud: FlyHudRefs;
  locked: boolean;
  labels: FlyHudLabels;
}) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-3 bg-white/70" />
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-[1.5px] bg-white/70" />
      </div>
      <div className="pointer-events-none absolute left-2.5 top-2.5 grid gap-[3px] max-w-[280px] py-1.5 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line font-mono text-[10px] leading-tight">
        <span ref={hud.pos} className="text-txt">
          0.0 / 0.0 / 0.0
        </span>
        <span ref={hud.look} className="text-txt-dim break-all">
          —
        </span>
        <span ref={hud.speed} className="text-accent-bright">
          ×1.00
        </span>
      </div>
      {!locked && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="grid gap-1 text-center py-3 px-4 bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] border border-line">
            <span className="font-mono text-[12px] text-txt">{labels.clickToStart}</span>
            <span className="font-mono text-[10px] text-txt-dim">{labels.controlsHint}</span>
          </div>
        </div>
      )}
    </>
  );
}
