"use client"

import * as React from "react"
import Image from "next/image"
import { Icon } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { isOptimizableImageSrc } from "@/lib/image-hosts"

interface PokedexImageFallbackProps {
  alt?: string
  kind?: "image" | "pokemon"
  className?: string
  style?: React.CSSProperties
  iconSize?: number
}

export function PokedexImageFallback({
  alt = "",
  kind = "image",
  className,
  style,
  iconSize = 20,
}: PokedexImageFallbackProps) {
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("grid place-items-center border border-dashed border-pk-surface-600 bg-pk-surface-900 text-pk-surface-500", className)}
      style={style}
    >
      <Icon name={kind === "pokemon" ? "paw" : "cube"} size={iconSize} />
    </span>
  )
}

interface PokedexArtImageProps {
  src?: string | null
  alt?: string
  className?: string
  style?: React.CSSProperties
  fallback?: React.ReactNode
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  fit?: "cover" | "contain"
}

export function PokedexArtImage({
  src,
  alt = "",
  className,
  style,
  fallback,
  width,
  height,
  sizes,
  priority,
  fit = "cover",
}: PokedexArtImageProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const fallbackNode = fallback === undefined ? (
    <PokedexImageFallback
      alt={alt}
      className={cn(width != null && height != null ? "h-full w-full" : "absolute inset-0", className)}
      style={width != null && height != null ? { width, height } : undefined}
    />
  ) : fallback

  if (!src || failedSrc === src) return <>{fallbackNode}</>

  const imageClass = cn(fit === "contain" ? "object-contain" : "object-cover", className)
  const onError = () => setFailedSrc(src)

  if (!isOptimizableImageSrc(src)) {
    const fill = width == null || height == null
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onError={onError}
        loading={priority ? "eager" : "lazy"}
        className={cn(imageClass, fill && "absolute inset-0 h-full w-full")}
        style={style}
      />
    )
  }

  const shared = { src, priority, onError, className: imageClass, style }
  return width != null && height != null ? (
    <Image {...shared} alt={alt} width={width} height={height} sizes={sizes} />
  ) : (
    <Image {...shared} alt={alt} fill sizes={sizes} />
  )
}
