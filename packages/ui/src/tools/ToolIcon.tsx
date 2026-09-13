"use client"

import * as React from "react"
import { cn } from "../cn"
import { uiAssetUrl } from "../i18n"
import { Icon, type IconName } from "../primitives/icon"

/**
 * A small tool glyph that can be either a host-resolved image or a design-system
 * icon. Images are decorative and deliberately use `contain`. Custom artwork
 * gets a little more room than the fallback glyph because many supplied assets
 * are square canvases around a wide wordmark (for example, TCG Pocket).
 */
export function ToolIcon({
  name,
  src,
  size = 18,
  imageScale = 1.25,
  className,
}: {
  name: IconName
  src?: string
  size?: number
  imageScale?: number
  className?: string
}) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const resolved = src ? uiAssetUrl(src) : null
  const imageSize = Math.round(size * imageScale)

  if (resolved && failedSrc !== src) {
    return (
      <img
        src={resolved}
        alt=""
        aria-hidden="true"
        width={imageSize}
        height={imageSize}
        draggable={false}
        decoding="async"
        onError={() => setFailedSrc(src ?? null)}
        className={cn("shrink-0 object-contain", className)}
      />
    )
  }

  return <Icon name={name} size={size} className={className} />
}
