"use client"

import { useEffect, useState } from "react"

/**
 * Formats the time left until `target` as the arcade's "12h 24m" reset label.
 * Ticks every 30s — the label has minute resolution, so a faster clock would
 * just be re-renders. Returns `null` before mount and when the target is past,
 * so the caller can gate the whole row rather than render "0m".
 */
export function useCountdown(target: string | Date | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!target) {
      setLabel(null)
      return
    }
    const end = new Date(target).getTime()
    if (Number.isNaN(end)) {
      setLabel(null)
      return
    }

    const render = () => {
      const ms = end - Date.now()
      if (ms <= 0) {
        setLabel(null)
        return
      }
      const totalMinutes = Math.floor(ms / 60_000)
      const days = Math.floor(totalMinutes / (60 * 24))
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
      const minutes = totalMinutes % 60
      setLabel(days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
    }

    render()
    const id = setInterval(render, 30_000)
    return () => clearInterval(id)
  }, [target])

  return label
}
