"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Icon } from "./Icon"

/**
 * The sticky title bar of a sub-screen. Blurs the timeline scrolling underneath it,
 * which is why `bg-rk-nav` is a pre-composited translucent colour rather than a token
 * with an alpha channel — a `/85` on a triplet would blur the wrong layer.
 */
export interface SubHeaderProps {
  title: string
  subtitle?: string
  /** Renders a back arrow that pops the history stack. */
  back?: boolean
  right?: ReactNode
}

export function SubHeader({ title, subtitle, back = false, right }: SubHeaderProps) {
  const router = useRouter()
  const t = useTranslations("rooker")

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3.5 border-b border-rk-line bg-rk-nav px-3.5 py-2.5 backdrop-blur-md">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("common.back")}
          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-rk-fg transition-colors hover:bg-rk-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-rk-accent"
        >
          <Icon name="back" size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[18px] font-bold leading-[1.1] text-rk-fg">{title}</h1>
        {subtitle && <p className="truncate text-[12.5px] text-rk-fg-subtle">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
