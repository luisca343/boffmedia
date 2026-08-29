"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Field, Input, Select, Button, Modal, SearchInput, Empty, Spinner, Icon, toast, Table, type SortState } from "@boffmedia/ui"
import { AvSectionHead, AvPill, AvViewLink, formatAdminDate } from "../../_components/ui/av-kit"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import {
  TournamentsService,
  type TnFormat,
  type TnKind,
  type TnTeamsheetVisibility,
  type TnPhaseInput,
  type TnStatus,
} from "@/services/api/boffmedia/tournamentsService"
import { FORMATS, KINDS } from "./constants"
import { PhasesEditor } from "./PhasesEditor"

const STATUS_TONE: Record<TnStatus, "default" | "green" | "accent" | "muted" | "rose"> = {
  draft: "default",
  registration: "green",
  live: "accent",
  completed: "muted",
  cancelled: "rose",
}

export function ListAndCreate({ onSelect }: { onSelect: (slug: string) => void }) {
  const t = useTranslations("tournaments")
  const tAdminCrud = useTranslations("admin.crud")
  const { tournaments, isLoading, error, refetch } = useTournaments()

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [sort, setSort] = useState<SortState | null>(null)

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [format, setFormat] = useState<TnFormat>("single")
  const [kind, setKind] = useState<TnKind>("solo")
  const [bestOf, setBestOf] = useState(1)
  const [metric, setMetric] = useState<"score" | "time">("score")
  const [unit, setUnit] = useState("pts")
  const [groupCount, setGroupCount] = useState(2)
  const [advanceCount, setAdvanceCount] = useState(2)
  const [maxParticipants, setMaxParticipants] = useState<number | "">("")
  const [teamsheetRequired, setTeamsheetRequired] = useState(false)
  const [teamsheetVisibility, setTeamsheetVisibility] = useState<TnTeamsheetVisibility>("private")
  const [phases, setPhases] = useState<TnPhaseInput[]>([])
  const [busy, setBusy] = useState(false)

  // Filter tournaments by name or slug
  let filtered = tournaments
    ? searchTerm
      ? tournaments.filter((tn) =>
          tn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tn.slug.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : tournaments
    : []

  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      if (sort.key === "name") {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (sort.key === "startDate") {
        aVal = a.startDate ? new Date(a.startDate).getTime() : 0
        bVal = b.startDate ? new Date(b.startDate).getTime() : 0
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * sort.dir
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * sort.dir
      }
      return 0
    })
  }

  const resetForm = () => {
    setName("")
    setFormat("single")
    setKind("solo")
    setBestOf(1)
    setMetric("score")
    setUnit("pts")
    setGroupCount(2)
    setAdvanceCount(2)
    setMaxParticipants("")
    setTeamsheetRequired(false)
    setTeamsheetVisibility("private")
    setPhases([])
  }

  const create = async () => {
    if (!name.trim()) return toast.error(t("nameRequired"))
    setBusy(true)
    const headlineFormat = phases.length > 0 ? phases[phases.length - 1].format : format
    const body: Record<string, unknown> = {
      name: name.trim(),
      format: headlineFormat,
      competitorKind: kind,
      bestOf,
      registrationOpen: true,
      teamsheetRequired,
      teamsheetVisibility,
    }
    if (headlineFormat === "leaderboard") { body.metric = metric; body.unit = unit }
    if (headlineFormat === "groups") { body.groupCount = groupCount; body.advanceCount = advanceCount }
    if (maxParticipants !== "") body.maxParticipants = maxParticipants
    if (phases.length > 0) body.phases = phases
    const r = await TournamentsService.create(body)
    setBusy(false)
    if (r.error || !r.data) return toast.error(r.error ?? t("nameRequired"))
    toast.success(t("tournamentCreated"))
    resetForm()
    refetch()
    setCreateOpen(false)
    onSelect(r.data.slug)
  }

  const handleCloseModal = () => {
    if (!busy) {
      resetForm()
      setCreateOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-5">
        <AvSectionHead title={t("title")} desc={t("subtitle")} />
        <div className="flex flex-col items-center justify-center gap-3 py-16 bg-panel border border-solid border-line">
          <Spinner size={28} className="text-accent" />
          <p className="text-sm text-txt-muted">{tAdminCrud("loading", { plural: t("plural") })}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-5">
        <AvSectionHead title={t("title")} desc={t("subtitle")} />
        <div className="text-center py-10 bg-panel border border-solid border-line">
          <span className="grid place-items-center w-12 h-12 mx-auto mb-4 text-accent bg-accent-soft border border-solid border-accent-line">
            <Icon name="alert" size={24} />
          </span>
          <h3 className="text-lg font-bold mb-2">{tAdminCrud("errorTitle", { plural: t("plural") })}</h3>
          <p className="text-sm text-txt-muted mb-6">{error}</p>
          <Button icon="refresh" onClick={refetch}>
            {tAdminCrud("retry")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <AvSectionHead title={t("title")} desc={t("subtitle")} />

      {/* Resource header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="font-mono text-[11px] font-bold leading-none uppercase tracking-[0.08em] text-txt-muted shrink-0">
          {tAdminCrud("count", { count: filtered.length, plural: t("plural") })}
        </span>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("searchTournaments")}
          size="sm"
          className="flex-1 min-w-[200px] max-w-[400px]"
        />
        <Button icon="plus" variant="pri" size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          {tAdminCrud("new")}
        </Button>
      </div>

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <Empty
          icon="search"
          title={searchTerm ? tAdminCrud("noResultsTitle") : tAdminCrud("emptyTitle", { plural: t("plural") })}
          lead={searchTerm ? tAdminCrud("noResultsLead") : tAdminCrud("emptyLead", { singular: t("singular") })}
        >
          {searchTerm ? (
            <Button variant="ghost" onClick={() => setSearchTerm("")}>
              {tAdminCrud("clearSearch")}
            </Button>
          ) : (
            <Button variant="pri" icon="plus" onClick={() => setCreateOpen(true)}>
              {tAdminCrud("newEntity", { singular: t("singular") })}
            </Button>
          )}
        </Empty>
      ) : (
        <Table
          columns={[
            { key: "name", label: t("colName"), sortable: true },
            { key: "format", label: t("colFormat") },
            { key: "status", label: t("colStatus") },
            { key: "entrants", label: t("colEntrants") },
            { key: "startDate", label: t("colDate"), sortable: true },
            { key: "actions", label: tAdminCrud("actions"), width: "92px" },
          ]}
          rows={filtered.map((tn) => ({
            id: tn.id,
            name: (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium">{tn.name}</span>
                <span className="font-mono text-[10px] text-txt-dim shrink-0">{tn.slug}</span>
              </div>
            ),
            format: <TnFormatBadge format={tn.format} size="sm" />,
            status: <AvPill tone={STATUS_TONE[tn.status]}>{t(`statusLabel.${tn.status}`)}</AvPill>,
            entrants: <span className="text-sm text-txt-muted">{tn.participantCount}</span>,
            startDate: <span className="text-sm text-txt-muted font-mono">{formatAdminDate(tn.startDate)}</span>,
            actions: (
              <div className="flex justify-end items-center gap-1.5">
                <button
                  aria-label={t("manage")}
                  onClick={() => onSelect(tn.slug)}
                  className="grid place-items-center px-3 h-8 border border-solid border-line-2 text-txt-muted hover:text-accent hover:border-accent-line transition-colors font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                >
                  {t("manage")}
                </button>
                <AvViewLink href={`/torneos/${tn.slug}`} compact aria-label={tAdminCrud("viewAction")} />
              </div>
            ),
          }))}
          rowKey={(r) => String((r as any).id)}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={handleCloseModal} title={t("newTournament")}>
        <p className="text-[13px] text-txt-muted mb-3">{t("createTournamentDesc")}</p>
        <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
          <Field label={t("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Copa Boffmedia" />
          </Field>
          <Field label={t("format")}>
            <Select value={format} options={[...FORMATS]} onChange={(v) => setFormat(v as TnFormat)} />
          </Field>
          <Field label={t("competitorType")}>
            <Select value={kind} options={[...KINDS]} onChange={(v) => setKind(v as TnKind)} />
          </Field>
          <Field label={t("bestOf")}>
            <Input type="number" min={1} value={bestOf} onChange={(e) => setBestOf(Math.max(1, +e.target.value || 1))} />
          </Field>
          {format === "leaderboard" && (
            <>
              <Field label={t("metric")}>
                <Select value={metric} options={["score", "time"]} onChange={(v) => setMetric(v as "score" | "time")} />
              </Field>
              <Field label={t("unit")}>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pts" />
              </Field>
            </>
          )}
          {format === "groups" && (
            <>
              <Field label={t("groupCount")}>
                <Input type="number" min={1} value={groupCount} onChange={(e) => setGroupCount(Math.max(1, +e.target.value || 1))} />
              </Field>
              <Field label={t("advancePerGroup")}>
                <Input type="number" min={1} value={advanceCount} onChange={(e) => setAdvanceCount(Math.max(1, +e.target.value || 1))} />
              </Field>
            </>
          )}
          <Field label={t("maxParticipantsOpt")}>
            <Input type="number" min={2} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Math.max(2, +e.target.value))} />
          </Field>
          {teamsheetRequired && (
            <Field label={t("teamsheetVisibility")}>
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
          )}
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
        </div>

        <div className="mt-4 max-h-[40vh] overflow-y-auto">
          <PhasesEditor phases={phases} onChange={setPhases} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCloseModal} disabled={busy}>
            {tAdminCrud("cancel")}
          </Button>
          <Button variant="pri" size="sm" icon="plus" disabled={busy} loading={busy} onClick={create}>
            {t("createTournament")}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
