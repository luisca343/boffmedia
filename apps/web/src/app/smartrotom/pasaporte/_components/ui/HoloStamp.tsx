// PAPER. The overprint that surfaces on a page while it is under the lamp.

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A holographic ring, multiplied into the stock so it tints the paper instead of covering
 * it. It appears only during inspection — a security feature that were always visible
 * would just be decoration.
 */
export function HoloStamp({
  show,
  children,
  className,
}: {
  show: boolean
  children?: ReactNode
  className?: string
}) {
  const t = useTranslations("pasaporte")
  const content = children ?? (
    <>
      {t("holoStamp.seal")}
      <br />
      TERAS
      <br />
      {t("holoStamp.valid")}
    </>
  )

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-[2.125rem] top-[40%] z-[7] h-[7.5rem] w-[7.5rem] rotate-[-12deg]",
        "transition-all duration-300 motion-reduce:transition-none",
        show ? "scale-100 opacity-75" : "scale-[.7] opacity-0",
        className,
      )}
    >
      <div className="ps-holo-ring grid h-full w-full place-items-center rounded-full text-center font-ps-mono text-[0.6875rem] tracking-[.12em] text-ps-teal-deep">
        {content}
      </div>
    </div>
  )
}
