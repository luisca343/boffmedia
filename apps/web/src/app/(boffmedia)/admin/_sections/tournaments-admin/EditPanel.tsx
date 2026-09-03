"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Field, Input, Select, Button, toast } from "@boffmedia/ui"
import { AvPanel } from "../../_components/ui/av-kit"
import { ImageUploadField } from "@/components/shared/media/ImageUploadField"
import {
  TournamentsService,
  type TnTeamsheetVisibility,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"

const TEXTAREA = "w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[0.8125rem]"

/**
 * The settings form, in fieldsets. One draft, one save: the four panels are
 * groupings of the same form, not four forms.
 *
 * `registrationOpen` is deliberately not here. The window is flipped from the
 * overview, and a form that also carried it would quietly overwrite that
 * switch with whatever value it loaded with.
 */
export function EditPanel({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const t = useTranslations("tournaments")
  const toLocal = (iso: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }
  const [name, setName] = useState(detail.name)
  const [description, setDescription] = useState(detail.description ?? "")
  const [rules, setRules] = useState(detail.rules ?? "")
  const [prizes, setPrizes] = useState(detail.prizes ?? "")
  const [banner, setBanner] = useState(detail.banner ?? "")
  const [bestOf, setBestOf] = useState(detail.bestOf)
  const [autoVerify, setAutoVerify] = useState<number | "">(detail.autoVerifyMinutes ?? "")
  const [maxParticipants, setMaxParticipants] = useState<number | "">(detail.maxParticipants ?? "")
  const [teamsheetRequired, setTeamsheetRequired] = useState(detail.teamsheetRequired)
  const [teamsheetVisibility, setTeamsheetVisibility] = useState<TnTeamsheetVisibility>(detail.teamsheetVisibility)
  const [entryDeadline, setEntryDeadline] = useState(toLocal(detail.entryDeadline))
  const [startDate, setStartDate] = useState(toLocal(detail.startDate))
  const [endDate, setEndDate] = useState(toLocal(detail.endDate))
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return toast.error(t("nameRequired"))
    setBusy(true)
    const r = await TournamentsService.update(detail.id, {
      name: name.trim(),
      description: description.trim() || null,
      rules: rules.trim() || null,
      prizes: prizes.trim() || null,
      banner: banner.trim() || null,
      bestOf,
      autoVerifyMinutes: autoVerify === "" ? null : autoVerify,
      maxParticipants: maxParticipants === "" ? null : maxParticipants,
      teamsheetRequired,
      teamsheetVisibility,
      entryDeadline: entryDeadline ? new Date(entryDeadline).toISOString() : null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    })
    setBusy(false)
    if (r.error) toast.error(r.error)
    else { toast.success(t("tournamentUpdated")); onChange() }
  }

  return (
    <div>
      <AvPanel title={t("groupIdentity")} icon="edit">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <ImageUploadField
              label={t("banner")}
              value={banner}
              onChange={setBanner}
              folder="tournaments"
              /* The tournament page renders the banner in a 3:1 box. */
              cropAspect={3}
            />
          </div>
          <Field label={t("description")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={TEXTAREA} />
          </Field>
        </div>
      </AvPanel>

      <AvPanel title={t("groupRules")} icon="sliders">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("bestOf")}>
              <Input type="number" min={1} value={bestOf} onChange={(e) => setBestOf(Math.max(1, +e.target.value || 1))} />
            </Field>
            <Field label={t("maxParticipants")}>
              <Input type="number" min={2} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Math.max(2, +e.target.value))} />
            </Field>
            <Field label={t("autoVerify")}>
              <Input type="number" min={1} value={autoVerify} onChange={(e) => setAutoVerify(e.target.value === "" ? "" : Math.max(1, +e.target.value))} placeholder="10" />
            </Field>
          </div>
          <Field label={t("rules")}>
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className={TEXTAREA} />
          </Field>
          <Field label={t("prizes")}>
            <textarea value={prizes} onChange={(e) => setPrizes(e.target.value)} rows={2} placeholder={t("prizesPlaceholder")} className={TEXTAREA} />
          </Field>
        </div>
      </AvPanel>

      <AvPanel title={t("groupEntry")} icon="users">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("teamsheetRequired")}>
            <Select
              value={teamsheetRequired ? "yes" : "no"}
              options={[
                { value: "no", label: t("teamsheetOptional") },
                { value: "yes", label: t("teamsheetMandatory") },
              ]}
              onChange={(v) => setTeamsheetRequired(v === "yes")}
            />
          </Field>
          <Field label={t("teamsheetVisibility")} hint={t("teamsheetVisibilityHint")}>
            <Select
              value={teamsheetVisibility}
              options={[
                { value: "private", label: t("teamsheetVisPrivate") },
                { value: "participants", label: t("teamsheetVisParticipants") },
                { value: "public", label: t("teamsheetVisPublic") },
              ]}
              onChange={(v) => setTeamsheetVisibility(v as TnTeamsheetVisibility)}
            />
          </Field>
          <Field label={t("entryDeadline")} hint={t("entryDeadlineHint")}>
            <Input type="datetime-local" value={entryDeadline} onChange={(e) => setEntryDeadline(e.target.value)} />
          </Field>
        </div>
      </AvPanel>

      <AvPanel title={t("groupDates")} icon="calendar">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("startDate")}>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={t("endDate")}>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
      </AvPanel>

      <div className="mb-[1.125rem] flex justify-end">
        <Button variant="pri" size="sm" icon="check" disabled={busy} onClick={save}>{t("saveChanges")}</Button>
      </div>
    </div>
  )
}
