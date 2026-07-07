"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

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
}

/** Key-art/icon image with a graceful fallback — the one place that owns the broken-image behavior. */
export function ArtImage({ src, alt = "", className, fallback = null, width, height, sizes, priority }: ArtImageProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  if (!src || failedSrc === src) return <>{fallback}</>
  const shared = {
    src,
    priority,
    onError: () => setFailedSrc(src),
    className: cn("object-cover", className),
  }
  return width != null && height != null ? (
    <Image {...shared} alt={alt} width={width} height={height} sizes={sizes} />
  ) : (
    <Image {...shared} alt={alt} fill sizes={sizes} />
  )
}
