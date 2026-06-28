"use client"

import { Trophy } from "lucide-react"
import { useState } from "react"

interface EventImageProps {
  src: string
  alt: string
  className?: string
}

export function EventImage({ src, alt, className = "" }: EventImageProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`bg-gradient-to-br from-secondary to-secondary-active rounded-2xl flex items-center justify-center ${className}`}>
        <Trophy className="w-12 h-12 text-white" />
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={`rounded-2xl object-cover ${className}`}
      onError={() => setImageError(true)}
    />
  )
}
