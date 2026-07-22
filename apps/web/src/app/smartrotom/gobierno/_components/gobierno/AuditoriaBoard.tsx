"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, Empty, Field, PageHead, Select, Table, TBody, TD, TH, THead, TR, TableSkeleton } from "../ui"
import { FilterTabs } from "../poblacion/FilterTabs"
import { Pager } from "../poblacion/Pager"
import { useAuditoria, useOficiales } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { DEPARTMENTS, type Department, type Tone } from "../../_utils/tones"
import { fmtDateTime } from "../../_utils/format"

const PAGE_SIZE = 30

// The civic-facing slice of the append-only log — scoped server-side to `source: "gobierno"`
// so Administración's «Actividad» rows (which read the same table) never leak in here.
const AUDIT_DEPS: Department[] = ["urbanismo", "seguridad", "hacienda", "justicia", "poblacion", "gobierno"]

export function AuditoriaBoard() {
  const t = useTranslations("gobierno")
  const [dep, setDep] = useState<"all" | Department>("all")
  const [actorUuid, setActorUuid] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const openDossier = useGobiernoUi((s) => s.openDossier)
  const { data: oficiales } = useOficiales()

  const { data, isLoading } = useAuditoria({
    source: "gobierno",
    dep: dep === "all" ? undefined : dep,
    actorUuid: actorUuid || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const items = data?.items ?? []

  const setFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  const handleExport = () => {
    const header = "fecha,funcionario,accion,objeto,departamento"
    const rows = items.map((a) =>
      [fmtDateTime(a.createdAt), a.actor?.username ?? "Sistema", a.action, a.target, a.dep]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auditoria-gobierno-teras-p${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHead
        kicker={t("auditoria.kicker")}
        dep="gold"
        title={t("auditoria.title")}
        sub={t("auditoria.sub")}
        right={
          <Button tone="ghost" icon="download" onClick={handleExport} disabled={items.length === 0}>
            {t("common.export")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FilterTabs
          tone="gold"
          value={dep}
          onChange={setFilter(setDep)}
          options={[
            { value: "all" as const, label: t("auditoria.todo") },
            ...AUDIT_DEPS.map((d) => ({ value: d, label: DEPARTMENTS[d].label })),
          ]}
        />
        <div className="w-full max-w-[200px]">
          <Select
            value={actorUuid}
            onChange={setFilter(setActorUuid)}
            label={t("auditoria.funcionario")}
            options={[{ value: "", label: t("auditoria.todos") }, ...(oficiales ?? []).map((o) => ({ value: o.uuid, label: o.username }))]}
          />
        </div>
        <div className="w-full max-w-[150px]">
          <Field type="date" value={dateFrom} onChange={setFilter(setDateFrom)} label={t("auditoria.desde")} />
        </div>
        <div className="w-full max-w-[150px]">
          <Field type="date" value={dateTo} onChange={setFilter(setDateTo)} label={t("auditoria.hasta")} />
        </div>
      </div>

      <div className="gt-edge-gold rounded-gt border border-gt-line bg-gt-paper-0 shadow-gt">
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : items.length === 0 ? (
          <Empty icon="scroll" title={t("auditoria.emptyTitle")} sub={t("auditoria.emptySub")} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("auditoria.fechaHora")}</TH>
                <TH>{t("auditoria.funcionario")}</TH>
                <TH>{t("auditoria.accion")}</TH>
                <TH>{t("auditoria.objeto")}</TH>
                <TH>{t("auditoria.departamento")}</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((a) => {
                // `dep` on a row is a free-form string (`eventos`, `administracion`… are real
                // values that fall outside the six civic departments this screen filters by),
                // so the lookup is intentionally partial rather than cast to `Department`.
                const meta = (DEPARTMENTS as Partial<Record<string, { label: string; tone: Tone }>>)[a.dep]
                return (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap font-gt-mono text-[11px] text-gt-ink-500">
                      {fmtDateTime(a.createdAt)}
                    </TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() => a.actor && openDossier(a.actor.uuid)}
                        disabled={!a.actor}
                        className="flex items-center gap-2 font-semibold text-gt-ink-900 disabled:cursor-default"
                      >
                        <Avatar user={a.actor?.username} size={24} />
                        {a.actor?.username ?? t("auditoria.sistema")}
                      </button>
                    </TD>
                    <TD>
                      <span className="font-gt-mono text-[10px] font-bold uppercase tracking-[.08em] text-gt-ink-600">
                        {a.action}
                      </span>
                    </TD>
                    <TD className="text-[12.5px]">{a.target}</TD>
                    <TD>
                      <Badge tone={meta?.tone ?? "default"}>{meta?.label ?? a.dep}</Badge>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </div>

      <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
    </div>
  )
}
