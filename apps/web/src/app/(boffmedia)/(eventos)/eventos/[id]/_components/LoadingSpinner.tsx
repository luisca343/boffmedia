"use client"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

export function LoadingSpinner({
  size = "lg",
  label = "Cargando evento...",
  className = "",
}: LoadingSpinnerProps) {
  const outer = { sm: "w-8 h-8", md: "w-14 h-14", lg: "w-20 h-20" }[size]
  const inner = { sm: "w-6 h-6 top-1 left-1", md: "w-10 h-10 top-2 left-2", lg: "w-14 h-14 top-3 left-3" }[size]

  return (
    <div className={`min-h-screen ${className}`}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-32">
          {/* Spinner */}
          <div className="relative">
            <div
              className={`${outer} rounded-full border-4`}
              style={{ borderColor: "rgba(249,115,22,0.12)" }}
            />
            <div
              className={`absolute top-0 left-0 ${outer} rounded-full border-4 border-transparent animate-spin`}
              style={{ borderTopColor: "rgba(249,115,22,0.8)" }}
            />
            <div
              className={`absolute ${inner} rounded-full border-4 border-transparent animate-spin`}
              style={{
                borderTopColor: "rgba(34,211,238,0.6)",
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
          </div>

          <p
            className="mt-8 text-xl font-black font-mono uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(251,146,60)" }}
          >
            {label}
          </p>
          <p className="mt-2 text-sm text-surface-500">Un momento, por favor</p>
        </div>
      </div>
    </div>
  )
}
