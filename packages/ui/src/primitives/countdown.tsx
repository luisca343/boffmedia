import * as React from "react"
import { cn } from "../cn"
import { useRootT } from "../i18n"
import { Icon } from "./icon"

/**
 * Live countdown to an event start. Renders nothing once the date has passed.
 * @param ns - Namespace for translation keys (default: "events.countdown"). Can
 *   be overridden by callers that need different keys (e.g. the desktop launcher
 *   uses "common.giveaways.countdown").
 */
export function Countdown({ date, compact, className, ns = "events.countdown" }: { date: string; compact?: boolean; className?: string; ns?: string }) {
  const t = useRootT()
  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  // null on the server + first client render → no hydration mismatch
  if (now == null) return null
  const diff = new Date(date).getTime() - now
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)

  const seg = (v: number, l: string) => (
    <span className="inline-flex items-baseline gap-1">
      <b className={cn("font-display font-extrabold italic leading-none text-txt", compact ? "text-[15px]" : "text-[20px]")}>
        {String(v).padStart(2, "0")}
      </b>
      <small className="font-mono text-[9px] uppercase leading-none tracking-[0.1em] text-txt-muted">{l}</small>
    </span>
  )

  return (
    <span className={cn("inline-flex items-center", compact ? "gap-[7px]" : "gap-[10px]", className)}>
      <Icon name="clock" size={13} className="flex-none text-accent" />
      {d > 0 && seg(d, t(`${ns}.days`))}
      {seg(h, t(`${ns}.hours`))}
      {seg(m, t(`${ns}.minutes`))}
    </span>
  )
}
