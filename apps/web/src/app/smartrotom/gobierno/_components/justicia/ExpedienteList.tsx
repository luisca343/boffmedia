"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Empty, TableSkeleton } from "../ui"
import { EXPEDIENTE_STATUS, TONES, type Tone } from "../../_utils/tones"
import type { Expediente } from "../../_types"

export function ExpedienteList({
  expedientes,
  isLoading,
  selectedId,
  onSelect,
}: {
  expedientes: Expediente[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const t = useTranslations("gobierno")
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-gt border border-gt-line bg-gt-paper-0 p-3.5">
            <TableSkeleton rows={2} cols={2} />
          </div>
        ))}
      </div>
    )
  }

  if (expedientes.length === 0) {
    return (
      <Empty
        icon="folder"
        title={t("expedientes.emptyList")}
        sub={t("expedientes.emptyListSub")}
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {expedientes.map((c) => {
        const stMeta = EXPEDIENTE_STATUS[c.status]
        const st = { label: stMeta ? t(stMeta.labelKey) : c.status, tone: stMeta?.tone ?? ("default" as const) }
        const spineTone: Tone = c.status === "open" ? "justicia" : "ok"
        const on = c.id === selectedId
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`gt-spine w-full rounded-gt border p-[13px] text-left transition-shadow ${
              on ? "border-gt-dep-justicia shadow-gt" : "border-gt-line shadow-gt-sm hover:bg-gt-paper-1"
            }`}
            style={{ ["--gt-dep" as string]: TONES[spineTone].css }}
          >
            <div className="mb-[7px] flex items-center justify-between">
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">{c.code}</span>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <div className="flex items-center gap-[9px]">
              <Avatar user={c.subject.username} size={32} />
              <div className="min-w-0 font-gt-display text-[13.5px] font-bold leading-tight text-gt-ink-900">
                {c.title}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
