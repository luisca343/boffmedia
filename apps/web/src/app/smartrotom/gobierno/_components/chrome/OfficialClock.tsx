"use client"

import { useEffect, useState } from "react"

const pad = (n: number) => String(n).padStart(2, "0")

// «Hora oficial» — the government's clock. Rendered only after mount, because a clock is
// the classic hydration mismatch: the server renders one second and the client another.
export function OfficialClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="hidden text-right sm:block">
      <div className="font-gt-mono text-[8.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        Hora oficial
      </div>
      <span className="font-gt-mono text-base tabular-nums tracking-[.04em] text-gt-ink-700">
        {now ? (
          <>
            {pad(now.getHours())}
            <span className="animate-gt-blink motion-reduce:animate-none">:</span>
            {pad(now.getMinutes())}
            <span className="text-[11px] text-gt-ink-400">:{pad(now.getSeconds())}</span>
          </>
        ) : (
          <span className="text-gt-ink-300">--:--</span>
        )}
      </span>
    </div>
  )
}
