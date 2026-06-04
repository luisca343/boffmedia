"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Kicker } from "../primitives/kicker"

interface GameHeaderProps {
  prefix: string
  highlight: string
  subtitle?: string
  logoSrc?: string
  logoAlt?: string
  hue?: number
  logoLabel?: string
  compact?: boolean
  className?: string
}

export function GameHeader({
  prefix,
  highlight,
  subtitle,
  logoSrc,
  logoAlt,
  hue = 200,
  logoLabel,
  compact = false,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
"flex items-start justify-between gap-8 mb-10 max-[900px]:flex-col-reverse max-[900px]:items-stretch",
        compact && "flex-row-reverse",
        className,
      )}
    >
      <div className="min-w-0 max-[620px]:w-full">
        <Kicker>{prefix}</Kicker>
        <h1
          className="font-display font-extrabold leading-[1.08] text-balance"
          style={{
            fontSize: "var(--t-5xl)",
            margin: "0.8rem 0",
          }}
        >
          {highlight}
        </h1>
        {!compact && subtitle && (
          <p
            className="text-[length:var(--t-lg)] text-[var(--text-muted)] leading-relaxed"
            style={{ maxWidth: "52ch" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="w-24 h-24 shrink-0 rounded-[var(--radius-lg)] grid place-items-center overflow-hidden"
        style={{
          border: "var(--hairline) solid oklch(0.6 0.15 var(--hue, 200) / 0.45)",
          background: "oklch(0.5 0.13 var(--hue, 200) / 0.16)",
          "--hue": hue,
          color: "oklch(0.85 0.13 var(--hue, 200))",
        } as React.CSSProperties}
      >
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={logoAlt ?? ""}
            width={96}
            height={96}
            className="object-contain"
          />
        ) : (
          <span className="font-display font-extrabold text-lg">
            {logoLabel || "?"}
          </span>
        )}
      </div>
    </header>
  )
}
