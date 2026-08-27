"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ToolCard as UiToolCard, type ToolCardData } from "@boffmedia/ui"

/**
 * The site's tool card: the shared `@boffmedia/ui` card plus this host's badge
 * copy.
 *
 * The package cannot resolve these itself — it has no next-intl and no opinion
 * about where a host keeps its messages — so the one thing this wrapper adds is
 * the `toolsUi.card` namespace. Navigation needs no wrapping: `configureUi`
 * already registers `next/link` as the package's `Link`.
 */
export function ToolCard({ tool, variant = "senal" }: { tool: ToolCardData; variant?: "senal" | "fila" }) {
  const tCard = useTranslations("toolsUi.card")
  const labels = React.useMemo(
    () => ({ isNew: tCard("new"), soon: tCard("soon"), popular: tCard("popular") }),
    [tCard],
  )
  return <UiToolCard tool={tool} variant={variant} labels={labels} />
}
