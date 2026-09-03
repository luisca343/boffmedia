import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Ticker } from "@boffmedia/ui"

// Keys, not literals — a module-scope `t()` would freeze whichever locale loaded
// first. `Ticker` renders each item as HTML, so the <em> stroke rides in the value.
// Four, not five: the old item4 was an invented ranking line ("AxelCraft lidera
// con 12 480 pts"). The remaining items are evergreen — no dates to go stale.
const TICKER_KEYS = ["item1", "item2", "item3", "item4"] as const

export function TopBar() {
  // Server Component: `useTranslations` is sync-valid here, so no "use client"
  // and no hooks that would require one (useMemo).
  const t = useTranslations("boffmedia.topbar")
  const tickerItems = TICKER_KEYS.map((k) => t(k))

  return (
    <div className="relative z-[60] flex h-10 items-center gap-3 border-b-2 border-accent bg-base-deep px-5 font-mono text-[0.6875rem] font-medium leading-none tracking-[0.04em] text-[#8b93a1] min-[640px]:gap-5 min-[640px]:px-10">
      <span className="shrink-0 animate-[bm-pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none bg-[var(--naranja)] px-2.5 py-[0.3125rem] font-bold tracking-[0.14em] text-accent-ink cut cut-edge-slant [--cut-line:var(--accent)] [--cut:6px]">
        {t("live")}
      </span>
      <Ticker items={tickerItems} />
      <Clock className="hidden text-[#c9cfd9] min-[520px]:block" />
    </div>
  )
}
