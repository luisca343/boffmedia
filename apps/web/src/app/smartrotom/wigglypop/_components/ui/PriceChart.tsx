"use client"

import { useTranslations } from "next-intl"
import { fmt } from "../../_utils/format"

/**
 * The price-history sparkline.
 *
 * The data is DERIVED from real completed sales of the same species, not a generated
 * curve. On a young marketplace most species have **no sales at all**, so this renders
 * nothing below two points rather than drawing a straight line through a single sale and
 * implying a trend that does not exist.
 *
 * The stroke is green when the last point is at or above the first, rose when it is
 * below — the one place in the app where colour alone carries direction, which is
 * acceptable because the min/max figures underneath state it in numbers too.
 */
export function PriceChart({ data, height = 78 }: { data: number[]; height?: number }) {
  const t = useTranslations("wigglypop")
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center font-wp text-[12px] font-semibold text-wp-fg-subtle"
        style={{ height }}
      >
        {t("chart.notEnoughSales")}
      </div>
    )
  }

  const w = 300
  const pad = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`
  const up = data[data.length - 1] >= data[0]
  // Raw hex: an SVG fill/stroke, which a Tailwind token cannot reach.
  const stroke = up ? "#11b39a" : "#f15b7a"
  const gid = `wp-chart-${up ? "up" : "down"}`

  return (
    <>
      <svg
        className="block h-[78px] w-full"
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t("chart.ariaLabel", { from: fmt(data[0]), to: fmt(data[data.length - 1]) })}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.2" fill={stroke} />
      </svg>
      <div className="mt-1 flex justify-between font-wp text-[11px] font-semibold text-wp-fg-subtle">
        <span>{t("chart.min", { min: fmt(min) })}</span>
        <span>{t("chart.max", { max: fmt(max) })}</span>
      </div>
    </>
  )
}
