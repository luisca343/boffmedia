"use client"

import { useEffect, useState } from "react"
import { Icon } from "../../_components/ui"

interface ScorePopupProps {
  scoreIncrease: number
}

/** The coins a flip just added, floating over the cabinet for a second. */
export default function ScorePopup({ scoreIncrease }: ScorePopupProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (scoreIncrease > 0) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [scoreIncrease])

  if (!show) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-10 z-[150] mx-auto w-max animate-ar-pop rounded-full border border-ar-amber/50 bg-black/75 px-4 py-2 shadow-[0_0_30px_-6px_rgb(var(--ar-amber)/.6)] motion-reduce:animate-none"
    >
      <span className="inline-flex animate-ar-float items-center gap-2 font-ar-mono text-[0.8125rem] font-bold tabular-nums text-ar-amber motion-reduce:animate-none">
        <Icon.Coin s={16} />+{scoreIncrease} monedas
      </span>
    </div>
  )
}
