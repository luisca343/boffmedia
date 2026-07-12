import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

function initialsOf(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().replace(/^@/, "").split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase()
}

const PRESET = { md: 38, lg: 56 } as const

/**
 * Single source of avatar truth — photo with an initials fallback, optional
 * accent ring (live channels/streamers). Overlays (e.g. a live badge) go in
 * `children`.
 */
export function Avatar({
  src,
  name,
  alt,
  size = "md",
  ring = false,
  className,
  children,
}: {
  src?: string
  name?: string
  alt?: string
  size?: "md" | "lg" | number
  ring?: boolean
  className?: string
  children?: ReactNode
}) {
  const px = typeof size === "number" ? size : PRESET[size]
  return (
    <div
      className={cn(
        "relative flex flex-none items-center justify-center overflow-visible rounded-full",
        ring && "shadow-[0_0_0_2px_rgb(var(--mw-accent)),0_0_0_4px_rgb(var(--mw-bg))]",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-mw-700">
        {src ? (
           
          <img
            src={src}
            alt={alt ?? name ?? ""}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="font-semibold text-mw-fg-mute"
            style={{ fontSize: Math.round(px * 0.4) }}
          >
            {initialsOf(name)}
          </span>
        )}
      </span>
      {children}
    </div>
  )
}
