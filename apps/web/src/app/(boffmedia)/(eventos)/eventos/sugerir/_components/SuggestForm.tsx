"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Panel, Field, Input, Textarea, Select, Button } from "@boffmedia/ui"
import { useGetGames } from "@/hooks/events/useGetGames"
import type { Game } from "@boffmedia/shared"
import { TypeCards } from "./TypeCards"
import { EventPreviewCard } from "./EventPreviewCard"
import type { SuggestFormData } from "./SuggestEventView"

interface SuggestFormProps {
  data: SuggestFormData
  onChange: (field: keyof SuggestFormData, value: string) => void
  onSubmit: () => void
  submitting: boolean
}

export function SuggestForm({ data, onChange, onSubmit, submitting }: SuggestFormProps) {
  const t = useTranslations("sugerir")
  const { games } = useGetGames()

  const gameOptions = React.useMemo(() => {
    const list = (games as Game[]) ?? []
    return [
      { value: "", label: t("fields.gamePh") },
      ...list.map((g) => ({ value: g.title, label: g.title })),
      { value: "__other__", label: t("fields.gameOther") },
    ]
  }, [games, t])

  const canSubmit = !!data.title.trim() && !!data.description.trim() && !!data.type

  return (
    <Panel className="[--cut-lg:18px]">
      <form
        className="grid gap-7"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit && !submitting) onSubmit()
        }}
      >
        <TypeCards value={data.type} onChange={(v) => onChange("type", v)} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label={t("fields.title")}>
            <Input
              value={data.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder={t("fields.titlePh")}
              maxLength={80}
            />
          </Field>
          <Select
            label={t("fields.game")}
            value={data.gameName}
            options={gameOptions}
            onChange={(v) => onChange("gameName", v)}
          />
        </div>

        <Field label={t("fields.description")}>
          <Textarea
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={t("fields.descriptionPh")}
            rows={4}
          />
        </Field>

        <Field label={t("fields.extra")}>
          <Textarea
            value={data.additionalInfo}
            onChange={(e) => onChange("additionalInfo", e.target.value)}
            placeholder={t("fields.extraPh")}
            rows={3}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label={t("fields.start")}>
            <Input type="date" value={data.suggestedDate} onChange={(e) => onChange("suggestedDate", e.target.value)} />
          </Field>
          <Field label={t("fields.end")}>
            <Input type="date" value={data.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
          </Field>
          <Field label={t("fields.max")}>
            <Input
              type="number"
              min={1}
              value={data.maxParticipants}
              onChange={(e) => onChange("maxParticipants", e.target.value)}
              placeholder={t("fields.maxPh")}
            />
          </Field>
        </div>

        <EventPreviewCard data={data} />

        <Button
          type="submit"
          variant="pri"
          size="lg"
          icon="sparkles"
          loading={submitting}
          disabled={!canSubmit}
          className="justify-self-start"
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Panel>
  )
}
