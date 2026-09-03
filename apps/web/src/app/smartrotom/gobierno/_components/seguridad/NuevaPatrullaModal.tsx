"use client"

// Officer assignment reads the real roster (`useOficiales` — the GOB_* roles ARE the roster,
// there is no officers table). If it comes back empty because no other roles are seeded yet,
// the acting officer is still real data and stays selectable/pre-checked; nobody else is
// invented to fill the list.
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, Field, Modal, Select } from "../ui"
import { useCreatePatrulla, useOficiales } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { rankMeta } from "../poblacion/officerRoles"

export function NuevaPatrullaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("gobierno")
  const officer = useOfficer()
  const { data: oficiales } = useOficiales()
  const createPatrulla = useCreatePatrulla()

  const STATUS_OPTIONS = [
    { value: "rest", label: t("seguridad.descanso") },
    { value: "active", label: t("seguridad.enCurso") },
  ]

  const rankLabelOf = (role?: string) => {
    const meta = rankMeta(role)
    return meta.labelKey ? t(meta.labelKey) : (meta.label ?? "")
  }

  const roster: { uuid: string; username: string; rankLabel: string }[] =
    oficiales && oficiales.length > 0
      ? oficiales.map((o) => ({
          uuid: o.uuid,
          username: o.username,
          rankLabel: rankLabelOf(o.rank?.role),
        }))
      : [{ uuid: officer.uuid, username: officer.username, rankLabel: officer.rankLabel }]

  const [label, setLabel] = useState("")
  const [fromTime, setFromTime] = useState("22:00")
  const [toTime, setToTime] = useState("06:00")
  const [zone, setZone] = useState("")
  const [status, setStatus] = useState("rest")
  const [officers, setOfficers] = useState<string[]>([])

  useEffect(() => {
    if (open) setOfficers(officer.uuid ? [officer.uuid] : [])
  }, [open, officer.uuid])

  const toggle = (uuid: string) =>
    setOfficers((prev) => (prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid]))

  const submit = () => {
    if (!label.trim() || !fromTime.trim() || !toTime.trim()) return
    createPatrulla.mutate(
      { label, fromTime, toTime, zone: zone.trim() || undefined, status, officers, actorUuid: officer.uuid },
      {
        onSuccess: () => {
          setLabel("")
          setZone("")
          onClose()
        },
      },
    )
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={t("seguridad.nuevoTurnoTitle")} kicker={t("seguridad.nuevoTurnoKicker")}>
      <div className="space-y-3.5">
        <Field label={t("seguridad.nombreTurno")} value={label} onChange={setLabel} placeholder={t("seguridad.nombreTurnoPlaceholder")} />
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("seguridad.desde")} value={fromTime} onChange={setFromTime} placeholder="22:00" mono />
          <Field label={t("seguridad.hasta")} value={toTime} onChange={setToTime} placeholder="06:00" mono />
        </div>
        <Field label={t("seguridad.zona")} value={zone} onChange={setZone} placeholder={t("denuncias.new.townPlaceholder")} />
        <Select label={t("seguridad.estadoInicial")} value={status} onChange={setStatus} options={STATUS_OPTIONS} />

        <div>
          <div className="mb-1.5 font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
            {t("seguridad.agentesAsignados")}
          </div>
          <div className="max-h-[11.25rem] space-y-1.5 overflow-y-auto">
            {roster.map((o) => {
              const on = officers.includes(o.uuid)
              return (
                <button
                  key={o.uuid}
                  type="button"
                  onClick={() => toggle(o.uuid)}
                  className={`flex w-full items-center gap-2.5 rounded-gt-sm border px-2.5 py-[0.4375rem] text-left transition-colors ${
                    on ? "border-gt-dep-seguridad/35 bg-gt-dep-seguridad/12" : "border-gt-line bg-gt-paper-0 hover:bg-gt-paper-1"
                  }`}
                >
                  <Avatar user={o.username} size={26} />
                  <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-gt-ink-800">{o.username}</span>
                  <Badge tone="default">{o.rankLabel}</Badge>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button tone="ghost" onClick={onClose} disabled={createPatrulla.isPending}>
          {t("common.cancel")}
        </Button>
        <Button tone="primary" icon="plus" onClick={submit} disabled={createPatrulla.isPending || !label.trim()}>
          {t("seguridad.crearTurno")}
        </Button>
      </div>
    </Modal>
  )
}
