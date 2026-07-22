"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Bar, Button, Card, Empty, Field, Icon, Modal, PageHead, Select, Skeleton, TextArea } from "../ui"
import { useCreateZona, useParcelas, useUpdateZona, useZonas } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { townName } from "../../_utils/format"
import { TONES } from "../../_utils/tones"
import type { Zona } from "../../_types"
import { groupBy, kindOf } from "./helpers"

// The land-use directory: municipios on the left, their sectors on the right — each
// sector's occupancy and member plots derived from the real parcelas list, since `zonas`
// itself carries no aggregate counts (the API's `parcelas`/`ocupadas` fields are never
// populated). The handoff's separate "zonas reguladas" overlay (Spawn/Mercado/PvP/Evento)
// has no backing table or endpoint at all — it is dropped rather than faked.
export function ZonasBrowser() {
  const t = useTranslations("gobierno")
  const { data: zonas, isLoading, isError } = useZonas()
  const { data: parcelas } = useParcelas({ limit: 100 })
  const createZona = useCreateZona()
  const updateZona = useUpdateZona()
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const [selectedTown, setSelectedTown] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Zona | null>(null)

  const zonasByTown = useMemo(() => groupBy(zonas ?? [], (z) => z.town), [zonas])
  const towns = useMemo(() => Array.from(zonasByTown.keys()).sort(), [zonasByTown])
  const activeTown = selectedTown ?? towns[0] ?? null

  const parcelasByZona = useMemo(() => groupBy(parcelas?.items ?? [], (p) => p.zonaId ?? -1), [parcelas])

  const townZonas = activeTown ? (zonasByTown.get(activeTown) ?? []) : []

  return (
    <div>
      <PageHead
        kicker={t("zonas.kicker")}
        dep="urbanismo"
        title={t("zonas.title")}
        sub={t("zonas.sub")}
        right={
          <Button icon="plus" tone="gold" onClick={() => setCreating(true)}>
            {t("zonas.nuevaZona")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3.5 md:grid-cols-[258px_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : isError ? (
        <Card>
          <Empty icon="alert" title={t("zonas.errorCarga")} sub={t("zonas.errorCargaSub")} />
        </Card>
      ) : towns.length === 0 ? (
        <Card>
          <Empty icon="layers" title={t("zonas.sinZonas")} sub={t("zonas.sinZonasSub")} />
        </Card>
      ) : (
        <div className="grid items-start gap-[18px] md:grid-cols-[258px_1fr]">
          <Card className="overflow-hidden md:sticky md:top-0">
            <Bar icon="landmark" dep="urbanismo">
              {t("zonas.municipios")}
            </Bar>
            <div className="p-2">
              {towns.map((tn) => {
                const subs = zonasByTown.get(tn) ?? []
                const occ = subs.reduce(
                  (a, z) => a + (z.ocupadas ?? (parcelasByZona.get(z.id) ?? []).filter((p) => p.owner).length),
                  0,
                )
                const tot = subs.reduce((a, z) => a + (z.parcelas ?? (parcelasByZona.get(z.id) ?? []).length), 0)
                const on = tn === activeTown
                return (
                  <button
                    key={tn}
                    type="button"
                    onClick={() => setSelectedTown(tn)}
                    className={`mb-0.5 block w-full rounded-gt-sm border px-[11px] py-[9px] text-left transition-colors ${
                      on ? "border-gt-dep-urbanismo/40 bg-gt-dep-urbanismo/10" : "border-transparent hover:bg-gt-paper-1"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate font-gt-display text-[13.5px] font-bold ${on ? "text-gt-ink-900" : "text-gt-ink-700"}`}
                      >
                        {townName(tn)}
                      </span>
                      <span
                        className={`flex-none font-gt-mono text-[10.5px] font-bold tabular-nums ${on ? "text-gt-dep-urbanismo" : "text-gt-ink-400"}`}
                      >
                        {occ}/{tot}
                      </span>
                    </div>
                    <div className="mt-0.5 font-gt-mono text-[10px] text-gt-ink-400">
                      {t("zonas.sectores", { count: subs.length })}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="font-gt-display text-base font-bold text-gt-ink-900">{townName(activeTown ?? "")}</span>
              <Badge tone="urbanismo">{t("zonas.sectores", { count: townZonas.length })}</Badge>
            </div>
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))" }}>
              {townZonas.map((z) => {
                const k = kindOf(z.kind)
                const members = parcelasByZona.get(z.id) ?? []
                const total = z.parcelas ?? members.length
                const occ = z.ocupadas ?? members.filter((p) => p.owner).length
                const pct = total ? Math.round((occ / total) * 100) : 0
                return (
                  <Card key={z.id} dep={k.tone} className="p-[15px]">
                    <div className="mb-3 flex items-start gap-2.5">
                      <div
                        className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[9px] border"
                        style={{
                          background: `color-mix(in srgb, ${TONES[k.tone].css} 14%, rgb(var(--gt-paper-0)))`,
                          borderColor: `color-mix(in srgb, ${TONES[k.tone].css} 28%, transparent)`,
                        }}
                      >
                        <Icon name={k.icon} size={19} style={{ color: TONES[k.tone].css }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-gt-display text-[15.5px] font-bold leading-tight text-gt-ink-900">{z.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge tone={k.tone}>{k.label}</Badge>
                          <span className="font-gt-mono text-[9.5px] text-gt-ink-300">#{z.id}</span>
                        </div>
                      </div>
                      <Button size="sm" tone="plain" onClick={() => setEditing(z)}>
                        {t("zonas.editarZona")}
                      </Button>
                    </div>
                    <p className="mb-[13px] text-[12px] leading-relaxed text-gt-ink-600">
                      {z.description || k.desc || t("zonas.sinDescripcion")}
                    </p>
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-gt-mono text-[8.5px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
                          {t("zonas.ocupacion")}
                        </span>
                        <span className="font-gt-mono text-[10.5px] font-bold tabular-nums text-gt-ink-600">
                          {occ}/{total}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gt-paper-3">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TONES[k.tone].css }} />
                      </div>
                    </div>
                    {members.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {members.map((p) => (
                          <button
                            key={p.regionId}
                            type="button"
                            disabled={!p.owner}
                            onClick={() => p.owner && openDossier(p.owner.uuid)}
                            title={p.owner ? p.owner.username : "Vacante"}
                            className="inline-flex items-center gap-1 rounded-full border border-gt-line bg-gt-paper-0 px-2 py-0.5 font-gt-mono text-[11px] font-bold text-gt-ink-800 disabled:cursor-default"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: p.owner ? TONES[k.tone].css : TONES.default.css }}
                            />
                            #{p.number}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gt-line-soft pt-[11px]">
                      <span className="font-gt-mono text-[10px] text-gt-ink-400">{townName(z.town)}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {creating && (
        <ZonaFormModal
          title={t("zonas.nuevaZona")}
          initial={{ town: activeTown ?? "", name: "", kind: "residencial", description: "" }}
          saving={createZona.isPending}
          onClose={() => setCreating(false)}
          onSave={(body) => createZona.mutate(body, { onSuccess: () => setCreating(false) })}
        />
      )}
      {editing && (
        <ZonaFormModal
          title={t("zonas.editarZona")}
          initial={{ town: editing.town, name: editing.name, kind: editing.kind, description: editing.description ?? "" }}
          saving={updateZona.isPending}
          onClose={() => setEditing(null)}
          onSave={(body) => updateZona.mutate({ id: editing.id, ...body }, { onSuccess: () => setEditing(null) })}
        />
      )}
    </div>
  )
}

function ZonaFormModal({
  title,
  initial,
  saving,
  onClose,
  onSave,
}: {
  title: string
  initial: { town: string; name: string; kind: string; description: string }
  saving: boolean
  onClose: () => void
  onSave: (body: { town: string; name: string; kind: string; description: string }) => void
}) {
  const t = useTranslations("gobierno")
  const [town, setTown] = useState(initial.town)
  const [name, setName] = useState(initial.name)
  const [kind, setKind] = useState(initial.kind)
  const [description, setDescription] = useState(initial.description)

  const kindOptions = [
    { value: "residencial", label: t("zonas.kindResidencial") },
    { value: "comercial", label: t("zonas.kindComercial") },
    { value: "civico", label: t("zonas.kindCivico") },
    { value: "industrial", label: t("zonas.kindIndustrial") },
    { value: "agricola", label: t("zonas.kindAgricola") },
  ]

  const canSave = town.trim().length > 0 && name.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      kicker={t("zonas.kicker")}
      title={title}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            tone="primary"
            disabled={!canSave || saving}
            onClick={() => onSave({ town: town.trim(), name: name.trim(), kind, description: description.trim() })}
          >
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label={t("zonas.municipioLabel")} value={town} onChange={setTown} placeholder={t("zonas.municipioPlaceholder")} mono />
        <Field label={t("zonas.nombreSector")} value={name} onChange={setName} placeholder={t("zonas.sectorPlaceholder")} />
        <Select label={t("zonas.usoSuelo")} value={kind} onChange={setKind} options={kindOptions} />
        <TextArea label={t("zonas.descripcion")} value={description} onChange={setDescription} rows={3} placeholder={t("zonas.descripcionPlaceholder")} />
      </div>
    </Modal>
  )
}
