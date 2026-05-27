export interface RopePathProps {
  d: string
  thickness?: number
  color?: string
}

/** Renders a stylized rope. Must be placed inside an `<svg>` element. */
export function RopePath({ d, thickness = 6, color = "#6b4a28" }: RopePathProps) {
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="#1a0e07"
        strokeWidth={thickness + 2}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke="#3a2410"
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray="6 4"
        opacity="0.55"
      />
      <path
        d={d}
        fill="none"
        stroke="#c8a26a"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.65"
      />
    </>
  )
}
