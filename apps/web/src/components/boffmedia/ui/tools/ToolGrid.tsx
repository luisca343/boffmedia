"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ToolGrid as UiToolGrid, type ToolCardData } from "@boffmedia/ui"

/**
 * Responsive card grid shared by the hub and the category landings. `variant`
 * switches the card skin (and column sizing) — «fila» compact rows (default) or
 * «señal» rich cards.
 *
 * Like `ToolCard`, this exists only to bind the host's badge copy; the layout
 * and the card live in `@boffmedia/ui`.
 */
export function ToolGrid({ tools, variant = "fila" }: { tools: ToolCardData[]; variant?: "senal" | "fila" }) {
  const tCard = useTranslations("toolsUi.card")
  const labels = React.useMemo(
    () => ({ isNew: tCard("new"), soon: tCard("soon"), popular: tCard("popular") }),
    [tCard],
  )
  return <UiToolGrid tools={tools} variant={variant} labels={labels} />
}
