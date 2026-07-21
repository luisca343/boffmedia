"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Overlay } from "../ui"

/**
 * The teleport. Blocking and undismissable on purpose: the fare has already been taken
 * and the player is mid-flight — there is nothing to cancel.
 */
export function TravelingOverlay({ stopId, reduceMotion }: { stopId: string; reduceMotion: boolean }) {
  const t = useTranslations("taxi.travelingOverlay")
  return (
    <Overlay>
      <div className="flex flex-col items-center gap-1.5 p-8 text-center" role="status" aria-live="polite">
        <div className="relative mb-3.5 grid h-[110px] w-[110px] place-items-center text-tx-accent">
          <span
            className={cn(
              "absolute inset-0 rounded-full border-2 border-solid border-tx-accent-soft border-t-tx-accent",
              !reduceMotion && "animate-spin motion-reduce:animate-none",
            )}
          />
          <span
            className={cn(
              "absolute inset-[14px] rounded-full border-2 border-solid border-tx-blue-400/20 border-t-tx-blue-400",
              !reduceMotion && "animate-[spin_1.4s_linear_infinite_reverse] motion-reduce:animate-none",
            )}
          />
          <Icon name="nav" size={34} stroke={2.2} />
        </div>
        <div className="text-xl font-extrabold text-tx-txt">{t("teleporting")}</div>
        <div className="text-sm text-tx-txt-2">
          {t("preparing", { destination: stopId })}
        </div>
        <div className="mt-4 h-[5px] w-[220px] overflow-hidden rounded-[3px] bg-tx-surface-2">
          <span
            className={cn(
              "block h-full rounded-[3px] bg-gradient-to-r from-tx-blue-400 to-tx-accent",
              reduceMotion ? "w-full" : "w-[40%] animate-tx-load motion-reduce:w-full motion-reduce:animate-none",
            )}
          />
        </div>
      </div>
    </Overlay>
  )
}
