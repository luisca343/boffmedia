"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function FoesTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <AvPanel title={t("tabs.foes")} className="border-l-[3px] border-l-accent bg-accent-soft/10">
      <p className="text-sm text-txt-muted">
        {t("tabs.foes")} — Placeholder for per-control wiring (coming in later pass)
      </p>
    </AvPanel>
  )
}
