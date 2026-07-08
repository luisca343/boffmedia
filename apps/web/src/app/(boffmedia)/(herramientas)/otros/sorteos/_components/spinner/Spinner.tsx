"use client"

import SpinnerItem from "./SpinnerItem"
import { BOFF_VARIANTS } from "./boffVariants"

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

const boff   = BOFF_VARIANTS.primary;
const yellow = BOFF_VARIANTS.yellow;

export default function Spinner({
  spinItems,
  scrollPosition,
  isSpinning,
  spinComplete,
  winnerIndex,
  spinnerRef,
  itemsContainerRef,
}: SpinnerProps) {
  return (
    <div className="relative w-full">
      <div
        className="rounded-lg overflow-hidden border transition-all duration-500"
        style={{
          background: "linear-gradient(145deg, rgba(12,18,32,0.99), rgba(6,10,20,0.99))",
          borderColor: spinComplete ? yellow.border : boff.border,
          boxShadow: spinComplete
            ? `0 8px 40px rgba(0,0,0,0.7), 0 0 60px ${yellow.glow}`
            : `0 8px 40px rgba(0,0,0,0.7), 0 0 60px ${boff.glow}`,
        }}
      >
        {/* Top neon bar */}
        <div
          className={`h-[3px] bg-gradient-to-r transition-all duration-500 ${spinComplete ? yellow.bar : boff.bar}`}
        />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: isSpinning && !spinComplete ? "#ef4444" : spinComplete ? yellow.text : boff.text,
                  boxShadow: isSpinning && !spinComplete
                    ? "0 0 8px rgba(239,68,68,0.8)"
                    : `0 0 8px ${spinComplete ? yellow.glowStrong : boff.glowStrong}`,
                  animation: isSpinning && !spinComplete ? "pulse 0.8s infinite" : "none",
                }}
              />
              <h3
                className="text-sm font-bold transition-all duration-300"
                style={{
                  color: spinComplete ? yellow.text : boff.text,
                  fontFamily: "Orbitron, sans-serif",
                }}
              >
                {spinComplete ? "¡Ganador Seleccionado!" : isSpinning ? "Sorteando..." : "Ruleta del Sorteo"}
              </h3>
            </div>
          </div>

          {/* Viewport */}
          <div
            ref={spinnerRef}
            className="relative h-72 overflow-hidden rounded-lg border transition-all duration-500"
            style={{
              background: "rgba(3,5,12,0.95)",
              borderColor: spinComplete ? yellow.border : "rgba(249,115,22,0.2)",
              boxShadow: spinComplete
                ? `inset 0 0 50px ${yellow.glow}`
                : `inset 0 0 30px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Items */}
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

            {/* Scanlines */}
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
                opacity: 0.6,
              }}
            />

            {/* Fade masks */}
            <div
              className="absolute inset-y-0 left-0 w-36 z-30 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(3,5,12,1) 40%, transparent)" }}
            />
            <div
              className="absolute inset-y-0 right-0 w-36 z-30 pointer-events-none"
              style={{ background: "linear-gradient(to left, rgba(3,5,12,1) 40%, transparent)" }}
            />

            {/* Center selection indicator */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-[1px] z-40 pointer-events-none flex flex-col items-center">
              {/* Top arrow */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: `14px solid ${spinComplete ? yellow.text : boff.text}`,
                  filter: `drop-shadow(0 0 6px ${spinComplete ? yellow.glowStrong : boff.glowStrong})`,
                  transition: "border-color 0.5s ease",
                }}
              />
              {/* Vertical line */}
              <div
                className="flex-1 w-[2px]"
                style={{
                  background: spinComplete
                    ? `linear-gradient(to bottom, ${yellow.text}, rgba(250,204,21,0.08))`
                    : `linear-gradient(to bottom, ${boff.text}, rgba(249,115,22,0.08))`,
                  transition: "background 0.5s ease",
                }}
              />
              {/* Bottom arrow */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderBottom: `14px solid ${spinComplete ? yellow.text : boff.text}`,
                  filter: `drop-shadow(0 0 6px ${spinComplete ? yellow.glowStrong : boff.glowStrong})`,
                  transition: "border-color 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* Status row */}
          <div className="mt-3 flex items-center justify-center gap-2 min-h-[20px]">
            {!spinComplete ? (
              <div className="flex gap-1.5">
                {[0, 0.25, 0.5].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: boff.text, animationDelay: `${delay}s`, opacity: 0.7 }}
                  />
                ))}
              </div>
            ) : (
              <span
                className="text-xs font-bold tracking-[0.2em] uppercase"
                style={{ color: yellow.text, fontFamily: "Orbitron, sans-serif" }}
              >
                ✓ Ganador confirmado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
