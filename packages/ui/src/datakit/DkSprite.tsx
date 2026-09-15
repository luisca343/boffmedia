import * as React from "react"
import { cn } from "../cn"

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
  const [displaySrc, setDisplaySrc] = React.useState<string | null>(src ?? null)
  const [resolvedForSrc, setResolvedForSrc] = React.useState<string | null>(src ?? null)

  React.useEffect(() => {
    setDisplaySrc(src ?? null)
    setResolvedForSrc(src ?? null)
  }, [src])

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const failedUrl = event.currentTarget.src
    onError?.(event)

    // Sprite handlers may replace the URL with another candidate. Only render
    // the local initials fallback when the handler has no candidate left.
    if (event.currentTarget.src === failedUrl) {
      setDisplaySrc(null)
    } else {
      // Keep the handler's replacement in React state so a parent rerender
      // does not restore the broken source prop.
      setDisplaySrc(event.currentTarget.src)
    }
    setResolvedForSrc(src ?? failedUrl)
  }

  const currentSrc = resolvedForSrc === (src ?? null) ? displaySrc : src ?? null

  return (
    <span
      title={title ?? alt}
      style={{ width: size, height: size }}
      className={cn("inline-grid flex-none place-items-center", className)}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={handleError}
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
