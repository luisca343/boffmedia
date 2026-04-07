"use client"

import SpinnerItem from "./SpinnerItem"

interface SpinnerProps {
  spinItems: string[]
  scrollPosition: number
  isSpinning: boolean
  spinComplete: boolean
  winnerIndex: number | null
  spinnerRef: React.RefObject<HTMLDivElement | null>
  itemsContainerRef: React.RefObject<HTMLDivElement | null>
  ITEM_WIDTH: number
}

export default function Spinner({
  spinItems,
  scrollPosition,
  isSpinning,
  spinComplete,
  winnerIndex,
  spinnerRef,
  itemsContainerRef,
  ITEM_WIDTH
}: SpinnerProps) {
  return (
    <div className="relative w-full max-w-3xl">
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
          borderColor: "rgba(249,115,22,0.35)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 40px rgba(249,115,22,0.08)",
        }}
      >
        {/* Top neon bar */}
        <div className="h-[3px] bg-gradient-to-r from-primary-400 via-orange-400 to-primary-600" style={{ opacity: 0.85 }} />

        <div className="p-4">
          {/* Header */}
          <div
            className="py-2 px-4 mb-4 rounded-lg border text-center"
            style={{
              background: "rgba(15,23,42,0.6)",
              borderColor: "rgba(249,115,22,0.2)",
            }}
          >
            <h3
              className="text-base font-bold"
              style={{ color: "rgb(251,146,60)", fontFamily: "Orbitron, sans-serif" }}
            >
              Ruleta del Sorteo
            </h3>
          </div>

          {/* Viewport */}
          <div
            ref={spinnerRef}
            className="relative h-64 overflow-hidden rounded-lg border"
            style={{
              background: "rgba(10,15,28,0.8)",
              borderColor: "rgba(249,115,22,0.2)",
            }}
          >
            <div
              ref={itemsContainerRef}
              className="absolute inset-y-0 left-0 flex items-center h-full"
              style={{
                transform: `translateX(${-scrollPosition}px)`,
                transition: spinComplete ? "transform 0.5s ease-out" : "none",
              }}
            >
              {spinItems.map((name, index) => (
                <SpinnerItem
                  key={`${name}-${index}`}
                  name={name}
                  index={index}
                  isWinningItem={winnerIndex === index}
                  spinComplete={spinComplete}
                />
              ))}
            </div>

            {/* Fade masks */}
            <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-surface-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-surface-950 to-transparent z-20 pointer-events-none" />

            {/* Center markers */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 z-40
              border-l-[10px] border-l-transparent
              border-r-[10px] border-r-transparent
              border-t-[14px] border-t-primary-400" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 z-40
              border-l-[10px] border-l-transparent
              border-r-[10px] border-r-transparent
              border-b-[14px] border-b-primary-400" />
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-px z-30 pointer-events-none"
              style={{ background: "rgba(251,146,60,0.35)" }} />
          </div>

          {/* Pulse dots */}
          <div className="mt-4 flex justify-between items-center px-2">
            {[0, 0.4, 0.8].map((delay, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: "rgb(251,146,60)", animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
