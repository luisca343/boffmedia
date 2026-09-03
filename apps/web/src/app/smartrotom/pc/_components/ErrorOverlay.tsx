"use client"

import { useTranslations } from "next-intl"
import { Button, Icon } from "./ui"

export interface ErrorOverlayProps {
  onRetry: () => void
  /** The real failure, when there is one worth showing. */
  message?: string
}

/** Shown when a PC query actually failed — never as a demo state. */
export function ErrorOverlay({ onRetry, message }: ErrorOverlayProps) {
  const t = useTranslations("pc")
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[290] flex animate-pc-fade flex-col items-center justify-center gap-[1.125rem] bg-[rgb(4_7_14_/_.9)] font-pc text-pc-fg backdrop-blur-sm motion-reduce:animate-none"
    >
      <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-[22px] border border-pc-rose/40 bg-pc-rose/[.12]">
        <Icon name="wifiOff" size={40} className="text-pc-rose" />
      </div>
      <div className="max-w-[20rem] text-center">
        <h2 className="mb-1.5 font-pc-display text-[1.1875rem] font-bold">{t("error.title")}</h2>
        <p className="text-[0.84375rem] text-pc-fg-muted">
          {message || t("error.retry")}
        </p>
      </div>
      <Button variant="primary" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        {t("common.retry")}
      </Button>
    </div>
  )
}
