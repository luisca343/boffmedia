"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui"
import type { Manufacturer } from "./consoles"

/**
 * The console/region filter chips shared by `biblioteca/` and `myrient/`.
 *
 * Both tools search the same console catalogue and had grown a byte-identical
 * copy of this file each (`ct-kit`'s `CtChip` and `my-kit`'s `ConsoleChip` were
 * the same component under two names, and `RegionChip` was duplicated verbatim).
 * Sibling routes share through the parent's `_components/`, which is where
 * `consoles.ts` already lives.
 */

/** Manufacturer accent dots — a hue per platform family, legible on graphite.
 *  Brand identity, not design tokens: these are data about the platforms, so
 *  they stay literal rather than resolving to `--accent` and friends. */
export const MFR_DOT: Record<Manufacturer, string> = {
  Nintendo: "#ff5b6a",
  Sony: "#4da3ff",
  Microsoft: "#34d377",
  Sega: "#f0803c",
  Retro: "#9d7bff",
  Arcade: "#ffb224",
}

export const MFR_ORDER: Manufacturer[] = ["Nintendo", "Sony", "Microsoft", "Sega", "Retro", "Arcade"]

/** Both chips are filters in the same bar, so both take the pill shape. The
 *  console chip used to be a square box beside a parallelogram region chip —
 *  two geometries for one job, sitting inches apart. */
const CHIP_BASE =
  "cut cut-edge-slant [--cut:4px] inline-flex items-center gap-[0.375rem] border border-solid px-[0.6875rem] py-[0.4375rem] font-semibold transition-colors"

export function ConsoleChip({ label, dot, on, onClick }: { label: string; dot: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // The slants are painted geometry, not a CSS border, so the active colour
      // has to be handed to `--cut-line` by name or they stay at `--line`.
      style={on ? ({ borderColor: dot, "--cut-line": dot, background: `color-mix(in oklch, ${dot} 12%, transparent)` } as React.CSSProperties) : undefined}
      className={cn(
        CHIP_BASE,
        "font-body text-[0.6875rem] tracking-[0.02em]",
        on ? "text-txt" : "border-line [--cut-line:var(--line)] bg-panel text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt",
      )}
    >
      <span className="h-[0.5625rem] w-[0.5625rem] flex-none rounded-[2px]" style={{ background: dot }} />
      {label}
    </button>
  )
}

export function RegionChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        CHIP_BASE,
        "font-mono text-[0.6875rem] uppercase tracking-[0.06em]",
        on
          ? "border-accent [--cut-line:var(--accent)] bg-accent-soft text-accent"
          : "border-line [--cut-line:var(--line)] bg-panel text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt",
      )}
    >
      {label}
    </button>
  )
}
