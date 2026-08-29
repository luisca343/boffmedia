"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui"
import { SRT_COLORS } from "./draw-util"
import type { SrtWheelSegment } from "./draw-stage"

/** Wheel width per stage size — shared so a preview matches the live draw. */
export const SRT_WHEEL_SIZES = {
  default: "max-w-[420px]",
  // `large` IS presentation mode: size off the viewport height (the wheel is square).
  large: "max-w-[min(78vh,900px)]",
} as const

export interface SrtWheelSvgProps {
  segments: SrtWheelSegment[]
  currentIndex?: number
  landedIndex?: number
  showLabels: boolean
  gRef?: React.RefObject<SVGGElement | null>
  /** Name shown in the hub (truncated here); omit for a static preview. */
  hubName?: string
  className?: string
}

export function SrtWheelSvg({
  segments,
  currentIndex = 0,
  landedIndex,
  showLabels,
  gRef,
  hubName,
  className
}: SrtWheelSvgProps) {
  const rimRadius = 190
  const hubRadius = 46

  return (
    <div className={cn("mx-auto w-full", className)}>
      <svg viewBox="0 0 400 400" className="w-full h-auto">
        <defs>
          <filter id="wheelGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Segments group (rotates) */}
        <g ref={gRef} style={{ transformOrigin: "200px 200px", transition: "none" }}>
          {segments.map((seg, idx) => {
            // Segments are laid out clockwise from 12 o'clock; SVG angles start at 3 o'clock, hence -90.
            const startRad = ((seg.startAngle - 90) * Math.PI) / 180
            const endRad = ((seg.startAngle + seg.angle - 90) * Math.PI) / 180
            const midRad = (startRad + endRad) / 2

            const x1 = 200 + rimRadius * Math.cos(startRad)
            const y1 = 200 + rimRadius * Math.sin(startRad)
            const x2 = 200 + rimRadius * Math.cos(endRad)
            const y2 = 200 + rimRadius * Math.sin(endRad)

            const color = SRT_COLORS[idx % SRT_COLORS.length]
            const isDisplayed = landedIndex !== undefined ? idx === landedIndex : idx === currentIndex

            return (
              <g key={idx}>
                {/* Segment path */}
                <path
                  d={`M 200 200 L ${x1} ${y1} A ${rimRadius} ${rimRadius} 0 ${seg.angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                  fill={color}
                  stroke="var(--bg-deep)"
                  strokeWidth="1.5"
                />

                {/* Label if conditions met */}
                {showLabels && seg.angle >= 8 && (
                  <text
                    x={200 + (rimRadius - 20) * Math.cos(midRad)}
                    y={200 + (rimRadius - 20) * Math.sin(midRad)}
                    fill="currentColor"
                    opacity="0.85"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="end"
                    pointerEvents="none"
                    style={{
                      transform: `rotate(${(midRad * 180) / Math.PI}deg)`,
                      transformOrigin: `${200 + (rimRadius - 20) * Math.cos(midRad)}px ${
                        200 + (rimRadius - 20) * Math.sin(midRad)
                      }px`,
                      color: "#0b0b0c"
                    }}
                  >
                    {seg.name.length > 14 ? seg.name.slice(0, 14) + "…" : seg.name}
                  </text>
                )}

                {/* Highlight current/landed segment */}
                {isDisplayed && (
                  <path
                    d={`M 200 200 L ${x1} ${y1} A ${rimRadius} ${rimRadius} 0 ${seg.angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                    fill="none"
                    stroke="var(--txt)"
                    strokeWidth="2"
                  />
                )}
              </g>
            )
          })}
        </g>

        {/* Pointer ON the rim at 12 o'clock, pointing down (outside rotating group) */}
        <polygon
          points="187,0 213,0 200,24"
          fill="var(--accent)"
          stroke="var(--bg-deep)"
          strokeWidth="1.5"
          filter="url(#wheelGlow)"
        />

        {/* Hub circle */}
        <circle cx="200" cy="200" r={hubRadius} fill="var(--bg-deep)" stroke="var(--accent-line)" strokeWidth="2" />

        {/* Hub content (name or empty) */}
        {hubName && (
          <text
            x="200"
            y="205"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
            fill="var(--txt)"
            pointerEvents="none"
          >
            {hubName.length > 12 ? hubName.slice(0, 12) + "…" : hubName}
          </text>
        )}
      </svg>
    </div>
  )
}
