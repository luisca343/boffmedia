"use client"

import { useTranslations } from "next-intl"
import { Panel, Icon } from "@boffmedia/ui"

const ITEMS = ["g1", "g2", "g3", "g4"] as const

export function Guidelines() {
  const t = useTranslations("sugerir.guidelines")
  return (
    <Panel title={t("title")} className="lg:sticky lg:top-[calc(var(--nav-h)_+_20px)]">
      <ul className="grid gap-3">
        {ITEMS.map((k) => (
          <li key={k} className="flex gap-3 font-body text-[0.875rem]/[1.5] text-txt-muted">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent-bright" />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
