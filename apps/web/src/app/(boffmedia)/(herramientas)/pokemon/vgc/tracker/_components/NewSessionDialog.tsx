"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Modal, Field, Input, Select, Button, Icon } from "@/components/boffmedia/primitives"
import { DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import { VgcService, ChampionsRegulation, LimitlessTournament } from "@/services/api/boffmedia/vgcService"
import type { MatchFormat, Session, SessionType, TeamPreset } from "@/features/vgc-tracker/types"

interface Props {
  presets: TeamPreset[]
  onConfirm: (session: Omit<Session, "id" | "startedAt">) => void
  onClose: () => void
}

export function NewSessionDialog({ presets, onConfirm, onClose }: Props) {
  const t = useTranslations("vgc.tracker")
  const [sessionType, setSessionType] = useState<SessionType>("ladder")
  const [label, setLabel] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  const [format, setFormat] = useState<MatchFormat>("BO1")
  const [regulationId, setRegulationId] = useState("")
  const [activePresetId, setActivePresetId] = useState(presets[0]?.id ?? "")
  const [startElo, setStartElo] = useState("")
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [limitlessTournaments, setLimitlessTournaments] = useState<LimitlessTournament[]>([])
  const [limitlessTournamentId, setLimitlessTournamentId] = useState<number | undefined>(undefined)

  useEffect(() => {
    setFormat(sessionType === "tournament" ? "BO3" : "BO1")
  }, [sessionType])

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data)
        setRegulationId(res.data[0]?.id ?? "")
      }
    })
  }, [])

  useEffect(() => {
    if (sessionType !== "tournament" || !regulationId) return
    setLimitlessTournaments([])
    setLimitlessTournamentId(undefined)
    VgcService.getLimitlessTournaments(regulationId).then((res) => {
      if (res.success && res.data) setLimitlessTournaments(res.data.filter((x) => x.status === "done"))
    })
  }, [sessionType, regulationId])

  const canSubmit = !!label.trim() && !!regulationId

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const parsed = parseFloat(startElo)
    onConfirm({
      type: sessionType,
      label: label.trim(),
      format,
      regulationId,
      activePresetId,
      startElo: sessionType === "ladder" && !isNaN(parsed) ? parsed : undefined,
      tournamentName: sessionType === "tournament" ? tournamentName.trim() || undefined : undefined,
      limitlessTournamentId: sessionType === "tournament" ? limitlessTournamentId : undefined,
    })
  }

  return (
    <Modal open onClose={onClose} title={t("modals.newSession")}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <DkSeg
          value={sessionType}
          onChange={(v) => setSessionType(v as SessionType)}
          ariaLabel={t("filters.sessionType")}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { value: "ladder", label: <><Icon name="trending" size={13} /> {t("sessionType.ladder")}</> },
            { value: "tournament", label: <><Icon name="trophy" size={13} /> {t("sessionType.tournament")}</> },
          ]}
        />

        {sessionType === "tournament" && (
          <>
            <Field label={t("labels.tournamentName")}>
              <Input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder={t("placeholders.tournamentName")} />
            </Field>
            <Field
              label={
                <>
                  {t("labels.limitlessTournament")} <span className="font-normal normal-case text-txt-dim">({t("labels.optional")})</span>
                </>
              }
              hint={limitlessTournaments.length === 0 && regulationId ? t("labels.noImportedTournaments") : undefined}
            >
              <Select
                value={limitlessTournamentId != null ? String(limitlessTournamentId) : ""}
                onChange={(v) => setLimitlessTournamentId(v ? Number(v) : undefined)}
                options={[
                  { value: "", label: t("labels.noTournamentLink") },
                  ...limitlessTournaments.map((x) => ({
                    value: String(x.id),
                    label: `${x.name ?? x.limitlessId}${x.date ? ` · ${x.date}` : ""}`,
                  })),
                ]}
              />
            </Field>
          </>
        )}

        <Field label={t("labels.sessionLabel")}>
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("placeholders.sessionLabel")} />
        </Field>

        <div className={`grid gap-3 ${sessionType === "ladder" ? "grid-cols-2" : "grid-cols-1"}`}>
          <Field label={t("labels.format")}>
            <Select value={format} onChange={(v) => setFormat(v as MatchFormat)} options={["BO1", "BO3"]} />
          </Field>
          {sessionType === "ladder" && (
            <Field label={t("labels.startingElo")}>
              <Input type="number" value={startElo} onChange={(e) => setStartElo(e.target.value)} placeholder={t("placeholders.startingElo")} />
            </Field>
          )}
        </div>

        <Field label={t("labels.regulation")}>
          <Select value={regulationId} onChange={setRegulationId} options={regulations.map((r) => ({ value: r.id, label: r.name }))} />
        </Field>

        {presets.length > 0 && (
          <Field label={t("labels.teamPreset")}>
            <Select
              value={activePresetId}
              onChange={setActivePresetId}
              options={[{ value: "", label: t("labels.noPreset") }, ...presets.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </Field>
        )}

        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" onClick={onClose} className="flex-1">
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" variant="pri" size="sm" disabled={!canSubmit} className="flex-1">
            {t("buttons.startSession")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
