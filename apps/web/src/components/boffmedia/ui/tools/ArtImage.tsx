"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { isOptimizableImageSrc } from "@/lib/image-hosts"

export interface ArtImageProps {
  src?: string | null
  alt?: string
  className?: string
  /** Rendered instead of the image when the source is missing or fails to load. */
  fallback?: React.ReactNode
  /** Fixed-size mode; omit both to fill the (positioned) parent. */
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  /** `cover` crops to fill (key art); `contain` shows the whole image (icons that aren't square). */
  fit?: "cover" | "contain"
}

/** Key-art/icon image with a graceful fallback — the one place that owns the broken-image behavior. */
export function ArtImage({ src, alt = "", className, fallback = null, width, height, sizes, priority, fit = "cover" }: ArtImageProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  if (!src || failedSrc === src) return <>{fallback}</>
  const shared = {
    src,
    priority,
    onError: () => setFailedSrc(src),
    className: cn(fit === "contain" ? "object-contain" : "object-cover", className),
  }

  // A host outside `images.remotePatterns` makes next/image THROW while rendering,
  // which takes down the whole page instead of just the picture. Content images
  // come from admin-editable URL fields, so any host can turn up here: render
  // those with a plain <img>. Uploaded images (/uploads/...) stay optimized.
  if (!isOptimizableImageSrc(src)) {
    const fill = width == null || height == null
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onError={shared.onError}
        loading={priority ? "eager" : "lazy"}
        className={cn(shared.className, fill && "absolute inset-0 h-full w-full")}
      />
    )
  }

  return width != null && height != null ? (
    <Image {...shared} alt={alt} width={width} height={height} sizes={sizes} />
  ) : (
    <Image {...shared} alt={alt} fill sizes={sizes} />
  )
}
