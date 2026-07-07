"use client"

import * as React from "react"

const fmt = (n: number) => n.toLocaleString("es-ES").replace(/ /g, " ").replace(/,/g, " ")

export function CountUp({ value, duration = 1400 }: { value: string | number; duration?: number }) {
  const target = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, "")) || 0
  const [n, setN] = React.useState(0)
  const ref = React.useRef<HTMLSpanElement>(null)
  const started = React.useRef(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const run = () => {
      if (started.current) return
      const r = el.getBoundingClientRect()
      const vH = window.innerHeight || 800
      if (r.top > vH || r.bottom < 0) return
      started.current = true
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setN(Math.round(target * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      window.removeEventListener("scroll", run)
    }
    run()
    window.addEventListener("scroll", run, { passive: true })
    return () => window.removeEventListener("scroll", run)
  }, [target, duration])

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {fmt(n)}
    </span>
  )
}
