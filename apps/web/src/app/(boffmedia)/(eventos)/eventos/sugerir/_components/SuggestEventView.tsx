"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@/components/boffmedia/primitives/toast"
import { SuggestForm } from "./SuggestForm"
import { SuggestSuccess } from "./SuggestSuccess"
import { Guidelines } from "./Guidelines"

export interface SuggestFormData {
  title: string
  gameName: string
  type: string
  description: string
  additionalInfo: string
  suggestedDate: string
  endDate: string
  maxParticipants: string
}

const EMPTY: SuggestFormData = {
  title: "",
  gameName: "",
  type: "",
  description: "",
  additionalInfo: "",
  suggestedDate: "",
  endDate: "",
  maxParticipants: "",
}

export function SuggestEventView() {
  const t = useTranslations("events.sugerir")
  const [data, setData] = React.useState<SuggestFormData>(EMPTY)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const set = React.useCallback((field: keyof SuggestFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const submit = React.useCallback(async () => {
    setSubmitting(true)
    // No suggest-event endpoint exists yet (tracked in BOFFMEDIA_V3_DEFERRED.md);
    // the suggestion is captured client-side until the backend lands.
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSubmitted(true)
    toast.success(t("toast"))
  }, [t])

  const reset = React.useCallback(() => {
    setData(EMPTY)
    setSubmitted(false)
  }, [])

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(44px,6vw,72px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[16px]/[1.55] text-txt-muted">{t("lead")}</p>
      </div>

      {submitted ? (
        <SuggestSuccess onReset={reset} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <SuggestForm data={data} onChange={set} onSubmit={submit} submitting={submitting} />
          <Guidelines />
        </div>
      )}
    </main>
  )
}
