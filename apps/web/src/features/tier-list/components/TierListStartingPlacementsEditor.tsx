"use client"

import { useTranslations } from "next-intl"
import type { TierListInstance, TierListTemplate } from "../core/schema"
import { TierList } from "./TierList"

/** Edit a reusable starting arrangement with the same controlled board and rules. */
export function TierListStartingPlacementsEditor({ template, onChange }: {
  template: TierListTemplate
  onChange: (initialPlacements: NonNullable<TierListTemplate["initialPlacements"]>) => void
}) {
  const t = useTranslations("tierLists")
  if (template.source.type === "reference") return <p className="text-sm text-txt-muted">{t("startingReferenceHint")}</p>
  const instance: TierListInstance = {
    id: "preset-preview", templateId: template.id, visibility: "private",
    placements: Object.fromEntries(template.rows.map((row, rowIndex) => [row.id,
      (template.initialPlacements?.[row.id] ?? []).map((itemId, index) => ({ id: `preset-${rowIndex}-${index}`, itemId })),
    ])),
  }
  return <div className="grid min-w-0 gap-4" data-tier-starting-placements>
    <p className="text-sm text-txt-muted">{t("startingPlacementsHint")}</p>
    <TierList template={template} instance={instance} items={template.source.items} display={{ rowControls: false }}
      onChange={(next) => onChange(Object.fromEntries(Object.entries(next.placements).filter(([, items]) => items.length).map(([rowId, items]) => [rowId, items.map(({ itemId }) => itemId)])))} />
  </div>
}
