// DESK. The inspector's own chip — it belongs to the counter, not to the document.

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/**
 * "VERIFICADO — Gobierno de Teras · Control de Fronteras". The spinning holo tile is a
 * loop, so it carries `ps-loop` (parked by `data-motion="off"`) as well as the reduced-
 * motion guard.
 */
export function VerifyBadge({ show, className }: { show: boolean; className?: string }) {
  const t = useTranslations("pasaporte")
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "pointer-events-none fixed right-[26px] top-[76px] z-[61] flex items-center gap-2.5 rounded-lg px-4 py-2.5",
        "border border-ps-gild/50 bg-ps-navy-deep/90 backdrop-blur-[8px]",
        "shadow-[0_0_28px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.08)]",
        "transition-all duration-300 motion-reduce:transition-none",
        show ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3.5 scale-95 opacity-0",
        className,
      )}
    >
      <span className="ps-holo ps-loop grid h-[34px] w-[34px] place-items-center rounded-lg animate-ps-spin motion-reduce:animate-none">
        <Icon name="shield" className="h-[18px] w-[18px] text-ps-navy-deep" />
      </span>
      <span className="font-ps-mono">
        <b className="block text-[13px] font-bold tracking-[.18em] text-ps-gild-hi">{t("verifyBadge.verified")}</b>
        <span className="text-[10px] tracking-[.08em] text-ps-chrome-subtle">{t("verifyBadge.subtitle")}</span>
      </span>
    </div>
  )
}
