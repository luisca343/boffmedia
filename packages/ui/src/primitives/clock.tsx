"use client"

import * as React from "react"
import { cn } from "../cn"

const pad = (n: number) => String(n).padStart(2, "0")

export function Clock({ className }: { className?: string }) {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const label = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : "00:00:00"
  return (
    <span className={cn("shrink-0 tabular-nums", className)} suppressHydrationWarning>
      {label}
    </span>
  )
}
