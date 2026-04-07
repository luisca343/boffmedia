"use client";

/**
 * BoffCard — shared interactive card shell used across Boffmedia sections.
 *
 * Encapsulates the visual chrome that is identical between ToolsGrid cards and
 * EventCards: slate-based background, muted-→-boff border on hover, ambient
 * radial tint, corner bracket decorations, animated scan line, and top/bottom
 * accent bars. Content layout is entirely up to the consumer.
 *
 * Design contract (mirrors ToolsGrid's ToolCard):
 *   - Rest background:  rgba(30,41,59,0.85) → rgba(15,23,42,0.9)   (slate-800)
 *   - Hover background: rgba(30,41,59,0.95) → rgba(15,23,42,0.95)
 *   - Rest border:      rgba(71,85,105,0.55)                        (slate-600)
 *   - Hover border:     variant boff.border                         (colored)
 *
 * SOLID notes:
 *   S — Responsible only for the card shell; content is fully delegated via children.
 *   O — Extended by variant tokens or raw tokenOverrides without modifying this file.
 *   D — Depends on the BoffVariantTokens abstraction, not on any specific colour.
 */

import { useState } from "react";
import {
  BOFF_VARIANTS,
  BoffVariant,
  BoffVariantTokens,
} from "@/components/boffmedia/tools/utils/boffVariants";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";
import { cn } from "@/lib/utils";

// ─── Corner bracket positions ─────────────────────────────────────────────────

const CORNER_CLASSES = [
  "absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l",
  "absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r",
  "absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l",
  "absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r",
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BoffCardProps {
  /**
   * Named variant from BOFF_VARIANTS. Defaults to "primary" (orange).
   * All visual tokens are derived from this single key — no need to pass colours
   * manually unless you need to override individual tokens.
   */
  variant?: BoffVariant;

  /**
   * Override any subset of tokens derived from `variant`.
   * Merged shallowly on top of the base variant tokens.
   * Use this when a single card needs a one-off boff colour (e.g. status-driven).
   */
  tokenOverrides?: Partial<BoffVariantTokens>;

  /** Show the animated horizontal scan line while hovered. Default: true */
  scanLine?: boolean;

  /** Show corner bracket decorations. Default: true */
  brackets?: boolean;

  /**
   * Classes for the outermost container div.
   * Use this to control height, flex, cursor, etc.
   */
  className?: string;

  /**
   * Classes for the inner `relative z-10` content wrapper.
   * Pass `""` (empty string) to disable the wrapper's built-in padding so
   * children that need full-bleed sections (e.g. banner images) can manage
   * their own layout.
   * Defaults to `undefined` (no padding applied — consumers add their own).
   */
  contentClassName?: string;

  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BoffCard({
  variant = "primary",
  tokenOverrides,
  scanLine = true,
  brackets = true,
  className,
  contentClassName,
  children,
}: BoffCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(scanLine && isHovered, 1400);

  const base = BOFF_VARIANTS[variant];
  const boff: BoffVariantTokens = tokenOverrides
    ? { ...base, ...tokenOverrides }
    : base;

  return (
    <div
      className={cn(
        "relative border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-300 flex flex-col",
        className,
      )}
      style={{
        background: isHovered
          ? "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))"
          : "linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.9))",
        borderColor: isHovered ? boff.border : "rgba(71,85,105,0.55)",
        boxShadow: isHovered
          ? `0 0 40px ${boff.glowStrong}, 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
          : `0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Top boff bar ─────────────────────────────────────────────────── */}
      <div
        className={`h-[3px] bg-gradient-to-r ${boff.bar} flex-shrink-0 transition-all duration-300`}
        style={{
          opacity: isHovered ? 1 : 0.65,
          boxShadow: isHovered ? `0 0 10px ${boff.scan}` : "none",
        }}
      />

      {/* ── Ambient inner tint ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${boff.tint} 0%, transparent 60%)`,
          opacity: isHovered ? 1 : 0.55,
        }}
      />

      {/* ── Scan line (hover only) ───────────────────────────────────────── */}
      {scanLine && isHovered && (
        <div
          className="absolute inset-x-0 h-px pointer-events-none z-20"
          style={{
            top: `${scanY}%`,
            background: `linear-gradient(90deg, transparent, ${boff.scan}, transparent)`,
          }}
        />
      )}

      {/* ── Corner brackets ──────────────────────────────────────────────── */}
      {brackets &&
        CORNER_CLASSES.map((cls, i) => (
          <div
            key={i}
            className={`${cls} transition-all duration-300 pointer-events-none`}
            style={{
              borderColor: isHovered ? boff.scan : "rgba(100,116,139,0.35)",
            }}
          />
        ))}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className={cn("relative z-10 flex flex-col flex-1", contentClassName)}>
        {children}
      </div>

      {/* ── Bottom accent line ───────────────────────────────────────────── */}
      <div
        className="h-px flex-shrink-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${boff.bottomAccent}, transparent)`,
          opacity: isHovered ? 0.5 : 0,
        }}
      />
    </div>
  );
}
