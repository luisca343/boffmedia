"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { PageHead, Button } from "../_components/ui"
import { StatusTabs } from "../_components/hacienda/StatusTabs"
import { MultaForm } from "../_components/hacienda/MultaForm"
import { MultasStats } from "../_components/hacienda/MultasStats"
import { MultasTable } from "../_components/hacienda/MultasTable"
import { ConfirmModal } from "../_components/hacienda/ConfirmModal"
import { useMultas, useCreateMulta, usePayMulta, useCancelMulta } from "../_hooks/queries"
import { money } from "../_utils/format"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Multa } from "../_types"

// Fetches one generous page rather than building real pagination: this government is
// brand new and every register starts near-empty. If a department ever outgrows one
// page, the "Mostrando X de Y" note below is the honest signal to revisit this.
const PAGE = { pageSize: 200 }

export default function MultasPage() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("all")
  const [payTarget, setPayTarget] = useState<Multa | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Multa | null>(null)

  const { data, isLoading } = useMultas(PAGE)
  const createMulta = useCreateMulta()
  const payMulta = usePayMulta()
  const cancelMulta = useCancelMulta()

  const all = data?.items ?? []
  const rows = filter === "all" ? all : all.filter((m) => m.status === filter)

  return (
    <>
      <PageHead
        kicker={t("hacienda.multasKicker")}
        dep="hacienda"
        title={t("hacienda.multas")}
        sub={t("hacienda.multasSub")}
        right={
          <Button icon="plus" onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("common.cancel") : t("quickActions.emitirMulta")}
          </Button>
        }
      />

      <MultasStats multas={all} />

      {showForm && (
        <MultaForm
          pending={createMulta.isPending}
          onSubmit={(values) =>
            createMulta.mutate(
              { player: values.player, reason: values.reason, amount: values.amount },
              { onSuccess: () => setShowForm(false) },
            )
          }
        />
      )}

      {data && data.total > all.length && (
        <p className="mb-3 font-gt-mono text-[0.65625rem] text-gt-ink-400">
          {t("hacienda.mostrandoMultas", { shown: all.length, total: data.total })}
        </p>
      )}

      <div className="mb-3.5">
        <StatusTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("denuncias.filters.all"), count: all.length },
            { value: "pending", label: t("denuncias.filters.pending"), count: all.filter((m) => m.status === "pending").length },
            { value: "paid", label: t("hacienda.tabPagadas"), count: all.filter((m) => m.status === "paid").length },
            { value: "appealed", label: t("hacienda.tabApeladas"), count: all.filter((m) => m.status === "appealed").length },
            { value: "cancelled", label: t("hacienda.anuladas"), count: all.filter((m) => m.status === "cancelled").length },
          ]}
        />
      </div>

      <MultasTable multas={rows} isLoading={isLoading} onPay={setPayTarget} onCancel={setCancelTarget} />

      <ConfirmModal
        open={payTarget != null}
        onClose={() => setPayTarget(null)}
        onConfirm={() => payTarget && payMulta.mutate(payTarget.id, { onSuccess: () => setPayTarget(null) })}
        pending={payMulta.isPending}
        kicker={t("hacienda.cobroKicker")}
        title={t("hacienda.cobroTitle", { code: payTarget?.code ?? "" })}
        confirmLabel={t("hacienda.cobrar")}
        body={
          payTarget && (
            <>
              {t("hacienda.cobroBodyPrefix")} <strong className="tabular-nums">{money(payTarget.amount, intlLocale)} ₽</strong>{" "}
              {t("hacienda.cobroBodySuffix", { username: payTarget.player.username })}
            </>
          )
        }
      />

      <ConfirmModal
        open={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMulta.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) })}
        pending={cancelMulta.isPending}
        kicker={t("hacienda.anulacionKicker")}
        title={t("hacienda.anulacionTitle", { code: cancelTarget?.code ?? "" })}
        confirmLabel={t("hacienda.anular")}
        tone="danger"
        body={
          cancelTarget && (
            <>
              {t("hacienda.anulacionBodyPrefix")} <strong className="tabular-nums">{money(cancelTarget.amount, intlLocale)} ₽</strong>{" "}
              {t("hacienda.anulacionBodySuffix", { username: cancelTarget.player.username })}
            </>
          )
        }
      />
    </>
  )
}
