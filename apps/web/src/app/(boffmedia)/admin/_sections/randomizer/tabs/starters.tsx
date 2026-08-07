"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function StartersTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <AvPanel title={t("tabs.starters")} className="border-l-[3px] border-l-accent bg-accent-soft/10">
      <p className="text-sm text-txt-muted">
        {t("tabs.starters")} — Placeholder for per-control wiring (coming in later pass)
      </p>
    </AvPanel>
  )
}
