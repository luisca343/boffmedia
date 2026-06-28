"use client"

import { cn } from "@/lib/utils"
import { Kicker } from "../../primitives/kicker"
import { Icon } from "../../primitives/icon"

interface GameHeroBannerProps {
  kicker: string
  title: string
  subtitle: string
  hue?: number
  logoLabel?: string
  className?: string
  breadcrumb?: React.ReactNode
  variant?: "atmosfera" | "banner"
  imageSrc?: string
  imageAlt?: string
}

export function GameHeroBanner({
  kicker,
  title,
  subtitle,
  hue = 200,
  logoLabel,
  className,
  breadcrumb,
  variant = "atmosfera",
  imageSrc,
  imageAlt,
}: GameHeroBannerProps) {
  const isBanner = variant === "banner"

  return (
    <div
      className={cn(
        "relative overflow-hidden isolate border-b border-edge",
        className,
      )}
    >
      {/* Background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(120% 150% at 86% -10%, oklch(0.62 0.16 ${hue} / 0.34), transparent 56%)`,
              `radial-gradient(90% 130% at -5% 110%, oklch(0.55 0.15 ${hue + 35} / 0.18), transparent 60%)`,
            ].join(", "),
          }}
        />
        {/* Ghosted monogram watermark (atmosfera only) */}
        {!isBanner && (
          <span
            className="absolute select-none pointer-events-none"
            style={{
              right: "-1.5%",
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(11rem, 26vw, 21rem)",
              lineHeight: 0.78,
              letterSpacing: "-0.05em",
              whiteSpace: "nowrap",
              color: "transparent",
              WebkitTextStroke: `2px oklch(0.72 0.14 ${hue} / 0.17)`,
            }}
          >
            {logoLabel || "?"}
          </span>
        )}
        {/* Key art panel (banner only) */}
        {isBanner && (
          <div
            className="absolute top-0 right-0 bottom-0 overflow-hidden"
            style={{
              width: "48%",
              borderLeft: "var(--hairline) dashed var(--border-strong)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 34%)",
              maskImage: "linear-gradient(90deg, transparent 0%, #000 34%)",
              display: "grid",
              placeItems: "end center",
              paddingBottom: "1rem",
            }}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: "var(--layer-3)",
                  backgroundImage: "repeating-linear-gradient(45deg, var(--border) 0 1px, transparent 1px 12px)",
                }}
              />
            )}
            <span
              className="relative font-mono tracking-[0.04em]"
              style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)" }}
            >
              Key art
            </span>
          </div>
        )}
      </div>

      {/* Legibility scrim */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
        style={{
          background: isBanner
            ? "linear-gradient(90deg, color-mix(in srgb, var(--bg) 90%, transparent) 6%, transparent 62%)"
            : "linear-gradient(90deg, color-mix(in srgb, var(--bg) 78%, transparent) 0%, transparent 52%)",
        }}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-[2] mx-auto px-[var(--gutter)]",
          isBanner && "flex flex-col justify-center min-h-[360px]",
        )}
        style={{
          maxWidth: "1080px",
          padding: isBanner ? "3rem var(--gutter) 2.5rem" : "2.25rem var(--gutter) 2rem",
        }}
      >
        {breadcrumb}
        <div className="flex items-center justify-between gap-10">
          <div className={cn("min-w-0", isBanner && "max-w-[32rem]")}>
            <Kicker>{kicker}</Kicker>
            <h1
              className="font-display font-extrabold leading-[1.0] tracking-[var(--display-spacing)] text-balance"
              style={{
                fontSize: "var(--t-5xl)",
                margin: "0.7rem 0 0",
              }}
            >
              {title}
            </h1>
            <p
              className="leading-relaxed"
              style={{
                fontSize: "var(--t-lg)",
                color: "var(--text-muted)",
                maxWidth: "50ch",
                margin: "0.9rem 0 0",
              }}
            >
              {subtitle}
            </p>

          </div>

          {/* Logo square (atmosfera only; banner hides it) */}
          {!isBanner && logoLabel && (
            <div
              className="shrink-0 grid place-items-center font-display font-extrabold"
              style={{
                width: "118px",
                height: "118px",
                borderRadius: "var(--radius-lg)",
                fontSize: "1.4rem",
                color: `oklch(0.86 0.13 ${hue})`,
                background: `oklch(0.5 0.13 ${hue} / 0.16)`,
                border: "var(--hairline) solid " + `oklch(0.62 0.15 ${hue} / 0.5)`,
                boxShadow: `0 0 60px -12px oklch(0.6 0.18 ${hue} / 0.75), inset 0 0 34px -14px oklch(0.78 0.16 ${hue} / 0.6)`,
              }}
            >
              <span>{logoLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
