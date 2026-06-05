"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives/icon"
import { BoffBadge as Badge } from "../../primitives/badge"
import { FeaturedButton } from "./featured-button"
import { IconBox } from "../../primitives/icon-box"
import { BoffCard as Card } from "../../primitives/card"
import { useScanAnimation } from "@/hooks/tools/useScanAnimation"

interface FeaturedToolData {
  title: string
  isNew?: boolean
  desc: string
  features: string[]
  href: string
  icon: string
  image?: string
  hue?: number
  iconSrc?: string
  heroImage?: string
}

interface FeaturedToolProps {
  tool: FeaturedToolData
  go: (path: string) => void
  className?: string
}

export function FeaturedTool({ tool, go, className }: FeaturedToolProps) {
  const [hovered, setHovered] = React.useState(false)
  const scanY = useScanAnimation(hovered, 1600)

  const hue = tool.hue ?? 28
  const glowColor = `oklch(0.6 0.16 ${hue} / 0.25)`
  const scanlineColor = `oklch(0.7 0.16 ${hue} / 0.7)`

  return (
    <div
      className={cn("mb-12 cursor-pointer", className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Card
        className="grid grid-cols-[1.3fr_1fr] max-[620px]:grid-cols-1 overflow-hidden"
        style={{
          borderColor: hovered
            ? `oklch(0.6 0.16 ${hue} / 0.5)`
            : "var(--border)",
          boxShadow: hovered
            ? `0 0 45px ${glowColor}, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : undefined,
          transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          transform: hovered ? "translateY(-4px)" : undefined,
        }}
        onClick={() => go(tool.href.replace(/^#/, ""))}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(tool.href.replace(/^#/, ""))
        }}
      >
        {/* Top neon bar */}
        <div
          className="absolute inset-x-0 top-0 h-[3px] pointer-events-none transition-all duration-300 z-20"
          style={{
            background: `linear-gradient(90deg, #f97316, oklch(0.72 0.18 ${hue}))`,
            opacity: hovered ? 1 : 0.8,
            boxShadow: hovered ? `0 0 16px ${glowColor}` : "none",
          }}
          aria-hidden="true"
        />

        {/* Ambient inner glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.5,
          }}
        />

        {/* Scan line */}
        {hovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20 transition-none"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${scanlineColor}, transparent)`,
            }}
          />
        )}

        {/* Corner brackets */}
        {([
          "top-3 left-3 w-5 h-5 border-t border-l",
          "top-3 right-3 w-5 h-5 border-t border-r",
          "bottom-3 left-3 w-5 h-5 border-b border-l",
          "bottom-3 right-3 w-5 h-5 border-b border-r",
        ] as const).map((cls, i) => (
          <div
            key={i}
            className={`absolute ${cls} transition-all duration-300 pointer-events-none z-20`}
            style={{ borderColor: hovered ? scanlineColor : "rgba(100,116,139,0.55)" }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 p-8 flex flex-col gap-[1.1rem]">
          <div className="flex items-center gap-4">
            {tool.iconSrc ? (
              <div className="w-[60px] h-[60px] rounded-[var(--radius-lg,22px)] grid place-items-center overflow-hidden bg-[color-mix(in_srgb,var(--orange-500)_13%,transparent)] border border-solid border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)] shadow-[0_0_30px_-8px_var(--orange-500)] shrink-0">
                <Image
                  src={tool.iconSrc}
                  alt=""
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            ) : (
              <IconBox icon={tool.icon} size="lg" tone="orange" />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-t-3xl">{tool.title}</h2>
                {tool.isNew && <Badge kind="new">Nuevo</Badge>}
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-t-xs tracking-widest uppercase text-[var(--accent-bright)] mt-1">
                <Icon name="sparkles" size={13} /> Herramienta destacada
              </span>
            </div>
          </div>
          <p className="text-t-base leading-relaxed m-0 text-[var(--text-muted)]">{tool.desc}</p>
          <div className="flex flex-wrap gap-2">
            {tool.features.map((f) => (
              <Badge key={f} kind="accent">{f}</Badge>
            ))}
          </div>
          <FeaturedButton
            isHovered={hovered}
            onClick={(e) => {
              e.stopPropagation()
              go(tool.href.replace(/^#/, ""))
            }}
            className="self-start"
          >
            Abrir {tool.title}
          </FeaturedButton>
        </div>

        {/* Art side with image glow */}
        <div className="relative min-h-[280px] max-[620px]:min-h-[200px] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, oklch(0.6 0.16 ${hue} / 0.2) 0%, transparent 60%)`,
              opacity: hovered ? 1 : 0.6,
              transition: "opacity 0.5s ease",
            }}
          />
          {tool.heroImage ? (
            <div
              className="w-full h-full border-0 border-l-[var(--hairline)] border-dashed border-l-[var(--border-strong)] max-[620px]:border-l-0 max-[620px]:border-t-[var(--hairline)] max-[620px]:border-t-dashed max-[620px]:border-t-[var(--border-strong)]"
              style={{
                transition: "transform 0.5s ease",
                transform: hovered ? "scale(1.03)" : "scale(1)",
              }}
            >
              <Image src={tool.heroImage} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-900/80 via-surface-900/30 to-transparent hidden md:block pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div
              className="w-full h-full rounded-none border-0 border-l-[var(--hairline)] border-dashed border-l-[var(--border-strong)] bg-[color:var(--surface-3)] bg-[image:repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_11px)] grid place-items-center overflow-hidden max-[620px]:border-l-0 max-[620px]:border-t-[var(--hairline)] max-[620px]:border-t-dashed max-[620px]:border-t-[var(--border-strong)]"
              style={{
                transition: "transform 0.5s ease",
                transform: hovered ? "scale(1.03)" : "scale(1)",
              }}
            >
              <span className="font-mono text-t-xs text-[var(--text-dim)] tracking-[0.04em]">
                {tool.image ?? ""}
              </span>
            </div>
          )}
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 font-mono text-t-xs px-3 py-1.5 rounded-full bg-black/60 text-white backdrop-blur-md z-10">
            <Icon name="clock" size={13} /> Recién actualizado
          </span>
        </div>

        {/* Bottom glow line */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, #f97316, oklch(0.72 0.18 ${hue}))`,
            opacity: hovered ? 0.5 : 0.2,
          }}
          aria-hidden="true"
        />
      </Card>
    </div>
  )
}
