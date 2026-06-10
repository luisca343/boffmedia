interface FloatingBackgroundProps {
  hue?: number
  showBlobs?: boolean
  showGrid?: boolean
  className?: string
}

export function FloatingBackground({
  hue = 200,
  showBlobs = true,
  showGrid = true,
  className = ""
}: FloatingBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Hue-based SVG gradient background */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.7 }}
      >
        <defs>
          <linearGradient id="floating-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`oklch(0.6 0.16 ${hue} / 0.08)`} />
            <stop offset="50%" stopColor={`oklch(0.55 0.15 ${hue + 30} / 0.04)`} />
            <stop offset="100%" stopColor={`oklch(0.5 0.14 ${hue + 60} / 0.08)`} />
          </linearGradient>
          <filter id="floating-blur">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#floating-grad)" />
        <path
          d={`M0,400 Q300,200 600,300 T1200,250 L1200,0 L0,0 Z`}
          fill={`oklch(0.6 0.16 ${hue} / 0.12)`}
          opacity="0.4"
        />
        <path
          d={`M0,600 Q400,400 800,500 T1200,450 L1200,800 L0,800 Z`}
          fill={`oklch(0.55 0.15 ${hue + 40} / 0.08)`}
          opacity="0.3"
        />
      </svg>

      {/* Animated blobs - same as handoff */}
      {showBlobs && (
        <style>{`
          @keyframes float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.08); } }
          @keyframes float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-36px,24px) scale(1.1); } }
        `}</style>
      )}
      {showBlobs && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              width: "40vw",
              height: "40vw",
              maxWidth: "460px",
              maxHeight: "460px",
              top: "-8%",
              left: "-6%",
              background: `oklch(0.6 0.16 ${hue} / 0.4)`,
              filter: "blur(60px)",
              opacity: 0.5,
              animation: "float-a 22s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "36vw",
              height: "36vw",
              maxWidth: "420px",
              maxHeight: "420px",
              top: "30%",
              right: "-8%",
              background: "color-mix(in srgb, var(--orange-500) 30%, transparent)",
              filter: "blur(60px)",
              opacity: 0.5,
              animation: "float-b 26s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "30vw",
              height: "30vw",
              maxWidth: "360px",
              maxHeight: "360px",
              bottom: "-6%",
              left: "30%",
              background: `oklch(0.55 0.16 ${hue + 40} / 0.34)`,
              filter: "blur(60px)",
              opacity: 0.5,
              animation: "float-a 30s ease-in-out infinite reverse",
            }}
          />
        </>
      )}

      {/* Dot grid - same as handoff */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(var(--grid-dot, rgba(255,255,255,0.04)) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            opacity: 0.6,
          }}
        />
      )}
    </div>
  )
}
