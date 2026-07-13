"use client"

import { useMemo, useState } from "react"
import { userMessageFrom } from "@/services/boffAPI"
import { Badge, Button, Card, Empty, Icon, PageHead, Skeleton } from "../ui"
import { Segmented } from "./Segmented"
import { PlayerLink } from "./PlayerLink"
import { NuevaDenunciaModal } from "./NuevaDenunciaModal"
import { DenunciaActionModal, type DenunciaActionKind } from "./DenunciaActionModal"
import { useDenuncias } from "../../_hooks/queries"
import { DENUNCIA_CATEGORY, DENUNCIA_STATUS } from "../../_utils/tones"
import { fmtDateTime, townName } from "../../_utils/format"
import type { Denuncia } from "../../_types"

const FILTERS = ["all", "pending", "reviewing", "resolved", "dismissed"] as const
type Filter = (typeof FILTERS)[number]

export function DenunciasSection() {
  // `limit`/`page` are what ListDenunciasQueryDto actually validates — 100 is its max, and
  // this government is brand new, so client-side tab filtering over one fetch is enough.
  const { data, isLoading, isError, error } = useDenuncias({ limit: 100 })
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<number | null>(null)
  const [nuevaOpen, setNuevaOpen] = useState(false)
  const [action, setAction] = useState<{ kind: DenunciaActionKind; denuncia: Denuncia } | null>(null)

  const rows = data?.items ?? []
  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((d) => d.status === filter)),
    [rows, filter],
  )

  const options = FILTERS.map((f) => ({
    value: f,
    label: f === "all" ? "Todas" : DENUNCIA_STATUS[f].label,
    count: f === "all" ? rows.length : rows.filter((d) => d.status === f).length,
  }))

  return (
    <>
      <PageHead
        kicker="Seguridad · Policía municipal"
        dep="seguridad"
        title="Denuncias"
        sub="Reportes ciudadanos recibidos por la policía. Revisa, multa o escala a busca y captura."
        right={
          <Button tone="primary" icon="plus" onClick={() => setNuevaOpen(true)}>
            Nueva denuncia
          </Button>
        }
      />

      <div className="mb-3.5">
        <Segmented value={filter} onChange={(v) => setFilter(v as Filter)} options={options} tone="seguridad" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[86px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          icon="alert"
          title="No se ha podido cargar el registro"
          sub={error ? userMessageFrom(error, "Inténtalo de nuevo en unos segundos.") : undefined}
        />
      ) : filtered.length === 0 ? (
        <Empty
          icon="fileText"
          title={filter === "all" ? "Sin denuncias registradas" : `Sin denuncias en «${DENUNCIA_STATUS[filter as keyof typeof DENUNCIA_STATUS]?.label ?? filter}»`}
          sub="Cuando lleguen nuevos reportes ciudadanos aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const isOpen = openId === d.id
            const catLabel = DENUNCIA_CATEGORY[d.category] ?? d.category
            const where = d.town ? `${townName(d.town)}${d.plotNumber != null ? ` #${d.plotNumber}` : ""}` : null
            // The resolve endpoint only accepts a denuncia that is still `pending` — there is
            // no route that ever produces `reviewing` (create has no status field, and update
            // can't set one either), so it is a dead status kept only because the real enum
            // includes it. Treat anything past `pending` as closed for the action row.
            const actionable = d.status === "pending"
            return (
              <Card key={d.id} dep="seguridad" className="overflow-hidden p-0">
                {/* A `<div role="button">`, not a real `<button>` — it has to contain
                    PlayerLink's own button, and buttons cannot nest in valid HTML. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(isOpen ? null : d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setOpenId(isOpen ? null : d.id)
                    }
                  }}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start gap-3.5 p-4 text-left"
                >
                  <PlayerLink player={d.accused} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-gt-mono text-[11px] text-gt-ink-400">{d.code}</span>
                      <Badge tone="seguridad">{catLabel}</Badge>
                    </div>
                    <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-gt-ink-600">{d.description}</p>
                    <div className="mt-1.5 font-gt-mono text-[10.5px] text-gt-ink-400">
                      {where && `${where} · `}denunció {d.reporter.username} · {fmtDateTime(d.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-2">
                    <Badge tone={DENUNCIA_STATUS[d.status].tone}>{DENUNCIA_STATUS[d.status].label}</Badge>
                    <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={16} className="text-gt-ink-300" />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gt-line-soft px-4 pb-4 pt-3.5">
                    {!actionable && d.resolution ? (
                      <div className="rounded-gt-sm border border-gt-line bg-gt-paper-1 px-3.5 py-3">
                        <div className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
                          Resolución
                        </div>
                        <p className="mt-1 text-[13px] text-gt-ink-700">{d.resolution ?? "—"}</p>
                        {d.resolvedBy && (
                          <p className="mt-1.5 font-gt-mono text-[10.5px] text-gt-ink-400">
                            {d.resolvedBy.username} · {fmtDateTime(d.resolvedAt)}
                          </p>
                        )}
                      </div>
                    ) : !actionable ? (
                      <p className="text-[12.5px] italic text-gt-ink-400">Sin acciones disponibles.</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          tone="ghost"
                          icon="check"
                          onClick={() => setAction({ kind: "resolver", denuncia: d })}
                        >
                          {d.accused ? "Resolver" : "Resolver / archivar"}
                        </Button>
                        {d.accused && (
                          <Button size="sm" tone="gold" icon="gavel" onClick={() => setAction({ kind: "multa", denuncia: d })}>
                            Emitir multa
                          </Button>
                        )}
                        {d.accused && (
                          <Button
                            size="sm"
                            tone="danger"
                            icon="alert"
                            className="ml-auto"
                            onClick={() => setAction({ kind: "buscado", denuncia: d })}
                          >
                            Escalar a buscado
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <NuevaDenunciaModal open={nuevaOpen} onClose={() => setNuevaOpen(false)} />
      <DenunciaActionModal kind={action?.kind ?? null} denuncia={action?.denuncia ?? null} onClose={() => setAction(null)} />
    </>
  )
}
