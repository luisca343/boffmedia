import { FloatingBackground } from "./FloatingBackground"

interface FloatingSectionProps {
  children: React.ReactNode
  hue?: number
  showBlobs?: boolean
  showGrid?: boolean
  showBackground?: boolean
  className?: string
  style?: React.CSSProperties
  overflow?: string
}

export function FloatingSection({
  children,
  hue = 200,
  showBlobs = true,
  showGrid = true,
  showBackground = true,
  className = "",
  style = {},
  overflow = "overflow-hidden",
}: FloatingSectionProps) {
  return (
    <section
      className={`relative ${overflow} ${className}`}
      style={style}
    >
      {showBackground && (
        <FloatingBackground
          hue={hue}
          showBlobs={showBlobs}
          showGrid={showGrid}
        />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </section>
  )
}
