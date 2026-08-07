"use client"

import { useTranslations } from "next-intl"
import { Icon, Tooltip } from "@boffmedia/ui"

interface InfoTooltipProps {
  tipKey?: string
}

export function InfoTooltip({ tipKey }: InfoTooltipProps) {
  const t = useTranslations("admin.randomizer")

  if (!tipKey) return null

  return (
    <Tooltip
      label={t(tipKey)}
      side="right"
      className="max-w-xs"
    >
      <Icon
        name="info"
        size={14}
        className="text-txt-muted hover:text-txt cursor-help transition-colors"
      />
    </Tooltip>
  )
}
