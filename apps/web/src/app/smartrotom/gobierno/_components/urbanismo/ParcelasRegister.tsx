"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Modal,
  PageHead,
  Select,
  Table,
  TableSkeleton,
  TBody,
  TD,
  TextArea,
  TH,
  THead,
  TR,
} from "../ui"
import { useParcelas, useUpdateParcela, useZonas } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { townName } from "../../_utils/format"
import { hrefOf } from "../../_utils/nav"
import { PARCELA_STATUS, TONES } from "../../_utils/tones"
import type { Parcela, Zona } from "../../_types"
import { Segmented } from "./Segmented"
import { kindOf, statusOf } from "./helpers"

type StatusFilter = "all" | "ocupada" | "vacante" | "embargada" | "subasta"

// The catastro: every WorldGuard plot the government tracks, left-merged with its real
// owner. A plot with no gobierno metadata row yet (`id === null`) comes back with the
// API's own fallback status `sin_registrar` and cannot be PATCHed until it is created
// through some other path — this register can only edit rows that already have one.
export function ParcelasRegister() {
  const t = useTranslations("gobierno")
  const { data, isLoading, isError } = useParcelas({ limit: 100 })
  const { data: zonas } = useZonas()
  const updateParcela = useUpdateParcela()
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const [town, setTown] = useState("all")
  const [zonaFilter, setZonaFilter] = useState("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [editing, setEditing] = useState<Parcela | null>(null)

  const items = useMemo(() => data?.items ?? [], [data])

  const towns = useMemo(() => Array.from(new Set(items.map((p) => p.town))).sort(), [items])

  const zonasByTown = useMemo(() => {
    const map = new Map<string, Zona[]>()
    for (const z of zonas ?? []) {
      const bucket = map.get(z.town) ?? []
      bucket.push(z)
      map.set(z.town, bucket)
    }
    return map
  }, [zonas])
  const zonasById = useMemo(() => new Map((zonas ?? []).map((z) => [z.id, z])), [zonas])

  const townZonas = town === "all" ? [] : (zonasByTown.get(town) ?? [])

  const rows = items.filter((p) => {
    if (town !== "all" && p.town !== town) return false
    if (status !== "all" && p.status !== status) return false
    if (zonaFilter !== "all" && String(p.zonaId ?? "") !== zonaFilter) return false
    return true
  })

  const counts = {
    all: items.length,
    ocupada: items.filter((p) => p.status === "ocupada").length,
    vacante: items.filter((p) => p.status === "vacante").length,
    embargada: items.filter((p) => p.status === "embargada").length,
    subasta: items.filter((p) => p.status === "subasta").length,
  }

  return (
    <div>
      <PageHead
        kicker={t("urbanismo.parcelasKicker")}
        dep="urbanismo"
        title={t("urbanismo.parcelasTitle")}
        sub={t("urbanismo.parcelasSub")}
      />

      {data && data.total > data.items.length && (
        <div className="mb-3 font-gt-mono text-[0.65625rem] text-gt-ink-400">
          {t("urbanismo.mostrando", { shown: data.items.length, total: data.total })}
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: t("urbanismo.todas"), count: counts.all },
            { value: "ocupada", label: t("urbanismo.ocupadas"), count: counts.ocupada },
            { value: "vacante", label: t("urbanismo.vacantes"), count: counts.vacante },
            { value: "embargada", label: t("urbanismo.embargadas"), count: counts.embargada },
            { value: "subasta", label: t("urbanismo.enSubasta"), count: counts.subasta },
          ]}
        />
        <div className="w-[11.875rem]">
          <Select
            value={town}
            onChange={(v) => {
              setTown(v)
              setZonaFilter("all")
            }}
            options={[
              { value: "all", label: t("urbanismo.todosMunicipios") },
              ...towns.map((tn) => ({ value: tn, label: townName(tn) })),
            ]}
          />
        </div>
        {town !== "all" && townZonas.length > 0 && (
          <div className="w-[11.875rem]">
            <Select
              value={zonaFilter}
              onChange={setZonaFilter}
              options={[
                { value: "all", label: t("urbanismo.todosSectores") },
                ...townZonas.map((z) => ({ value: String(z.id), label: z.name })),
              ]}
            />
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : isError ? (
          <Empty icon="alert" title={t("urbanismo.emptyError")} sub={t("urbanismo.emptyErrorSub")} />
        ) : rows.length === 0 ? (
          <Empty
            icon="mapPin"
            title={t("urbanismo.emptyParcelas")}
            sub={items.length === 0 ? t("urbanismo.emptyParcelasSub") : t("urbanismo.emptyParcelasFilter")}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("urbanismo.parcela")}</TH>
                <TH>{t("urbanismo.municipio")}</TH>
                <TH>{t("urbanismo.sector")}</TH>
                <TH>{t("urbanismo.propietario")}</TH>
                <TH>{t("urbanismo.region")}</TH>
                <TH>{t("urbanismo.estado")}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => {
                const zona = p.zona ?? (p.zonaId != null ? zonasById.get(p.zonaId) : null)
                const k = zona ? kindOf(zona.kind, t) : null
                const st = statusOf(p.status, t)
                return (
                  <TR key={p.regionId}>
                    <TD>
                      <span className="font-gt-display text-[0.875rem] font-bold text-gt-ink-900">#{p.number}</span>
                    </TD>
                    <TD>{townName(p.town)}</TD>
                    <TD>
                      {zona && k ? (
                        <span className="flex items-center gap-1.5">
                          <Icon name={k.icon} size={13} style={{ color: TONES[k.tone].css }} />
                          <span className="text-[0.78125rem] text-gt-ink-700">{zona.name}</span>
                        </span>
                      ) : (
                        <span className="text-gt-ink-300">—</span>
                      )}
                    </TD>
                    <TD>
                      {p.owner ? (
                        <button
                          type="button"
                          onClick={() => openDossier(p.owner!.uuid)}
                          className="flex items-center gap-2 rounded-gt-sm py-0.5 pr-1 transition-colors hover:bg-gt-paper-1"
                        >
                          <Avatar user={p.owner.username} size={26} />
                          <span className="font-semibold text-gt-ink-900">{p.owner.username}</span>
                        </button>
                      ) : (
                        <span className="italic text-gt-ink-400">{t("urbanismo.vacante")}</span>
                      )}
                    </TD>
                    <TD>
                      <span className="font-gt-mono text-[0.65625rem] text-gt-ink-400">{p.regionId}</span>
                    </TD>
                    <TD>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </TD>
                    <TD className="text-right">
                      {p.id != null ? (
                        <Button size="sm" tone="plain" onClick={() => setEditing(p)}>
                          {t("urbanismo.editar")}
                        </Button>
                      ) : !p.owner ? (
                        <Link
                          href={hrefOf("subastas")}
                          className="inline-flex items-center gap-1.5 rounded-gt-sm px-[0.6875rem] py-1.5 text-xs font-bold text-gt-accent hover:underline"
                        >
                          <Icon name="gavel" size={13} />
                          {t("urbanismo.subastar")}
                        </Link>
                      ) : null}
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>

      {editing && (
        <ParcelaEditModal
          parcela={editing}
          zonaOptions={zonasByTown.get(editing.town) ?? []}
          saving={updateParcela.isPending}
          onClose={() => setEditing(null)}
          onSave={(body) =>
            updateParcela.mutate(
              { regionId: editing.regionId, ...body },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}
    </div>
  )
}

function ParcelaEditModal({
  parcela,
  zonaOptions,
  saving,
  onClose,
  onSave,
}: {
  parcela: Parcela
  zonaOptions: Zona[]
  saving: boolean
  onClose: () => void
  onSave: (body: { status: string; zonaId: number | null; taxAmount: number; taxDueAt?: string; notes: string }) => void
}) {
  const t = useTranslations("gobierno")
  const [status, setStatus] = useState<string>(parcela.status)
  const [zonaId, setZonaId] = useState(parcela.zonaId != null ? String(parcela.zonaId) : "")
  const [taxAmount, setTaxAmount] = useState(String(parcela.taxAmount ?? 0))
  const [taxDueAt, setTaxDueAt] = useState(parcela.taxDueAt ? parcela.taxDueAt.slice(0, 10) : "")
  const [notes, setNotes] = useState(parcela.notes ?? "")

  const statusOptions = Object.entries(PARCELA_STATUS).map(([value, v]) => ({ value, label: t(v.labelKey) }))

  return (
    <Modal
      open
      onClose={onClose}
      kicker={`${t("urbanismo.parcela")} · ${townName(parcela.town)} #${parcela.number}`}
      title={t("urbanismo.editarParcela")}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            tone="primary"
            disabled={saving}
            onClick={() =>
              onSave({
                status,
                zonaId: zonaId ? Number(zonaId) : null,
                taxAmount: Number(taxAmount) || 0,
                taxDueAt: taxDueAt ? new Date(taxDueAt).toISOString() : undefined,
                notes,
              })
            }
          >
            {saving ? t("common.saving") : t("urbanismo.guardarCambios")}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="font-gt-mono text-[0.65625rem] text-gt-ink-400">{parcela.regionId}</div>
        <Select label={t("urbanismo.estado")} value={status} onChange={setStatus} options={statusOptions} />
        <Select
          label={t("urbanismo.zona")}
          value={zonaId}
          onChange={setZonaId}
          options={[
            { value: "", label: t("urbanismo.sinZona") },
            ...zonaOptions.map((z) => ({ value: String(z.id), label: z.name })),
          ]}
        />
        <Field label={t("urbanismo.cuotaCatastral")} type="number" mono value={taxAmount} onChange={setTaxAmount} />
        <Field label={t("urbanismo.vencimiento")} type="date" value={taxDueAt} onChange={setTaxDueAt} />
        <TextArea label={t("urbanismo.notas")} value={notes} onChange={setNotes} rows={3} placeholder={t("urbanismo.notasPlaceholder")} />
      </div>
    </Modal>
  )
}
