"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

const pad = (n: number) => String(n).padStart(2, "0")

// «Hora oficial» — the government's clock. Rendered only after mount, because a clock is
// the classic hydration mismatch: the server renders one second and the client another.
export function OfficialClock() {
  const t = useTranslations("gobierno")
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="hidden text-right sm:block">
      <div className="font-gt-mono text-[0.53125rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        {t("common.horaOficial")}
      </div>
      <span className="font-gt-mono text-base tabular-nums tracking-[.04em] text-gt-ink-700">
        {now ? (
          <>
            {pad(now.getHours())}
            <span className="animate-gt-blink motion-reduce:animate-none">:</span>
            {pad(now.getMinutes())}
            <span className="text-[0.6875rem] text-gt-ink-400">:{pad(now.getSeconds())}</span>
          </>
        ) : (
          <span className="text-gt-ink-300">--:--</span>
        )}
      </span>
    </div>
  )
}
