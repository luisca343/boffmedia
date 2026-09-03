import { useTranslations } from "next-intl"
import { locId } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { STAT_KEYS, STAT_SHORT } from "../_utils/constants"
import { displayName, statAt } from "../_utils/derive"

/**
 * One colour per compared Pokémon. Raw hex, because they are SVG strokes and fills —
 * the sanctioned escape hatch. Four, to match the comparison cap.
 */
export const COMPARE_COLORS = ["#4f9bff", "#fb7185", "#38d39f", "#f5b740"] as const

export const compareColor = (i: number) => COMPARE_COLORS[i % COMPARE_COLORS.length]

const SIZE = 230
const CX = SIZE / 2
const CY = SIZE / 2 + 6
const R = 78
const RINGS = [0.25, 0.5, 0.75, 1]

const angle = (i: number) => ((-90 + i * 60) * Math.PI) / 180
const point = (i: number, r: number): [number, number] => [
  CX + r * Math.cos(angle(i)),
  CY + r * Math.sin(angle(i)),
]
const poly = (radii: number[]) => radii.map((r, i) => point(i, r).join(",")).join(" ")

export interface StatRadarProps {
  mons: Mon[]
}

/** Six axes, one polygon per Pokémon. Scaled to the strongest stat on the board. */
export function StatRadar({ mons }: StatRadarProps) {
  const t = useTranslations("pc")
  const maxStat = Math.max(150, ...mons.flatMap((m) => STAT_KEYS.map((k) => statAt(m.pokemon.stats, k))))

  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg width={SIZE} height={SIZE} className="overflow-visible" role="img" aria-label={t("detail.stats")}>
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={poly(STAT_KEYS.map(() => R * ring))}
            fill="none"
            stroke="rgb(255 255 255 / .09)"
            strokeWidth="1"
          />
        ))}

        {STAT_KEYS.map((k, i) => {
          const [x, y] = point(i, R)
          const [lx, ly] = point(i, R + 16)
          return (
            <g key={k}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="rgb(255 255 255 / .09)" strokeWidth="1" />
              <text
                x={lx}
                y={ly}
                fill="rgb(var(--pc-fg-subtle))"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-pc-mono"
              >
                {STAT_SHORT[k]}
              </text>
            </g>
          )
        })}

        {mons.map((m, mi) => {
          const c = compareColor(mi)
          const radii = STAT_KEYS.map((k) => R * (statAt(m.pokemon.stats, k) / maxStat))
          return (
            <g key={locId(m.loc)}>
              <polygon points={poly(radii)} fill={`${c}24`} stroke={c} strokeWidth="2" strokeLinejoin="round" />
              {radii.map((r, i) => {
                const [x, y] = point(i, r)
                return <circle key={STAT_KEYS[i]} cx={x} cy={y} r="2.5" fill={c} />
              })}
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-3">
        {mons.map((m, mi) => (
          <span
            key={locId(m.loc)}
            className="flex items-center gap-1.5 text-xs text-pc-fg"
          >
            <span className="h-[0.6875rem] w-[0.6875rem] rounded-[3px]" style={{ background: compareColor(mi) }} />
            {displayName(m.pokemon)}
          </span>
        ))}
      </div>
    </div>
  )
}
