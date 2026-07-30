"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast, Spinner } from "@boffmedia/ui"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { UsersService } from "@/services/api/boffmedia/usersService"
import {
  TournamentsService,
  type TnFormat,
  type TnKind,
  type TnMatchApi,
  type TnStatus,
  type TnPhaseApi,
  type TnPhaseInput,
  type TnPhaseFormat,
  type TnAdvanceType,
  type TnParticipantStatus,
  type TnCompetitorApi,
} from "@/services/api/boffmedia/tournamentsService"
import { FORMATS, KINDS, PHASE_FORMATS, ADVANCE_TYPE_OPTIONS, PARTICIPANT_STATUS, VGC_PRESET, PHASE_STATUS_TONE } from "./constants"
import { SectionHead, Stat } from "./shared"

export function EditPanel({
  detail,
  onChange,
}: {
  detail: NonNullable<ReturnType<typeof useTournament>["tournament"]>
  onChange: () => void
}) {
  const t = useTranslations("tournaments")
  const toLocal = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : ""
  const [name, setName] = useState(detail.name)
  const [description, setDescription] = useState(detail.description ?? "")
  const [rules, setRules] = useState(detail.rules ?? "")
  const [prizes, setPrizes] = useState(detail.prizes ?? "")
  const [banner, setBanner] = useState(detail.banner ?? "")
  const [bestOf, setBestOf] = useState(detail.bestOf)
  const [autoVerify, setAutoVerify] = useState<number | "">(detail.autoVerifyMinutes ?? "")
  const [maxParticipants, setMaxParticipants] = useState<number | "">(detail.maxParticipants ?? "")
  const [regOpen, setRegOpen] = useState(detail.registrationOpen)
  const [startDate, setStartDate] = useState(toLocal(detail.startDate))
  const [endDate, setEndDate] = useState(toLocal(detail.endDate))
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const save = async () => {
    if (!name.trim()) return toast.error(t("nameRequired"))
    setBusy(true)
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      rules: rules.trim() || null,
      prizes: prizes.trim() || null,
      banner: banner.trim() || null,
      bestOf,
      autoVerifyMinutes: autoVerify === "" ? null : autoVerify,
      maxParticipants: maxParticipants === "" ? null : maxParticipants,
      registrationOpen: regOpen,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    }
    const r = await TournamentsService.update(detail.id, body)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else { toast.success(t("tournamentUpdated")); onChange() }
  }

  return (
    <Panel
      title={t("editTournament")}
      aside={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-mono text-[11px] text-accent transition-opacity hover:opacity-70"
        >
          {open ? t("hide") : t("edit")}
        </button>
      }
    >
      {open && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t("banner")}>
              <Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://…" />
            </Field>
            <Field label={t("bestOf")}>
              <Input type="number" min={1} value={bestOf} onChange={(e) => setBestOf(Math.max(1, +e.target.value || 1))} />
            </Field>
            <Field label={t("maxParticipants")}>
              <Input type="number" min={2} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Math.max(2, +e.target.value))} />
            </Field>
            <Field label={t("autoVerify")}>
              <Input type="number" min={1} value={autoVerify} onChange={(e) => setAutoVerify(e.target.value === "" ? "" : Math.max(1, +e.target.value))} placeholder="10" />
            </Field>
            <Field label={t("registration")}>
              <Select
                value={regOpen ? "yes" : "no"}
                options={[{ value: "yes", label: t("regOpen") }, { value: "no", label: t("regClosed") }]}
                onChange={(v) => setRegOpen(v === "yes")}
              />
            </Field>
            <Field label={t("startDate")}>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label={t("endDate")}>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label={t("description")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <Field label={t("rules")}>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <Field label={t("prizes")}>
            <textarea
              value={prizes}
              onChange={(e) => setPrizes(e.target.value)}
              rows={2}
              placeholder={t("prizesPlaceholder")}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <div className="flex justify-end">
            <Button variant="pri" size="sm" disabled={busy} onClick={save}>{t("saveChanges")}</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
