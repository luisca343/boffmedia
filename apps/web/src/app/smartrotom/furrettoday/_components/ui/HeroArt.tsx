"use client";

import { useState } from "react";

import { ACCENT_ART, FT_INK, type FtAccent } from "../../_utils/accents";
import { FurretMascot } from "./FurretMascot";

/**
 * An article's picture.
 *
 * When the newsroom set an `imageUrl` we show it. When they did not — which is
 * most rows — we draw the house illustration instead: halftone field, wash, and
 * the mascot. That is not a placeholder standing in for missing data, it is the
 * magazine's own cover art, so an image-less article still looks published.
 *
 * A broken/404 `imageUrl` falls back to the same drawing rather than an alt-text
 * box, because these sit inside cards where a blank frame would break the grid.
 */
export function HeroArt({
  accent,
  src,
  alt,
  className,
  mascot = true,
  burst,
}: {
  accent: FtAccent;
  src?: string | null;
  alt?: string;
  className?: string;
  /** Off for small cards, where a 160px mascot is just noise. */
  mascot?: boolean;
  burst?: string;
}) {
  const [failed, setFailed] = useState(false);
  const art = ACCENT_ART[accent];

  if (src && !failed) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {/* Not next/image: these are arbitrary operator-pasted URLs on any host,
            and the remote-pattern allowlist would 500 on an unknown one. */}
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        background: art.bg,
        backgroundImage: `radial-gradient(${art.dot} 1.6px, transparent 1.8px)`,
        backgroundSize: "12px 12px",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 70% at 80% 100%, ${art.wash}55 0%, transparent 60%)`,
        }}
      />
      {mascot ? (
        <FurretMascot
          size={320}
          style={{
            position: "absolute",
            left: "6%",
            bottom: "-10%",
            transform: "rotate(-4deg)",
          }}
        />
      ) : null}
      {burst ? (
        <svg
          viewBox="0 0 200 200"
          className="absolute right-4 top-4 h-[110px] w-[110px]"
          aria-hidden="true"
        >
          <path
            d="M100 6 L116 38 L150 22 L142 60 L182 60 L154 90 L188 110 L150 120 L168 156 L130 148 L122 188 L100 160 L78 188 L70 148 L32 156 L50 120 L12 110 L46 90 L18 60 L58 60 L50 22 L84 38 Z"
            fill={art.wash}
            stroke={FT_INK}
            strokeWidth="3"
          />
          <text
            x="100"
            y="108"
            textAnchor="middle"
            fontFamily="Bangers, Anton, sans-serif"
            fontSize="26"
            fill={FT_INK}
          >
            {burst}
          </text>
        </svg>
      ) : null}
    </div>
  );
}
