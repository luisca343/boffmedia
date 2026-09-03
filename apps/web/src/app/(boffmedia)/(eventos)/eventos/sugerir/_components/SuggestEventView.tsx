"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@boffmedia/ui"
import { SuggestionsService, type CreateSuggestionPayload } from "@/services/api/boffmedia/suggestionsService"
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
  const t = useTranslations("sugerir")
  const [data, setData] = React.useState<SuggestFormData>(EMPTY)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const set = React.useCallback((field: keyof SuggestFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const submit = React.useCallback(async () => {
    setSubmitting(true)
    try {
      const payload: CreateSuggestionPayload = {
        title: data.title,
        gameName: data.gameName,
        type: data.type,
        description: data.description,
      }
      if (data.additionalInfo) payload.additionalInfo = data.additionalInfo
      if (data.suggestedDate) payload.suggestedDate = data.suggestedDate
      if (data.endDate) payload.endDate = data.endDate
      if (data.maxParticipants) payload.maxParticipants = Number(data.maxParticipants)

      const res = await SuggestionsService.create(payload)
      if (res.error || res.success === false) {
        // 401 → not authenticated; anything else → generic failure.
        toast.error(res.statusCode === 401 ? t("loginRequired") : t("errorToast"))
        return
      }
      setSubmitted(true)
      toast.success(t("toast"))
    } catch {
      toast.error(t("errorToast"))
    } finally {
      setSubmitting(false)
    }
  }, [data, t])

  const reset = React.useCallback(() => {
    setData(EMPTY)
    setSubmitted(false)
  }, [])

  return (
    <main className="wrap pb-[5.625rem] pt-[2.125rem]">
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(2.75rem,6vw,4.5rem)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[1rem]/[1.55] text-txt-muted">{t("lead")}</p>
      </div>

      {submitted ? (
        <SuggestSuccess onReset={reset} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <SuggestForm data={data} onChange={set} onSubmit={submit} submitting={submitting} />
          <Guidelines />
        </div>
      )}
    </main>
  )
}
