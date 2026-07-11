import * as React from "react"
import { cn } from "@/lib/utils"

export interface DkSpriteProps {
  /** Resolved sprite URL. When omitted an initials fallback box renders. */
  src?: string
  alt: string
  size?: number
  /** Renders greyed-out (bench / not brought). */
  dim?: boolean
  title?: string
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  className?: string
}

/**
 * Game-agnostic sprite chip. Callers own URL resolution + the onError fallback
 * (the VGC tracker passes its `spriteUrl()` / `handleSpriteError`).
 */
export function DkSprite({ src, alt, size = 26, dim, title, onError, className }: DkSpriteProps) {
  return (
    <span
      title={title ?? alt}
      style={{ width: size, height: size }}
      className={cn("inline-grid flex-none place-items-center", className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={onError}
          className={cn("object-contain transition-opacity", dim && "opacity-30 grayscale")}
        />
      ) : (
        <span
          style={{ fontSize: Math.round(size * 0.4) }}
          className="grid h-full w-full place-items-center bg-panel-2 font-display font-bold uppercase text-txt-dim cut [--cut:3px]"
        >
          {alt.slice(0, 2)}
        </span>
      )}
    </span>
  )
}
