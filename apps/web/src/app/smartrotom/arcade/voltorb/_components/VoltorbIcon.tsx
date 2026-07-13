import Image from "next/image"
import { cn } from "@/lib/utils"

const SIZE = { sm: 16, md: 24, lg: 32, xl: 48 } as const

export type VoltorbImageSize = keyof typeof SIZE

type VoltorbImageProps = {
  size?: VoltorbImageSize
  /** The bomb lights up magenta when it is the thing that ended the run. */
  glow?: boolean
  className?: string
}

/**
 * The Voltorb itself. A real sprite asset rather than an `Icon` glyph — the
 * arcade icon set is UI chrome, and this is the game's mascot.
 */
export default function VoltorbImage({ size = "md", glow = false, className }: VoltorbImageProps) {
  const px = SIZE[size]
  return (
    <Image
      src="/smartrotom/img/apps/arcade/voltorb.png"
      alt="Voltorb"
      width={px}
      height={px}
      className={cn(
        glow &&
          "[filter:drop-shadow(0_0_8px_rgb(255_46_147/.9))_drop-shadow(0_0_20px_rgb(255_46_147/.45))]",
        className,
      )}
    />
  )
}
