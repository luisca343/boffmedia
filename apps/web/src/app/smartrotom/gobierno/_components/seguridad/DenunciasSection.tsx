"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import { Badge, Button, Card, Empty, Icon, PageHead, Skeleton } from "../ui"
import { Segmented } from "./Segmented"
import { PlayerLink } from "./PlayerLink"
import { NuevaDenunciaModal } from "./NuevaDenunciaModal"
import { DenunciaActionModal, type DenunciaActionKind } from "./DenunciaActionModal"
import { useDenuncias } from "../../_hooks/queries"
import { DENUNCIA_CATEGORY, DENUNCIA_STATUS } from "../../_utils/tones"
import { fmtDateTime, townName } from "../../_utils/format"
import { useFormat } from "@/lib/useFormat"
import type { Denuncia } from "../../_types"

const FILTERS = ["all", "pending", "reviewing", "resolved", "dismissed"] as const
type Filter = (typeof FILTERS)[number]

export function DenunciasSection() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
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
    label: f === "all" ? t("denuncias.filters.all") : t(DENUNCIA_STATUS[f].labelKey),
    count: f === "all" ? rows.length : rows.filter((d) => d.status === f).length,
  }))

  return (
    <>
      <PageHead
        kicker={t("denuncias.kicker")}
        dep="seguridad"
        title={t("denuncias.title")}
        sub={t("denuncias.description")}
        right={
          <Button tone="primary" icon="plus" onClick={() => setNuevaOpen(true)}>
            {t("denuncias.newButton")}
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
          title={t("denuncias.errorTitle")}
          sub={error ? userMessageFrom(error, t("common.retry")) : undefined}
        />
      ) : filtered.length === 0 ? (
        <Empty
          icon="fileText"
          title={
            filter === "all"
              ? t("denuncias.emptyTitle")
              : t("denuncias.emptyFiltered", {
                  status: DENUNCIA_STATUS[filter]?.labelKey ? t(DENUNCIA_STATUS[filter].labelKey) : filter,
                })
          }
          sub={t("denuncias.emptyFilteredBody")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const isOpen = openId === d.id
            const catKey = DENUNCIA_CATEGORY[d.category]
            const catLabel = catKey ? t(catKey) : d.category
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
                      {where && `${where} · `}
                      {t("denuncias.denouncedBy", { username: d.reporter.username, date: fmtDateTime(d.createdAt, intlLocale) })}
                    </div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-2">
                    <Badge tone={DENUNCIA_STATUS[d.status].tone}>{t(DENUNCIA_STATUS[d.status].labelKey)}</Badge>
                    <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={16} className="text-gt-ink-300" />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gt-line-soft px-4 pb-4 pt-3.5">
                    {!actionable && d.resolution ? (
                      <div className="rounded-gt-sm border border-gt-line bg-gt-paper-1 px-3.5 py-3">
                        <div className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
                          {t("denuncias.resolucion")}
                        </div>
                        <p className="mt-1 text-[13px] text-gt-ink-700">{d.resolution ?? "—"}</p>
                        {d.resolvedBy && (
                          <p className="mt-1.5 font-gt-mono text-[10.5px] text-gt-ink-400">
                            {d.resolvedBy.username} · {fmtDateTime(d.resolvedAt, intlLocale)}
                          </p>
                        )}
                      </div>
                    ) : !actionable ? (
                      <p className="text-[12.5px] italic text-gt-ink-400">{t("denuncias.sinAcciones")}</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          tone="ghost"
                          icon="check"
                          onClick={() => setAction({ kind: "resolver", denuncia: d })}
                        >
                          {d.accused ? t("denuncias.resolver") : t("denuncias.resolverArchivar")}
                        </Button>
                        {d.accused && (
                          <Button size="sm" tone="gold" icon="gavel" onClick={() => setAction({ kind: "multa", denuncia: d })}>
                            {t("denuncias.emitirMulta")}
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
                            {t("denuncias.escalarBuscado")}
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
