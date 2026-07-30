"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import type { SuggestFormData } from "./SuggestEventView"

function fmtDate(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

export function EventPreviewCard({ data }: { data: SuggestFormData }) {
  const t = useTranslations("sugerir.preview")
  const game = data.gameName && data.gameName !== "__other__" ? data.gameName : t("noGame")
  const start = fmtDate(data.suggestedDate)

  return (
    <div className="cut-corner [--cut-lg:14px] border border-solid border-line-2 bg-base p-5 [[data-theme=light]_&]:bg-panel">
      <span className="mono-label">{t("title")}</span>
      <h3 className="mt-2 font-display text-[22px] font-extrabold italic uppercase leading-[0.95] tracking-[-0.005em] text-txt">
        {data.title.trim() || t("untitled")}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body text-[13px] text-txt-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="gamepad" size={14} />
          {game}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="calendar" size={14} />
          {start ?? t("noDate")}
        </span>
        {data.maxParticipants && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="users" size={14} />
            {t("maxLabel", { count: data.maxParticipants })}
          </span>
        )}
      </div>
      {data.description.trim() && (
        <p className="mt-3 line-clamp-3 font-body text-[14px]/[1.5] text-txt-muted">{data.description.trim()}</p>
      )}
    </div>
  )
}
