"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function GraphicsTab() {
  const t = useTranslations("admin.randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <AvPanel title={t("tabs.graphics")} className="border-l-[3px] border-l-accent bg-accent-soft/10">
      <p className="text-sm text-txt-muted">
        {t("tabs.graphics")} — Placeholder for per-control wiring (coming in later pass)
      </p>
    </AvPanel>
  )
}
